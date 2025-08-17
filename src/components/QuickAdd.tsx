'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Switch } from './Switch'
import { store } from '@/lib/store'
import type { BudgetState, QuickAddData } from '@/lib/models'

interface QuickAddProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAdd({ isOpen, onClose }: QuickAddProps) {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [formData, setFormData] = useState<QuickAddData>({
    amount: '',
    category_id: '',
    description: '',
    account: 'Cash',
    is_emergency: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        amount: '',
        category_id: state.categories.length > 0 ? state.categories[0].id : '',
        description: '',
        account: 'Cash',
        is_emergency: false
      })
      setError('')
    }
  }, [isOpen, state.categories])

  const accounts = ['Cash', 'Bank Transfer']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (formData.description.length < 3) {
      setError('Description must be at least 3 characters')
      return
    }

    setIsSubmitting(true)
    
    try {
      await store.addTransaction(formData)
      onClose()
    } catch {
      setError('Failed to add transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Remove currency symbols and spaces, keep only numbers and decimal
    const cleanValue = value.replace(/[₦,\s]/g, '').replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    if (parts.length > 2) return
    
    setFormData(prev => ({ ...prev, amount: cleanValue }))
  }
  
  const formatDisplayValue = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">₦</span>
            <input
              id="amount"
              type="text"
              value={formatDisplayValue(formData.amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="">No Category</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <input
            id="description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What was this for?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            required
            minLength={3}
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 3 characters ({formData.description.length}/3)
          </p>
        </div>

        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            id="account"
            value={formData.account}
            onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            {accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <Switch
            checked={formData.is_emergency}
            onChange={(checked) => setFormData(prev => ({ ...prev, is_emergency: checked }))}
            label="Emergency expense"
          />
        </div>

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
            disabled={isSubmitting || !formData.amount || formData.description.length < 3}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}