// Application store with actions and selectors

import { db } from './db'
import { syncService } from './sync'
import { getCurrentMonth } from './month'
import type { 
  Budget, Income, Category, Transaction, 
  BudgetState, QuickAddData, BorrowData, CategoryWithSpent, CategoryHealth 
} from './models'

export class BudgetStore {
  private currentMonth: string = getCurrentMonth()
  private state: BudgetState = {
    incomes: [],
    categories: [],
    transactions: [],
    loading: false
  }
  private listeners: Array<(state: BudgetState) => void> = []

  // State management
  subscribe(listener: (state: BudgetState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  private setState(updates: Partial<BudgetState>): void {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  getState(): BudgetState {
    return this.state
  }

  getCurrentMonth(): string {
    return this.currentMonth
  }

  async setCurrentMonth(month: string): Promise<void> {
    this.currentMonth = month
    await this.loadMonth(month)
  }

  // Data loading
  async loadMonth(month: string): Promise<void> {
    this.setState({ loading: true })
    
    try {
      let plan = await db.getPlan(month)
      
      // Create a local budget if none exists
      if (!plan?.budget) {
        const budget: Budget = {
          id: crypto.randomUUID(),
          user_id: 'local-user',
          month,
          name: 'My Budget',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted: false
        }
        
        plan = {
          budget,
          incomes: [],
          categories: []
        }
        
        await db.savePlan(month, plan)
      }
      
      const transactions = await db.getTransactionsForMonth(month)
      
      this.setState({
        budget: plan.budget,
        incomes: plan.incomes || [],
        categories: plan.categories || [],
        transactions,
        loading: false
      })
    } catch (error) {
      console.error('Failed to load month:', error)
      this.setState({ loading: false })
    }
  }

  // Income actions
  async addIncome(name: string, amount: number): Promise<void> {
    if (!this.state.budget) return

    const income: Income = {
      id: crypto.randomUUID(),
      budget_id: this.state.budget.id,
      name,
      amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false
    }

    const newIncomes = [...this.state.incomes, income]
    this.setState({ incomes: newIncomes })

    await this.savePlan()
    await db.markForSync(income.id)
  }

  async updateIncome(id: string, updates: Partial<Pick<Income, 'name' | 'amount'>>): Promise<void> {
    const incomes = this.state.incomes.map(income => 
      income.id === id 
        ? { ...income, ...updates, updated_at: new Date().toISOString() }
        : income
    )

    this.setState({ incomes })
    await this.savePlan()
    await db.markForSync(id)
  }

  async deleteIncome(id: string): Promise<void> {
    const incomes = this.state.incomes.filter(income => income.id !== id)
    this.setState({ incomes })
    await this.savePlan()
    await db.markForSync(id)
  }


  // Category actions
  async addCategory(name: string, budgeted: number, color = '#3B82F6'): Promise<void> {
    if (!this.state.budget) return

    const category: Category = {
      id: crypto.randomUUID(),
      budget_id: this.state.budget.id,
      name,
      budgeted,
      borrowed: 0,
      color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false
    }

    const newCategories = [...this.state.categories, category]
    this.setState({ categories: newCategories })

    await this.savePlan()
    await db.markForSync(category.id)
  }

  async updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'budgeted' | 'color' | 'notes'>>): Promise<void> {
    const categories = this.state.categories.map(category => 
      category.id === id 
        ? { ...category, ...updates, updated_at: new Date().toISOString() }
        : category
    )

    this.setState({ categories })
    await this.savePlan()
    await db.markForSync(id)
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = this.state.categories.filter(category => category.id !== id)
    this.setState({ categories })
    await this.savePlan()
    await db.markForSync(id)
  }

  // Borrowing between categories
  async borrowBetweenCategories(data: BorrowData): Promise<void> {
    const { fromCategoryId, toCategoryId, amount } = data
    
    const categories = this.state.categories.map(category => {
      if (category.id === fromCategoryId) {
        return { 
          ...category, 
          borrowed: category.borrowed - amount,
          updated_at: new Date().toISOString()
        }
      }
      if (category.id === toCategoryId) {
        return { 
          ...category, 
          borrowed: category.borrowed + amount,
          updated_at: new Date().toISOString()
        }
      }
      return category
    })

    this.setState({ categories })
    await this.savePlan()
    await db.markForSync(fromCategoryId)
    await db.markForSync(toCategoryId)
  }

  // Transaction actions
  async addTransaction(data: QuickAddData): Promise<void> {
    if (!this.state.budget) return

    // If unplanned is true, clear category_id to make it uncategorized
    const categoryId = data.is_unplanned ? undefined : (data.category_id || undefined)

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      budget_id: this.state.budget.id,
      category_id: categoryId,
      amount: parseFloat(data.amount),
      description: data.description,
      account: data.account,
      is_unplanned: data.is_unplanned,
      date: data.date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false
    }

    const newTransactions = [transaction, ...this.state.transactions]
    this.setState({ transactions: newTransactions })

    await db.saveTransaction(transaction)
    await db.markForSync(transaction.id)
  }

  async updateTransaction(id: string, updates: Partial<Pick<Transaction, 'amount' | 'description' | 'category_id' | 'account' | 'is_unplanned' | 'date'>>): Promise<void> {
    const updatedTransaction = this.state.transactions.find(tx => tx.id === id)
    if (!updatedTransaction) return

    const updated = { ...updatedTransaction, ...updates, updated_at: new Date().toISOString() }
    
    const transactions = this.state.transactions.map(tx => 
      tx.id === id ? updated : tx
    )

    this.setState({ transactions })
    await db.saveTransaction(updated)
    await db.markForSync(id)
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.deleteTransaction(id)
    const transactions = this.state.transactions.filter(tx => tx.id !== id)
    this.setState({ transactions })
    await db.markForSync(id)
  }

  // Copy from previous month with selective options
  async copyFromPreviousMonth(previousMonth: string, options: { incomes: boolean; categories: boolean } = { incomes: true, categories: true }): Promise<void> {
    if (!this.state.budget) return

    const previousPlan = await db.getPlan(previousMonth)
    if (!previousPlan) {
      throw new Error('No previous month data found')
    }

    let newIncomes = [...this.state.incomes]
    let newCategories = [...this.state.categories]

    // Copy incomes if requested
    if (options.incomes && previousPlan.incomes.length > 0) {
      const copiedIncomes = previousPlan.incomes.map(income => ({
        ...income,
        id: crypto.randomUUID(),
        budget_id: this.state.budget!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      newIncomes = [...newIncomes, ...copiedIncomes]
    }

    // Copy categories if requested
    if (options.categories && previousPlan.categories.length > 0) {
      const copiedCategories = previousPlan.categories.map(category => ({
        ...category,
        id: crypto.randomUUID(),
        budget_id: this.state.budget!.id,
        borrowed: 0, // Reset borrowed amounts
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      newCategories = [...newCategories, ...copiedCategories]
    }

    this.setState({
      incomes: newIncomes,
      categories: newCategories
    })

    await this.savePlan()
  }

  // Private helpers
  private async savePlan(): Promise<void> {
    await db.savePlan(this.currentMonth, {
      budget: this.state.budget,
      incomes: this.state.incomes,
      categories: this.state.categories
    })
  }

  // Selectors
  getTotalIncome(): number {
    return this.state.incomes.reduce((sum, income) => sum + income.amount, 0)
  }


  getTotalBudgeted(): number {
    return this.state.categories.reduce((sum, category) => sum + (category.budgeted + category.borrowed), 0)
  }


  getCategoriesWithSpent(): CategoryWithSpent[] {
    return this.state.categories.map(category => {
      const spent = this.state.transactions
        .filter(tx => tx.category_id === category.id)
        .reduce((sum, tx) => sum + tx.amount, 0)
      
      const available = category.budgeted + category.borrowed
      const remaining = available - spent
      
      let health: CategoryHealth = 'healthy'
      if (available === 0) {
        // No budget allocated, so it's healthy regardless of spending
        health = 'healthy'
      } else if (spent > available) {
        health = 'overspent'
      } else if (spent > available * 0.8) {
        health = 'warning'
      }

      return {
        ...category,
        spent,
        remaining,
        health
      }
    })
  }

  getFrequentCategories(): { name: string; count: number }[] {
    const counts: Record<string, number> = {}
    
    this.state.transactions.forEach(tx => {
      if (tx.category_id) {
        const category = this.state.categories.find(c => c.id === tx.category_id)
        if (category) {
          counts[category.name] = (counts[category.name] || 0) + 1
        }
      }
    })

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  getBorrowedLentSummary(): { borrowed: number; lent: number } {
    let borrowed = 0
    let lent = 0

    this.state.categories.forEach(category => {
      if (category.borrowed > 0) {
        borrowed += category.borrowed
      } else if (category.borrowed < 0) {
        lent += Math.abs(category.borrowed)
      }
    })

    return { borrowed, lent }
  }

  getOverspentCategories(): CategoryWithSpent[] {
    return this.getCategoriesWithSpent().filter(category => category.health === 'overspent')
  }

  getUnderBudgetCategories(): CategoryWithSpent[] {
    return this.getCategoriesWithSpent().filter(category => category.remaining > 0)
  }

  getTotalSpent(): number {
    return this.state.transactions.reduce((sum, tx) => sum + tx.amount, 0)
  }

  getTotalOverspent(): number {
    return this.getCategoriesWithSpent()
      .filter(category => category.health === 'overspent')
      .reduce((sum, category) => sum + Math.abs(category.remaining), 0)
  }

  getTotalUnplannedSpent(): number {
    return this.state.transactions
      .filter(tx => tx.is_unplanned)
      .reduce((sum, tx) => sum + tx.amount, 0)
  }

  getBudgetRemaining(): number {
    const totalIncome = this.getTotalIncome()
    const totalSpent = this.getTotalSpent()
    return totalIncome - totalSpent
  }

  // Sync operations
  async syncWithRemote(userId: string): Promise<void> {
    await syncService.fullSync(this.currentMonth, userId)
    await this.loadMonth(this.currentMonth)
  }

  // Local backup operations
  async exportData(): Promise<string> {
    try {
      // Get all data from IndexedDB
      const allData = await db.exportAll()
      
      // Create backup object with metadata
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        app: 'BudgetBoss',
        data: allData
      }
      
      return JSON.stringify(backup, null, 2)
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error('Failed to export data')
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const backup = JSON.parse(jsonData)
      
      // Validate backup structure
      if (!backup.data || !backup.version || backup.app !== 'BudgetBoss') {
        throw new Error('Invalid backup file format')
      }
      
      // Import data to IndexedDB
      await db.importAll(backup.data)
      
      // Reload current month
      await this.loadMonth(this.currentMonth)
      
      console.log('Data imported successfully from backup dated:', backup.exportDate)
    } catch (error) {
      console.error('Import failed:', error)
      throw new Error('Failed to import data: ' + (error as Error).message)
    }
  }

  downloadBackup(): void {
    this.exportData().then(data => {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `budgetboss-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }).catch(error => {
      alert('Export failed: ' + error.message)
    })
  }
}

export const store = new BudgetStore()