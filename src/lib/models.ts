// Core data models for BudgetBoss

export interface Budget {
  id: string
  user_id: string
  month: string // YYYY-MM format
  name: string
  created_at: string
  updated_at: string
  deleted?: boolean
}

export interface BudgetMember {
  id: string
  budget_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export interface Income {
  id: string
  budget_id: string
  name: string
  amount: number
  created_at: string
  updated_at: string
  deleted?: boolean
}

export interface FixedExpense {
  id: string
  budget_id: string
  name: string
  amount: number
  created_at: string
  updated_at: string
  deleted?: boolean
}

export interface Category {
  id: string
  budget_id: string
  name: string
  budgeted: number
  borrowed: number // can be negative if lent out
  color: string
  notes?: string // breakdown notes and reminders
  created_at: string
  updated_at: string
  deleted?: boolean
}

export interface Transaction {
  id: string
  budget_id: string
  category_id?: string
  amount: number
  description: string
  account: string
  is_unplanned: boolean // renamed from is_emergency for better semantics
  date: string
  created_at: string
  updated_at: string
  deleted?: boolean
}

export interface Settings {
  id: string
  user_id: string
  currency: string
  first_day_of_week: number
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

// UI State types
export interface BudgetState {
  budget?: Budget
  incomes: Income[]
  categories: Category[]
  transactions: Transaction[]
  loading: boolean
}

export interface QuickAddData {
  amount: string
  category_id: string
  description: string
  account: string
  is_unplanned: boolean
  date?: string // optional custom date
}

export interface BorrowData {
  fromCategoryId: string
  toCategoryId: string
  amount: number
  month: string
}

// Utility types
export type CategoryHealth = 'healthy' | 'warning' | 'overspent'

export interface CategoryWithSpent extends Category {
  spent: number
  health: CategoryHealth
  remaining: number
}