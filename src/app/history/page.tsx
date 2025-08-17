'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { ConfirmModal } from '@/components/ConfirmModal'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'
import type { BudgetState, Transaction } from '@/lib/models'

export default function HistoryPage() {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({ amount: '', description: '', category_id: '', account: '', is_unplanned: false, date: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const groupedTransactions = state.transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(transaction)
    return acc
  }, {} as Record<string, typeof state.transactions>)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white bg-gray-800 p-4 rounded-lg">Transaction History</h1>
      
      <MonthSwitcher />

      {state.transactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No transactions yet</h2>
            <p className="text-gray-600">Start tracking your expenses to see them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, transactions]) => (
              <Card key={date}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  <div className="space-y-3">
                    {transactions.map((transaction) => {
                      const category = state.categories.find(c => c.id === transaction.category_id)
                      return (
                        <div key={transaction.id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {category && (
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <span className="font-medium text-gray-900">{transaction.description}</span>
                              {transaction.is_unplanned && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Unplanned
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {transaction.is_unplanned ? 'Unplanned Expense' : (category?.name || 'No Category')} • {transaction.account}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(transaction.amount)}
                              </span>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(transaction)}
                                className="text-xs p-1 h-6"
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(transaction.id)}
                                className="text-xs p-1 h-6 text-red-600 hover:text-red-800"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Daily Total</span>
                      <span className="font-semibold">
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