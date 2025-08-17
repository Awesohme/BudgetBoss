// Sync operations between IndexedDB and Supabase

import { supabase } from './supabase'
import { db } from './db'
import type { Budget, Income, FixedExpense, Category, Transaction, Settings } from './models'

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
      const plan = await db.getPlan(month) || { incomes: [], fixedExpenses: [], categories: [] }
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
    const plan = await db.getPlan(month) || { incomes: [], fixedExpenses: [], categories: [] }
    plan.budget = createdBudget
    await db.savePlan(month, plan)
    
    return createdBudget
  }

  async pushPlan(month: string): Promise<void> {
    const localPlan = await db.getPlan(month)
    if (!localPlan) return

    const { budget, incomes, fixedExpenses, categories } = localPlan

    if (budget) {
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
    }

    // Push incomes, fixed expenses, and categories
    for (const income of incomes) {
      await this.pushItem('incomes', income)
    }
    
    for (const expense of fixedExpenses) {
      await this.pushItem('fixed_expenses', expense)
    }
    
    for (const category of categories) {
      await this.pushItem('categories', category)
    }
  }

  async pushTransactions(month: string): Promise<void> {
    const transactions = await db.getTransactionsForMonth(month)
    
    for (const transaction of transactions) {
      await this.pushItem('transactions', transaction)
    }
  }

  private async pushItem(table: string, item: any): Promise<void> {
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
    const budget = await this.ensureBudget(month, userId)
    const budgetId = budget.id

    // Pull all related data
    const [incomesResult, expensesResult, categoriesResult] = await Promise.all([
      supabase
        .from('incomes')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('deleted', false),
      supabase
        .from('fixed_expenses')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('deleted', false),
      supabase
        .from('categories')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('deleted', false)
    ])

    const incomes = incomesResult.data || []
    const fixedExpenses = expensesResult.data || []
    const categories = categoriesResult.data || []

    // Save to local storage
    await db.savePlan(month, {
      budget,
      incomes,
      fixedExpenses,
      categories
    })
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
      // Ensure budget exists and pull plan data
      await this.pullPlan(month, userId)
      
      const plan = await db.getPlan(month)
      if (plan?.budget) {
        // Pull transactions for this budget
        await this.pullTransactions(month, plan.budget.id)
        
        // Push any local changes
        await this.pushPlan(month)
        await this.pushTransactions(month)
      }

      // Update sync state
      const syncState = await db.getSyncState()
      syncState.lastSync = new Date().toISOString()
      await db.setSyncState(syncState)
      
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
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