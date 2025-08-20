'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { QuickAdd } from '@/components/QuickAdd'
import { BorrowModal } from '@/components/BorrowModal'
import { Accordion } from '@/components/Accordion'
import { ExpandableFloatingButton } from '@/components/ExpandableFloatingButton'
import { store } from '@/lib/store'
import { formatCurrency, getCurrentMonth, formatSmartCurrency, getAmountTextSize } from '@/lib/month'
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
  const [syncSuccess, setSyncSuccess] = useState(false)

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
    setSyncSuccess(false)
    try {
      await store.syncWithRemote(user.id)
      // Force reload to show synced data
      await store.loadMonth(store.getCurrentMonth())
      
      // Show success animation
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 2000) // Hide after 2 seconds
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
  const actualLeft = totalIncome - totalBudgeted - totalUnplannedSpent
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container-modern py-6 space-y-8">
        {/* Modern Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">BudgetBoss</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                user 
                  ? 'bg-green-400/20 text-green-100 border border-green-400/30' 
                  : 'bg-orange-400/20 text-orange-100 border border-orange-400/30'
              }`}>
                {user ? 'Online' : 'Offline'}
              </span>
            </div>
            <p 
              className="text-indigo-100 mt-1 cursor-pointer hover:text-white transition-colors"
              onClick={() => window.location.reload()}
            >
              Tap to refresh
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && (
              <Button
                size="sm"
                variant="soft"
                onClick={handleSync}
                disabled={isSyncing}
                loading={isSyncing}
                icon={syncSuccess ? (
                  <span className="inline-block animate-bounce text-green-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-pulse">
                      <path 
                        d="M20 6L9 17l-5-5" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="animate-[draw_0.5s_ease-in-out_forwards]"
                      />
                    </svg>
                  </span>
                ) : (!isSyncing && <span>☁️</span>)}
                className={`transition-all duration-300 ${
                  syncSuccess 
                    ? 'bg-green-500/20 text-green-100 border-green-400/30 hover:bg-green-500/30' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {isSyncing ? 'Syncing...' : syncSuccess ? 'Synced!' : 'Sync'}
              </Button>
            )}
            {!user && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push('/auth')}
                className="bg-white text-indigo-600 hover:bg-gray-50"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Month Switcher */}
        <MonthSwitcher />

        {/* Budget Overview */}
        <Card variant="elevated" className="bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b-0 pb-3">
            <CardTitle size="lg" className="text-gray-800">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Income vs Budget vs Spent */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Income</p>
                <p className={`${getAmountTextSize(totalIncome)} text-green-600 mt-1`}>
                  {formatSmartCurrency(totalIncome, totalIncome > 1000)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Budgeted</p>
                <p className={`${getAmountTextSize(totalBudgeted)} text-blue-600 mt-1`}>
                  {formatSmartCurrency(totalBudgeted, totalBudgeted > 1000)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Spent</p>
                <p className={`${getAmountTextSize(totalSpent)} text-gray-800 mt-1`}>
                  {formatSmartCurrency(totalSpent, totalSpent > 1000)}
                </p>
              </div>
            </div>
          
            {/* Key Metrics */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">💰</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Budget Remaining</span>
                </div>
                <span className={`font-bold text-lg ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(budgetRemaining)}
                </span>
              </div>
              
              {totalOverspent > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm">🚨</span>
                    </div>
                    <span className="text-sm font-medium text-red-700">Total Overspent</span>
                  </div>
                  <span className="font-bold text-lg text-red-600">
                    {formatCurrency(totalOverspent)}
                  </span>
                </div>
              )}
              
              {totalUnplannedSpent > 0 && (
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm">⚡</span>
                    </div>
                    <span className="text-sm font-medium text-orange-700">Unplanned Expenses</span>
                  </div>
                  <span className="font-bold text-lg text-orange-600">
                    {formatCurrency(totalUnplannedSpent)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-100 pt-4">
                <span className="font-medium">Income Allocation Left</span>
                <span className={`font-semibold ${actualLeft >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualLeft)}
                </span>
              </div>
            </div>
        </CardContent>
      </Card>

        {/* Borrowed/Lent Summary */}
        {(borrowedLent.borrowed > 0 || borrowedLent.lent > 0) && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Category Borrowing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Borrowed</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">
                    {formatCurrency(borrowedLent.borrowed)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Lent</p>
                  <p className="text-xl font-bold text-green-600 mt-1">
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
          <Card variant="elevated" className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to BudgetBoss!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Let&apos;s set up your first budget to get started on your financial journey.
              </p>
              <Button 
                onClick={() => router.push('/plan')}
                size="lg"
                icon={<span>🚀</span>}
              >
                Set Up Budget
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expandable Floating Button */}
        <ExpandableFloatingButton
          onAddExpense={() => setIsQuickAddOpen(true)}
          onBorrow={() => setIsBorrowModalOpen(true)}
          borrowDisabled={state.categories.length < 2}
        />

        {/* Modals */}
        <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
        <BorrowModal isOpen={isBorrowModalOpen} onClose={() => setIsBorrowModalOpen(false)} />
      </div>
    </div>
  )
}
