'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { ConfirmModal } from '@/components/ConfirmModal'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'
import { Edit, Trash2, BarChart3 } from 'lucide-react'
import type { BudgetState, Transaction } from '@/lib/models'

export default function HistoryPage() {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({ amount: '', description: '', category_id: '', account: '', is_unplanned: false, date: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilterType, setActiveFilterType] = useState<'date' | 'category' | 'search' | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    store.loadMonth(store.getCurrentMonth())
    return unsubscribe
  }, [])

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category_id: transaction.category_id || '',
      account: transaction.account,
      is_unplanned: transaction.is_unplanned,
      date: new Date(transaction.date).toISOString().slice(0, 16)
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return
    
    setIsSubmitting(true)
    try {
      // If unplanned is true, clear category_id
      const categoryId = formData.is_unplanned ? undefined : (formData.category_id || undefined)
      
      await store.updateTransaction(editingTransaction.id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: categoryId,
        account: formData.account,
        is_unplanned: formData.is_unplanned,
        date: new Date(formData.date).toISOString()
      })
      setEditingTransaction(null)
    } catch (error) {
      console.error('Failed to update transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      onConfirm: () => store.deleteTransaction(id)
    })
  }

  const formatDisplayValue = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[₦,\s]/g, '').replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    if (parts.length > 2) return
    setFormData(prev => ({ ...prev, amount: cleanValue }))
  }

  // Filter transactions based on selected filters
  const filteredTransactions = state.transactions.filter(transaction => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const category = state.categories.find(c => c.id === transaction.category_id)
      const searchText = `${transaction.description} ${category?.name || ''} ${transaction.account}`.toLowerCase()
      if (!searchText.includes(searchLower)) return false
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (filters.category === 'unplanned') {
        if (!transaction.is_unplanned) return false
      } else if (filters.category === 'uncategorized') {
        if (transaction.category_id || transaction.is_unplanned) return false
      } else {
        if (transaction.category_id !== filters.category) return false
      }
    }
    
    // Date range filter
    const transactionDate = new Date(transaction.date).toDateString()
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).toDateString()
      if (transactionDate < fromDate) return false
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo).toDateString()
      if (transactionDate > toDate) return false
    }
    
    return true
  })

  const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(transaction)
    return acc
  }, {} as Record<string, typeof filteredTransactions>)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white bg-gray-800 p-4 rounded-lg">Transaction History</h1>
      
      {/* Month Switcher with Filter */}
      <div className="flex items-center justify-between">
        <MonthSwitcher />
        <button 
          className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.172a1 1 0 01-.293.707l-2 2A1 1 0 0110 22v-6.172a1 1 0 00-.293-.707L3.293 8.707A1 1 0 013 8V4z" />
          </svg>
          <span className="text-sm">Filter</span>
        </button>
      </div>

      {/* Clear Filters */}
      {(filters.category || filters.dateFrom || filters.dateTo || filters.search) && (
        <div className="flex justify-end">
          <button
            onClick={() => setFilters({ category: '', dateFrom: '', dateTo: '', search: '' })}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Expandable Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Add Filter</h3>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group"
                onClick={() => setActiveFilterType('search')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 group-hover:text-purple-700">Search</span>
                </div>
              </div>
              
              <div 
                className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group"
                onClick={() => setActiveFilterType('date')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 group-hover:text-purple-700">Date</span>
                </div>
              </div>
              
              <div 
                className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group"
                onClick={() => setActiveFilterType('category')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 group-hover:text-purple-700">Tag</span>
                </div>
              </div>
            </div>
            
            {/* Filter Input Areas */}
            {activeFilterType === 'search' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Search Transactions</h4>
                <input
                  type="text"
                  placeholder="Search description, category, account..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}
            
            {activeFilterType === 'date' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeFilterType === 'category' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Categories</option>
                  <option value="unplanned">Unplanned Expenses</option>
                  <option value="uncategorized">Uncategorized</option>
                  {state.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {state.transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
            </h2>
            <p className="text-gray-600">
              {state.transactions.length === 0 
                ? 'Start tracking your expenses to see them here' 
                : 'Try adjusting your filters to see more transactions'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, transactions]) => (
              <Card key={date}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-black dark:text-gray-100 mb-4">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  <div className="space-y-4">
                    {transactions.map((transaction) => {
                      const category = state.categories.find(c => c.id === transaction.category_id)
                      return (
                        <div key={transaction.id} className="flex justify-between items-start py-2">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-3 mb-2">
                              {category && (
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <span className="font-medium text-black dark:text-gray-100 leading-5">
                                {transaction.description}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-black dark:text-gray-300 flex items-center space-x-2">
                                <span className="flex-shrink-0">
                                  {transaction.is_unplanned ? '' : (category?.name || 'No Category')}
                                  {!transaction.is_unplanned && ' • '}
                                  {transaction.account}
                                </span>
                                <span className="text-xs text-black dark:text-gray-400">
                                  {new Date(transaction.date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {transaction.is_unplanned && (
                                <span className="text-xs text-black dark:text-red-200 px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0" style={{backgroundColor: '#fdaaaa'}}>
                                  Unplanned Expense
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-semibold text-black dark:text-gray-100">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(transaction)}
                                className="text-xs p-1 h-6 w-6"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(transaction.id)}
                                className="text-xs p-1 h-6 w-6 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-black dark:text-gray-300">Daily Total</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Edit Transaction Modal */}
      <Modal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        title="Edit Transaction"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplayValue(formData.amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              disabled={formData.is_unplanned}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                formData.is_unplanned ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="">No Category</option>
              {state.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formData.is_unplanned && (
              <p className="mt-1 text-xs text-orange-600">
                Unplanned expenses are not tied to any category
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={formData.account}
              onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_unplanned"
              checked={formData.is_unplanned}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                is_unplanned: e.target.checked,
                category_id: e.target.checked ? '' : prev.category_id
              }))}
              className="mr-2"
            />
            <label htmlFor="is_unplanned" className="text-sm text-gray-700">Unplanned expense</label>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingTransaction(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}