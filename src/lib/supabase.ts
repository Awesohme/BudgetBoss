// Supabase client configuration

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'budgetboss-auth-token'
  }
})

// Type-safe table helpers
export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string
          user_id: string
          month: string
          name: string
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
      budget_members: {
        Row: {
          id: string
          budget_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['budget_members']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['budget_members']['Insert']>
      }
      incomes: {
        Row: {
          id: string
          budget_id: string
          name: string
          amount: number
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: Omit<Database['public']['Tables']['incomes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['incomes']['Insert']>
      }
      fixed_expenses: {
        Row: {
          id: string
          budget_id: string
          name: string
          amount: number
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: Omit<Database['public']['Tables']['fixed_expenses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fixed_expenses']['Insert']>
      }
      categories: {
        Row: {
          id: string
          budget_id: string
          name: string
          budgeted: number
          borrowed: number
          color: string
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          budget_id: string
          category_id: string | null
          amount: number
          description: string
          account: string
          is_unplanned: boolean
          date: string
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      settings: {
        Row: {
          id: string
          user_id: string
          currency: string
          first_day_of_week: number
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
    }
  }
}