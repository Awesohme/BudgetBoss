'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { QuickAdd } from '@/components/QuickAdd'
import { BorrowModal } from '@/components/BorrowModal'
import { Accordion } from '@/components/Accordion'
import { store } from '@/lib/store'
import { formatCurrency, getCurrentMonth } from '@/lib/month'
import { syncService } from '@/lib/sync'
import { supabase } from '@/lib/supabase'
import type { BudgetState, User } from '@/lib/models'

export default function HomePage() {
  const router = useRouter()
  const [state, setState] = useState<BudgetState>(store.getState())
  const [user, setUser] = useState<User | null>(null)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    return unsubscribe
  }, [])

  // Force refresh of current month data when component mounts
  useEffect(() => {
    store.loadMonth(store.getCurrentMonth())
  }, [])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check auth state
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          
          // Ensure budget exists and load data
          await syncService.ensureBudget(getCurrentMonth(), session.user.id)
        }
        
        // Load current month data
        await store.loadMonth(store.getCurrentMonth())
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await syncService.ensureBudget(getCurrentMonth(), session.user.id)
        await store.loadMonth(store.getCurrentMonth())
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSync = async () => {
    if (!user) return
    
    setIsSyncing(true)
    try {
      await store.syncWithRemote(user.id)
      // Force reload to show synced data
      await store.loadMonth(store.getCurrentMonth())
    } catch (error) {
      console.error('Sync failed:', error)
      // Show user-friendly error message but don't break the app
      alert('Sync is currently unavailable. Your data is saved locally and will sync when the connection is restored.')
    } finally {
      setIsSyncing(false)
    }
  }

  const categoriesWithSpent = store.getCategoriesWithSpent()
  const totalIncome = store.getTotalIncome()
  const totalBudgeted = store.getTotalBudgeted()
  const totalSpent = store.getTotalSpent()
  const totalOverspent = store.getTotalOverspent()
  const totalUnplannedSpent = store.getTotalUnplannedSpent()
  const budgetRemaining = store.getBudgetRemaining()
  const actualLeft = totalIncome - totalBudgeted
  const borrowedLent = store.getBorrowedLentSummary()

  const overspentCategories = categoriesWithSpent.filter(cat => cat.health === 'overspent')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BudgetBoss...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">BudgetBoss</h1>
            <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">
              {user ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="text-gray-300">
            {user ? `Welcome back!` : 'Offline Mode'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Temporary manual refresh button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.location.reload()}
            className="text-white hover:bg-gray-700"
          >
            🔄 Refresh
          </Button>
          
          {user && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? '🔄' : '☁️'} {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          )}
          {!user && (
            <Button
              size="sm"
              onClick={() => router.push('/auth')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Month Switcher */}
      <MonthSwitcher />

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Income vs Budget vs Spent */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-600">Income</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Budgeted</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(totalBudgeted)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Spent</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">💰 Budget Remaining</span>
              <span className={`font-bold text-lg ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budgetRemaining)}
              </span>
            </div>
            
            {totalOverspent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">🚨 Total Overspent</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(totalOverspent)}
                </span>
              </div>
            )}
            
            {totalUnplannedSpent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">⚡ Unplanned Expenses</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(totalUnplannedSpent)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
              <span>Budget Allocation Left</span>
              <span className={actualLeft >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(actualLeft)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borrowed/Lent Summary */}
      {(borrowedLent.borrowed > 0 || borrowedLent.lent > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Category Borrowing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Borrowed</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(borrowedLent.borrowed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Lent</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(borrowedLent.lent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attention Needed - Only Overspent Categories */}
      {overspentCategories.length > 0 && (
        <Accordion 
          title={`⚠️ Attention Needed (${overspentCategories.length})`}
          defaultOpen={false}
          className="bg-white"
        >
          <div className="space-y-3">
            {overspentCategories.map(category => (
              <div key={category.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-900">{category.name}</span>
                  <span className="text-red-700">
                    Overspent by {formatCurrency(Math.abs(category.remaining))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setIsQuickAddOpen(true)} className="w-full">
              💰 Add Transaction
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsBorrowModalOpen(true)}
              className="w-full"
              disabled={state.categories.length < 2}
            >
              🔄 Borrow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {state.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5).map((transaction) => {
                const category = state.categories.find(c => c.id === transaction.category_id)
                return (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.is_unplanned ? 'Unplanned Expense' : (category?.name || 'No Category')} • {transaction.account}
                        {transaction.is_unplanned && <span className="text-orange-600"> • Unplanned</span>}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
            {state.transactions.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/history')}
                className="w-full mt-3"
              >
                View All Transactions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Prompts */}
      {!state.budget && (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Welcome to BudgetBoss!</h3>
            <p className="text-gray-600 mb-4">
              Let&apos;s set up your first budget to get started.
            </p>
            <Button onClick={() => router.push('/plan')}>
              🚀 Set Up Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <BorrowModal isOpen={isBorrowModalOpen} onClose={() => setIsBorrowModalOpen(false)} />
    </div>
  )
}
