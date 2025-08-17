// Sync operations between IndexedDB and Supabase

import { supabase } from './supabase'
import { db } from './db'
import type { Budget } from './models'

export class SyncService {
  
  async ensureBudget(month: string, userId: string): Promise<Budget> {
    // Check local storage first
    const localPlan = await db.getPlan(month)
    if (localPlan?.budget) {
      return localPlan.budget
    }

    // Check Supabase
    const { data: remoteBudget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('deleted', false)
      .single()

    if (remoteBudget) {
      // Save to local storage
      const plan = await db.getPlan(month) || { incomes: [], categories: [] }
      plan.budget = remoteBudget
      await db.savePlan(month, plan)
      return remoteBudget
    }

    // Create new budget
    const newBudget: Omit<Budget, 'id' | 'created_at'> = {
      user_id: userId,
      month,
      name: 'My Budget',
      updated_at: new Date().toISOString(),
      deleted: false
    }

    const { data: createdBudget, error } = await supabase
      .from('budgets')
      .insert(newBudget)
      .select()
      .single()

    if (error) throw error

    // Save to local storage
    const plan = await db.getPlan(month) || { incomes: [], categories: [] }
    plan.budget = createdBudget
    await db.savePlan(month, plan)
    
    return createdBudget
  }

  async pushPlan(month: string): Promise<void> {
    const localPlan = await db.getPlan(month)
    if (!localPlan) return

    const { budget, incomes, categories } = localPlan

    if (budget) {
      try {
        // Use Last Write Wins strategy based on updated_at
        const { data: remoteBudget } = await supabase
          .from('budgets')
          .select('updated_at')
          .eq('id', budget.id)
          .single()

        if (!remoteBudget || new Date(budget.updated_at) > new Date(remoteBudget.updated_at)) {
          await supabase
            .from('budgets')
            .upsert({
              id: budget.id,
              user_id: budget.user_id,
              month: budget.month,
              name: budget.name,
              updated_at: budget.updated_at,
              deleted: budget.deleted || false
            })
        }
      } catch (budgetError) {
        // Budget might not exist remotely yet, try to create it
        console.log('Creating budget remotely:', budget.id)
        try {
          await supabase
            .from('budgets')
            .insert({
              id: budget.id,
              user_id: budget.user_id,
              month: budget.month,
              name: budget.name,
              updated_at: budget.updated_at,
              deleted: budget.deleted || false
            })
        } catch (insertError) {
          console.warn('Failed to create budget remotely:', insertError)
        }
      }
    }

    // Push incomes and categories
    for (const income of incomes) {
      try {
        await this.pushItem('incomes', income as unknown as { id: string; updated_at: string; [key: string]: unknown })
      } catch (error) {
        console.warn('Failed to push income:', income.id, error)
      }
    }
    
    for (const category of categories) {
      try {
        await this.pushItem('categories', category as unknown as { id: string; updated_at: string; [key: string]: unknown })
      } catch (error) {
        console.warn('Failed to push category:', category.id, error)
      }
    }
  }

  async pushTransactions(month: string): Promise<void> {
    const transactions = await db.getTransactionsForMonth(month)
    
    for (const transaction of transactions) {
      await this.pushItem('transactions', transaction as unknown as { id: string; updated_at: string; [key: string]: unknown })
    }
  }

  private async pushItem(table: string, item: { id: string; updated_at: string; [key: string]: unknown }): Promise<void> {
    const { data: remoteItem } = await supabase
      .from(table)
      .select('updated_at')
      .eq('id', item.id)
      .single()

    if (!remoteItem || new Date(item.updated_at) > new Date(remoteItem.updated_at)) {
      await supabase
        .from(table)
        .upsert(item)
    }
  }

  async pullPlan(month: string, userId: string): Promise<void> {
    // Get local plan first to preserve existing data
    const localPlan = await db.getPlan(month)
    
    try {
      const budget = await this.ensureBudget(month, userId)
      const budgetId = budget.id

      // Pull all related data
      const [incomesResult, categoriesResult] = await Promise.all([
        supabase
          .from('incomes')
          .select('*')
          .eq('budget_id', budgetId)
          .eq('deleted', false),
        supabase
          .from('categories')
          .select('*')
          .eq('budget_id', budgetId)
          .eq('deleted', false)
      ])

      const remoteIncomes = incomesResult.data || []
      const remoteCategories = categoriesResult.data || []

      // Advanced merge using Last Write Wins strategy
      const finalIncomes = this.mergeArraysWithTimestamps(
        localPlan?.incomes || [], 
        remoteIncomes
      )
      
      const finalCategories = this.mergeArraysWithTimestamps(
        localPlan?.categories || [], 
        remoteCategories
      )

      // Save merged data to local storage
      await db.savePlan(month, {
        budget,
        incomes: finalIncomes,
        categories: finalCategories
      })
    } catch (error) {
      // If sync fails, keep local data intact
      console.warn('Failed to sync from remote, keeping local data:', error)
      if (localPlan) {
        // Just ensure we have a budget structure
        const budget = localPlan.budget || {
          id: crypto.randomUUID(),
          user_id: 'local-user',
          month,
          name: 'My Budget',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted: false
        }
        
        await db.savePlan(month, {
          budget,
          incomes: localPlan.incomes || [],
          categories: localPlan.categories || []
        })
      }
      throw error
    }
  }

  private mergeArraysWithTimestamps<T extends { id: string; updated_at: string }>(
    localItems: T[], 
    remoteItems: T[]
  ): T[] {
    // Create a map of all items by ID
    const itemsMap = new Map<string, T>()
    
    // Add local items first
    for (const item of localItems) {
      itemsMap.set(item.id, item)
    }
    
    // Merge remote items using Last Write Wins
    for (const remoteItem of remoteItems) {
      const localItem = itemsMap.get(remoteItem.id)
      
      if (!localItem) {
        // New item from remote
        itemsMap.set(remoteItem.id, remoteItem)
      } else {
        // Item exists in both - use Last Write Wins
        const localTime = new Date(localItem.updated_at).getTime()
        const remoteTime = new Date(remoteItem.updated_at).getTime()
        
        if (remoteTime > localTime) {
          // Remote is newer - use remote version
          itemsMap.set(remoteItem.id, remoteItem)
        }
        // else: local is newer or same - keep local version
      }
    }
    
    // Return merged array sorted by creation time
    return Array.from(itemsMap.values()).sort((a, b) => 
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )
  }

  async pullTransactions(month: string, budgetId: string): Promise<void> {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('budget_id', budgetId)
      .gte('date', `${month}-01`)
      .lt('date', `${month}-32`) // Safe upper bound
      .eq('deleted', false)

    if (transactions) {
      for (const transaction of transactions) {
        await db.saveTransaction(transaction)
      }
    }
  }

  async fullSync(month: string, userId: string): Promise<void> {
    try {
      // Get local data first to preserve it
      const localPlan = await db.getPlan(month)
      
      // Step 1: Push local changes first (in case local is ahead)
      console.log('🔄 Pushing local changes...')
      try {
        if (localPlan && (localPlan.incomes.length > 0 || localPlan.categories.length > 0)) {
          await this.pushPlan(month)
          await this.pushTransactions(month)
        }
      } catch (pushError) {
        console.warn('Push failed, will continue with pull:', pushError)
      }
      
      // Step 2: Pull and merge remote changes using Last Write Wins
      console.log('🔄 Pulling and merging remote changes...')
      try {
        await this.pullPlan(month, userId)
      } catch (pullError) {
        console.warn('Pull failed:', pullError)
        // If pull fails completely, ensure we still have a budget structure
        if (localPlan) {
          const budget = localPlan.budget || {
            id: crypto.randomUUID(),
            user_id: userId,
            month,
            name: 'My Budget',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted: false
          }
          
          await db.savePlan(month, {
            budget,
            incomes: localPlan.incomes || [],
            categories: localPlan.categories || []
          })
        }
      }
      
      const plan = await db.getPlan(month)
      if (plan?.budget) {
        // Step 3: Sync transactions
        try {
          await this.pullTransactions(month, plan.budget.id)
          await this.pushTransactions(month)
        } catch (transactionError) {
          console.warn('Transaction sync failed:', transactionError)
        }
      }

      // Update sync state
      const syncState = await db.getSyncState()
      syncState.lastSync = new Date().toISOString()
      await db.setSyncState(syncState)
      
      console.log('✅ Sync completed successfully')
      
    } catch (error) {
      console.error('Sync failed completely:', error)
      // Don't re-throw - let the app continue working offline
      throw new Error('Sync unavailable - continuing in offline mode')
    }
  }

  async syncSettings(userId: string): Promise<void> {
    const localSettings = await db.getSettings()
    
    // Pull remote settings
    const { data: remoteSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (remoteSettings) {
      // Use remote if local doesn't exist or remote is newer
      if (!localSettings || new Date(remoteSettings.updated_at) > new Date(localSettings.updated_at)) {
        await db.saveSettings(remoteSettings)
      } else if (new Date(localSettings.updated_at) > new Date(remoteSettings.updated_at)) {
        // Push local to remote
        await supabase
          .from('settings')
          .upsert(localSettings)
      }
    } else if (localSettings) {
      // Push local settings to remote
      await supabase
        .from('settings')
        .insert(localSettings)
    }
  }
}

export const syncService = new SyncService()