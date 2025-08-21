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
    
    // Update pattern tracking for non-unplanned transactions
    if (!data.is_unplanned && categoryId) {
      await db.updatePattern(data.description, categoryId, parseFloat(data.amount))
    }
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

  getMostExpensiveCategories(): { name: string; spent: number; color: string }[] {
    const categoriesWithSpent = this.getCategoriesWithSpent()
    
    return categoriesWithSpent
      .filter(category => category.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(category => ({
        name: category.name,
        spent: category.spent,
        color: category.color
      }))
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

  // Amount that should be in bank (budget remaining - unplanned expenses)
  getBudgetRemaining(): number {
    const totalBudgeted = this.getTotalBudgeted()
    const totalSpent = this.getTotalSpent()
    const totalUnplanned = this.getTotalUnplannedSpent()
    
    // Budget remaining minus unplanned expenses = what should be in bank
    return (totalBudgeted - totalSpent) - totalUnplanned
  }

  // Income allocation left (unbudgeted money)
  getIncomeAllocationLeft(): number {
    const totalIncome = this.getTotalIncome()
    const totalBudgeted = this.getTotalBudgeted()
    return totalIncome - totalBudgeted
  }

  async getFrequentPatterns(): Promise<Array<{ description: string; categoryName: string; amount: number; categoryId: string }>> {
    const patterns = await db.getFrequentPatterns()
    
    return patterns.map(pattern => {
      const category = this.state.categories.find(c => c.id === pattern.category_id)
      return {
        description: pattern.description,
        categoryName: category?.name || 'Unknown',
        amount: pattern.last_amount,
        categoryId: pattern.category_id
      }
    }).filter(p => p.categoryName !== 'Unknown') // Only show patterns with valid categories
  }

  // Sync operations
  async syncWithRemote(userId: string): Promise<void> {
    await syncService.fullSync(this.currentMonth, userId)
    await this.loadMonth(this.currentMonth)
  }

  // Excel Export functionality
  /* eslint-disable @typescript-eslint/no-explicit-any */
  async exportToExcel(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const ExcelJS = (await import('exceljs')).default
      
      // Get all available months from IndexedDB
      const allMonths = await db.getAllStoredMonths()
      
      // Create workbook
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'BudgetBoss'
      workbook.created = new Date()
      
      // Collect all data
      const allMonthsData: any[] = []
      const allTransactions: any[] = []
      const categoryStats = new Map<string, any>()
      const incomeStats = new Map<string, any>()
      const unplannedTransactions: any[] = []
      
      for (const month of allMonths) {
        const planData = await db.getPlan(month)
        const transactions = await db.getTransactionsForMonth(month)
        
        if (planData) {
          // Calculate month totals
          const totalIncome = planData.incomes.reduce((sum, inc) => sum + inc.amount, 0)
          const totalBudgeted = planData.categories.reduce((sum, cat) => sum + cat.budgeted, 0)
          const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
          const totalOverspent = planData.categories.reduce((sum, cat) => {
            const categorySpent = transactions
              .filter(tx => tx.category_id === cat.id && !tx.is_unplanned)
              .reduce((s, tx) => s + tx.amount, 0)
            return sum + Math.max(0, categorySpent - cat.budgeted)
          }, 0)
          const totalUnplanned = transactions
            .filter(tx => tx.is_unplanned)
            .reduce((sum, tx) => sum + tx.amount, 0)
          
          allMonthsData.push({
            month,
            totalIncome,
            totalBudgeted,
            totalSpent,
            remaining: totalIncome - totalSpent,
            overspent: totalOverspent,
            unplanned: totalUnplanned
          })
          
          // Collect transactions
          transactions.forEach(tx => {
            const category = planData.categories.find(c => c.id === tx.category_id)
            allTransactions.push({
              ...tx,
              month,
              categoryName: category?.name || 'Unknown'
            })
            
            if (tx.is_unplanned) {
              unplannedTransactions.push({
                ...tx,
                month,
                categoryName: category?.name || 'Unplanned'
              })
            }
          })
          
          // Collect category stats
          planData.categories.forEach(cat => {
            const categorySpent = transactions
              .filter(tx => tx.category_id === cat.id && !tx.is_unplanned)
              .reduce((sum, tx) => sum + tx.amount, 0)
            
            if (!categoryStats.has(cat.name)) {
              categoryStats.set(cat.name, {
                totalBudgeted: 0,
                totalSpent: 0,
                timesOverspent: 0,
                monthCount: 0
              })
            }
            
            const stats = categoryStats.get(cat.name)
            stats.totalBudgeted += cat.budgeted
            stats.totalSpent += categorySpent
            stats.monthCount += 1
            if (categorySpent > cat.budgeted) {
              stats.timesOverspent += 1
            }
          })
          
          // Collect income stats
          planData.incomes.forEach(inc => {
            if (!incomeStats.has(inc.name)) {
              incomeStats.set(inc.name, {
                totalAmount: 0,
                monthCount: 0,
                avgAmount: 0
              })
            }
            
            const stats = incomeStats.get(inc.name)
            stats.totalAmount += inc.amount
            stats.monthCount += 1
            stats.avgAmount = stats.totalAmount / stats.monthCount
          })
        }
      }
      
      // Create sheets
      await this.createSummarySheet(workbook, allMonthsData)
      await this.createMonthlyBreakdownSheet(workbook, allMonths)
      await this.createTransactionsSheet(workbook, allTransactions)
      await this.createCategoryPerformanceSheet(workbook, categoryStats)
      await this.createIncomeAnalysisSheet(workbook, incomeStats)
      await this.createUnplannedExpensesSheet(workbook, unplannedTransactions)
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BudgetBoss_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Excel export failed:', error)
      throw new Error('Failed to export data to Excel')
    }
  }

  private async createSummarySheet(workbook: any, allMonthsData: any[]): Promise<void> {
    const sheet = workbook.addWorksheet('Summary')
    
    // Headers
    sheet.addRow(['Month', 'Total Income', 'Total Budgeted', 'Total Spent', 'Remaining', 'Overspent', 'Unplanned'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    // Data rows
    allMonthsData.forEach(data => {
      sheet.addRow([
        data.month,
        `₦${data.totalIncome.toLocaleString()}`,
        `₦${data.totalBudgeted.toLocaleString()}`,
        `₦${data.totalSpent.toLocaleString()}`,
        `₦${data.remaining.toLocaleString()}`,
        `₦${data.overspent.toLocaleString()}`,
        `₦${data.unplanned.toLocaleString()}`
      ])
    })
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 15
    })
  }

  private async createMonthlyBreakdownSheet(workbook: any, allMonths: string[]): Promise<void> {
    const sheet = workbook.addWorksheet('Monthly_Breakdown')
    
    // Headers
    sheet.addRow(['Month', 'Category', 'Budgeted', 'Spent', 'Remaining', 'Status'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    // Data rows
    for (const month of allMonths) {
      const planData = await db.getPlan(month)
      const transactions = await db.getTransactionsForMonth(month)
      
      if (planData) {
        planData.categories.forEach(cat => {
          const categorySpent = transactions
            .filter(tx => tx.category_id === cat.id && !tx.is_unplanned)
            .reduce((sum, tx) => sum + tx.amount, 0)
          
          const remaining = cat.budgeted - categorySpent
          const status = remaining >= 0 ? 'Healthy' : 'Overspent'
          
          sheet.addRow([
            month,
            cat.name,
            `₦${cat.budgeted.toLocaleString()}`,
            `₦${categorySpent.toLocaleString()}`,
            `₦${remaining.toLocaleString()}`,
            status
          ])
        })
      }
    }
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 15
    })
  }

  private async createTransactionsSheet(workbook: any, allTransactions: any[]): Promise<void> {
    const sheet = workbook.addWorksheet('All_Transactions')
    
    // Headers
    sheet.addRow(['Date', 'Month', 'Category', 'Description', 'Amount', 'Account', 'Unplanned'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    // Data rows
    allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(tx => {
        sheet.addRow([
          new Date(tx.date).toLocaleDateString(),
          tx.month,
          tx.categoryName,
          tx.description,
          `₦${tx.amount.toLocaleString()}`,
          tx.account,
          tx.is_unplanned ? 'Yes' : 'No'
        ])
      })
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 15
    })
  }

  private async createCategoryPerformanceSheet(workbook: any, categoryStats: Map<string, any>): Promise<void> {
    const sheet = workbook.addWorksheet('Category_Performance')
    
    // Headers
    sheet.addRow(['Category', 'Total Budgeted', 'Total Spent', 'Avg Monthly Budget', 'Times Overspent', 'Performance'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    // Data rows
    Array.from(categoryStats.entries()).forEach(([name, stats]) => {
      const avgBudget = stats.totalBudgeted / stats.monthCount
      const spentRatio = stats.totalSpent / stats.totalBudgeted
      const performance = spentRatio <= 0.8 ? 'Excellent' : 
                         spentRatio <= 1.0 ? 'Good' : 
                         spentRatio <= 1.2 ? 'Needs Attention' : 'Needs Work'
      
      sheet.addRow([
        name,
        `₦${stats.totalBudgeted.toLocaleString()}`,
        `₦${stats.totalSpent.toLocaleString()}`,
        `₦${avgBudget.toLocaleString()}`,
        stats.timesOverspent,
        performance
      ])
    })
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 18
    })
  }

  private async createIncomeAnalysisSheet(workbook: any, incomeStats: Map<string, any>): Promise<void> {
    const sheet = workbook.addWorksheet('Income_Analysis')
    
    // Headers
    sheet.addRow(['Income Source', 'Total Amount', 'Average Monthly', 'Months Active', 'Contribution %'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    const totalIncome = Array.from(incomeStats.values()).reduce((sum, stats) => sum + stats.totalAmount, 0)
    
    // Data rows
    Array.from(incomeStats.entries()).forEach(([name, stats]) => {
      const contribution = ((stats.totalAmount / totalIncome) * 100).toFixed(1)
      
      sheet.addRow([
        name,
        `₦${stats.totalAmount.toLocaleString()}`,
        `₦${stats.avgAmount.toLocaleString()}`,
        stats.monthCount,
        `${contribution}%`
      ])
    })
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 18
    })
  }

  private async createUnplannedExpensesSheet(workbook: any, unplannedTransactions: any[]): Promise<void> {
    const sheet = workbook.addWorksheet('Unplanned_Expenses')
    
    // Headers
    sheet.addRow(['Date', 'Month', 'Description', 'Amount', 'Account', 'Frequency'])
    
    // Style headers
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } }
    
    // Group by description to show frequency
    const descriptionCounts = new Map()
    unplannedTransactions.forEach(tx => {
      descriptionCounts.set(tx.description, (descriptionCounts.get(tx.description) || 0) + 1)
    })
    
    // Data rows
    unplannedTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(tx => {
        sheet.addRow([
          new Date(tx.date).toLocaleDateString(),
          tx.month,
          tx.description,
          `₦${tx.amount.toLocaleString()}`,
          tx.account,
          descriptionCounts.get(tx.description)
        ])
      })
    
    // Auto-fit columns
    sheet.columns.forEach((column: any) => {
      column.width = 18
    })
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

}

export const store = new BudgetStore()