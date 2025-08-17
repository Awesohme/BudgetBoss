'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { Modal } from '@/components/Modal'
import { store } from '@/lib/store'
import { formatCurrency, getPreviousMonth } from '@/lib/month'
import type { BudgetState } from '@/lib/models'

export default function PlanPage() {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', amount: '', category_id: '' })
  const [editingItem, setEditingItem] = useState<{type: 'income' | 'category', id: string} | null>(null)
  
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
  const [categoryColor, setCategoryColor] = useState('#3B82F6')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    store.loadMonth(store.getCurrentMonth())
    return unsubscribe
  }, [])

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem?.type === 'income') {
      await store.updateIncome(editingItem.id, {
        name: formData.name,
        amount: parseFloat(formData.amount)
      })
    } else {
      await store.addIncome(formData.name, parseFloat(formData.amount))
    }
    setFormData({ name: '', amount: '', category_id: '' })
    setEditingItem(null)
    setIsIncomeModalOpen(false)
  }


  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem?.type === 'category') {
      await store.updateCategory(editingItem.id, {
        name: formData.name,
        budgeted: parseFloat(formData.amount) || 0,
        color: categoryColor
      })
    } else {
      await store.addCategory(formData.name, parseFloat(formData.amount) || 0, categoryColor)
    }
    setFormData({ name: '', amount: '', category_id: '' })
    setCategoryColor('#3B82F6')
    setEditingItem(null)
    setIsCategoryModalOpen(false)
  }

  const handleCopyPreviousMonth = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const previousMonth = getPreviousMonth(store.getCurrentMonth())
      await store.copyFromPreviousMonth(previousMonth)
      setMessage(`Successfully copied data from ${previousMonth}!`)
    } catch (error) {
      console.error('Copy previous month error:', error)
      setMessage('Failed to copy previous month data. No previous data found.')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const totalIncome = store.getTotalIncome()
  const totalBudgeted = store.getTotalBudgeted()
  const actualLeft = totalIncome - totalBudgeted

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white bg-gray-800 p-4 rounded-lg">Plan Budget</h1>
        {state.incomes.length === 0 && state.categories.length === 0 && (
          <Button 
            variant="secondary" 
            onClick={handleCopyPreviousMonth}
            disabled={isLoading}
          >
            {isLoading ? 'Copying...' : 'Copy Previous'}
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('Successfully') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <MonthSwitcher />

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-900">Total Income:</span>
            <span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Total Budgeted:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-900">Remaining:</span>
            <span className={`font-bold text-lg ${actualLeft >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(actualLeft)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income</CardTitle>
          <Button size="sm" onClick={() => setIsIncomeModalOpen(true)}>
            + Add
          </Button>
        </CardHeader>
        <CardContent>
          {state.incomes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No income sources added yet</p>
          ) : (
            <div className="space-y-2">
              {state.incomes.map((income) => (
                <div key={income.id} className="flex justify-between items-center">
                  <span className="text-gray-900">{income.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(income.amount)}</span>
                    <button
                      onClick={() => {
                        setEditingItem({type: 'income', id: income.id})
                        setFormData({name: income.name, amount: income.amount.toString(), category_id: ''})
                        setIsIncomeModalOpen(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this income source?')) {
                          await store.deleteIncome(income.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Button size="sm" onClick={() => setIsCategoryModalOpen(true)}>
            + Add
          </Button>
        </CardHeader>
        <CardContent>
          {state.categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories added yet</p>
          ) : (
            <div className="space-y-3">
              {state.categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(category.budgeted + category.borrowed)}</div>
                      {category.borrowed !== 0 && (
                        <div className="text-xs text-gray-600">
                          ({category.borrowed > 0 ? '+' : ''}{formatCurrency(category.borrowed)} borrowed)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => {
                          setEditingItem({type: 'category', id: category.id})
                          setFormData({name: category.name, amount: category.budgeted.toString(), category_id: ''})
                          setCategoryColor(category.color)
                          setIsCategoryModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this category? All transactions in this category will lose their category assignment.')) {
                            await store.deleteCategory(category.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal isOpen={isIncomeModalOpen} onClose={() => {setIsIncomeModalOpen(false); setEditingItem(null)}} title={editingItem?.type === 'income' ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleAddIncome} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Salary, Freelance"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="text"
                value={formatDisplayValue(formData.amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                required
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsIncomeModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">{editingItem?.type === 'income' ? 'Update Income' : 'Add Income'}</Button>
          </div>
        </form>
      </Modal>


      <Modal isOpen={isCategoryModalOpen} onClose={() => {setIsCategoryModalOpen(false); setEditingItem(null)}} title={editingItem?.type === 'category' ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Groceries, Entertainment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          {editingItem?.type === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₦</span>
                <input
                  type="text"
                  value={formatDisplayValue(formData.amount)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex space-x-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCategoryColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${categoryColor === color ? 'border-gray-400' : 'border-gray-200'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={() => {setIsCategoryModalOpen(false); setEditingItem(null)}} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">{editingItem?.type === 'category' ? 'Update Category' : 'Add Category'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}