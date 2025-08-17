'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { formatCurrency } from '@/lib/month'
import { store } from '@/lib/store'
import type { CategoryWithSpent, Transaction } from '@/lib/models'

interface CategoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryWithSpent | null
  transactions: Transaction[]
}

export function CategoryDetailModal({ isOpen, onClose, category, transactions }: CategoryDetailModalProps) {
  const [notes, setNotes] = useState(category?.notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!category) return null

  const categoryTransactions = transactions
    .filter(tx => tx.category_id === category.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5) // Show last 5 transactions

  const handleSaveNotes = async () => {
    setIsSaving(true)
    try {
      await store.updateCategory(category.id, { notes })
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelNotes = () => {
    setNotes(category.notes || '')
    setIsEditingNotes(false)
  }

  const getHealthColor = () => {
    switch (category.health) {
      case 'overspent': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getHealthText = () => {
    switch (category.health) {
      case 'overspent': return '⚠️ Over Budget'
      case 'warning': return '⚡ Almost Full'
      default: return '✅ On Track'
    }
  }

  const spentPercentage = category.budgeted > 0 ? (category.spent / (category.budgeted + category.borrowed)) * 100 : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getHealthColor()}`}>
              {getHealthText()}
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Budgeted</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(category.budgeted + category.borrowed)}
              </p>
              {category.borrowed !== 0 && (
                <p className="text-xs text-gray-500">
                  ({category.borrowed > 0 ? '+' : ''}{formatCurrency(category.borrowed)} borrowed)
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Spent</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(category.spent)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(spentPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  category.health === 'overspent' ? 'bg-red-500' :
                  category.health === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">₦0</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(category.remaining)} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Notes & Breakdown</h3>
            {!isEditingNotes && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingNotes(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                {category.notes ? 'Edit' : 'Add Notes'}
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add budget breakdown, reminders, or notes...&#10;Example:&#10;• Groceries: ₦15,000&#10;• Restaurants: ₦8,000&#10;• Coffee shops: ₦2,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                rows={6}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCancelNotes}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {category.notes ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {category.notes}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm">No notes yet</p>
                  <p className="text-xs">Add budget breakdowns or reminders</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Transactions</h3>
          {categoryTransactions.length > 0 ? (
            <div className="space-y-2">
              {categoryTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.account}
                      {transaction.is_emergency && (
                        <span className="ml-1 text-red-600">• Emergency</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
              {transactions.filter(tx => tx.category_id === category.id).length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  Showing last 5 transactions
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">💸</div>
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs">Start tracking expenses in this category</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}