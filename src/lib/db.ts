// IndexedDB layer for offline storage using idb-keyval

import { get, set, del, keys } from 'idb-keyval'
import type { Budget, Income, FixedExpense, Category, Transaction, Settings } from './models'

// Storage keys
const PLAN_KEY = (month: string) => `plan:${month}`
const TX_KEY = (id: string) => `tx:${id}`
const TX_INDEX_KEY = (month: string) => `txindex:${month}`
const SETTINGS_KEY = 'settings'
const SYNC_STATE_KEY = 'syncState'

// Transaction index to track all transaction IDs for a month
interface TransactionIndex {
  month: string
  transactionIds: string[]
}

interface SyncState {
  lastSync: string | null
  pendingChanges: string[] // IDs of items that need syncing
}

// Plan data structure (combined budget data for a month)
interface PlanData {
  budget?: Budget
  incomes: Income[]
  fixedExpenses: FixedExpense[]
  categories: Category[]
}

export const db = {
  // Plan operations
  async savePlan(month: string, data: PlanData): Promise<void> {
    await set(PLAN_KEY(month), data)
  },

  async getPlan(month: string): Promise<PlanData | null> {
    try {
      const data = await get(PLAN_KEY(month))
      return data || null
    } catch {
      return null
    }
  },

  async deletePlan(month: string): Promise<void> {
    await del(PLAN_KEY(month))
  },

  // Transaction operations
  async saveTransaction(tx: Transaction): Promise<void> {
    await set(TX_KEY(tx.id), tx)
    
    // Update transaction index
    const month = tx.date.substring(0, 7) // Extract YYYY-MM from date
    const index = await this.getTransactionIndex(month)
    if (!index.transactionIds.includes(tx.id)) {
      index.transactionIds.push(tx.id)
      await set(TX_INDEX_KEY(month), index)
    }
  },

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const result = await get(TX_KEY(id))
      return result || null
    } catch {
      return null
    }
  },

  async getTransactionsForMonth(month: string): Promise<Transaction[]> {
    const index = await this.getTransactionIndex(month)
    const transactions: Transaction[] = []
    
    for (const id of index.transactionIds) {
      const tx = await this.getTransaction(id)
      if (tx && !tx.deleted) {
        transactions.push(tx)
      }
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async deleteTransaction(id: string): Promise<void> {
    const tx = await this.getTransaction(id)
    if (tx) {
      // Mark as deleted instead of actually deleting
      const deletedTx = { ...tx, deleted: true, updated_at: new Date().toISOString() }
      await set(TX_KEY(id), deletedTx)
    }
  },

  async getTransactionIndex(month: string): Promise<TransactionIndex> {
    try {
      const index = await get(TX_INDEX_KEY(month))
      return index || { month, transactionIds: [] }
    } catch {
      return { month, transactionIds: [] }
    }
  },

  // Settings operations
  async saveSettings(settings: Settings): Promise<void> {
    await set(SETTINGS_KEY, settings)
  },

  async getSettings(): Promise<Settings | null> {
    try {
      const result = await get(SETTINGS_KEY)
      return result || null
    } catch {
      return null
    }
  },

  // Sync state operations
  async getSyncState(): Promise<SyncState> {
    try {
      const state = await get(SYNC_STATE_KEY)
      return state || { lastSync: null, pendingChanges: [] }
    } catch {
      return { lastSync: null, pendingChanges: [] }
    }
  },

  async setSyncState(state: SyncState): Promise<void> {
    await set(SYNC_STATE_KEY, state)
  },

  async markForSync(id: string): Promise<void> {
    const state = await this.getSyncState()
    if (!state.pendingChanges.includes(id)) {
      state.pendingChanges.push(id)
      await this.setSyncState(state)
    }
  },

  async markSynced(id: string): Promise<void> {
    const state = await this.getSyncState()
    state.pendingChanges = state.pendingChanges.filter(changeId => changeId !== id)
    await this.setSyncState(state)
  },

  // Utility functions
  async getAllStoredMonths(): Promise<string[]> {
    const allKeys = await keys()
    const planKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith('plan:')) as string[]
    return planKeys.map(key => key.replace('plan:', ''))
  },

  async clearAllData(): Promise<void> {
    const allKeys = await keys()
    for (const key of allKeys) {
      await del(key)
    }
  }
}