'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'
import type { BudgetState, BorrowData } from '@/lib/models'

interface BorrowModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BorrowModal({ isOpen, onClose }: BorrowModalProps) {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [formData, setFormData] = useState<Omit<BorrowData, 'month'>>({
    fromCategoryId: '',
    toCategoryId: '',
    amount: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isOpen && state.categories.length > 0) {
      setFormData({
        fromCategoryId: state.categories[0].id,
        toCategoryId: state.categories.length > 1 ? state.categories[1].id : '',
        amount: 0
      })
      setError('')
    }
  }, [isOpen, state.categories])

  const categoriesWithSpent = store.getCategoriesWithSpent()
  const fromCategory = categoriesWithSpent.find(c => c.id === formData.fromCategoryId)
  const toCategory = categoriesWithSpent.find(c => c.id === formData.toCategoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.fromCategoryId || !formData.toCategoryId) {
      setError('Please select both categories')
      return
    }
    
    if (formData.fromCategoryId === formData.toCategoryId) {
      setError('Cannot borrow from the same category')
      return
    }
    
    if (formData.amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (fromCategory && formData.amount > fromCategory.remaining) {
      setError(`Cannot borrow more than available (${formatCurrency(fromCategory.remaining)})`)
      return
    }

    setIsSubmitting(true)
    
    try {
      await store.borrowBetweenCategories({
        ...formData,
        month: store.getCurrentMonth()
      })
      onClose()
    } catch {
      setError('Failed to process borrowing')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Borrow Between Categories">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fromCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Borrow From
            </label>
            <select
              id="fromCategory"
              value={formData.fromCategoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, fromCategoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            >
              {categoriesWithSpent.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({formatCurrency(category.remaining)} left)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="toCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Lend To
            </label>
            <select
              id="toCategory"
              value={formData.toCategoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, toCategoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            >
              {categoriesWithSpent
                .filter(c => c.id !== formData.fromCategoryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">₦</span>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          {fromCategory && (
            <p className="mt-1 text-xs text-gray-500">
              Available to borrow: {formatCurrency(fromCategory.remaining)}
            </p>
          )}
        </div>

        {fromCategory && toCategory && formData.amount > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>
                <strong>{fromCategory.name}:</strong> {formatCurrency(fromCategory.remaining)} → {formatCurrency(fromCategory.remaining - formData.amount)}
              </div>
              <div>
                <strong>{toCategory.name}:</strong> {formatCurrency(toCategory.remaining)} → {formatCurrency(toCategory.remaining + formData.amount)}
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.fromCategoryId || !formData.toCategoryId || formData.amount <= 0}
            className="flex-1"
          >
            {isSubmitting ? 'Processing...' : 'Borrow'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}