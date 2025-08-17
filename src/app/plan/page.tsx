'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { Modal } from '@/components/Modal'
import { ExpandableFloatingButton } from '@/components/ExpandableFloatingButton'
import { ConfirmModal } from '@/components/ConfirmModal'
import { CopyPreviousModal } from '@/components/CopyPreviousModal'
import { CategoryDetailModal } from '@/components/CategoryDetailModal'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'
import type { BudgetState } from '@/lib/models'

export default function PlanPage() {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'default'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default'
  })

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

  const handleCopyFromPrevious = async (options: { incomes: boolean; categories: boolean; previousMonth: string }) => {
    setIsLoading(true)
    setMessage('')
    
    try {
      await store.copyFromPreviousMonth(options.previousMonth, {
        incomes: options.incomes,
        categories: options.categories
      })
      
      const copied = []
      if (options.incomes) copied.push('incomes')
      if (options.categories) copied.push('categories')
      
      setMessage(`Successfully copied ${copied.join(' and ')} from ${options.previousMonth}!`)
    } catch (error) {
      console.error('Copy previous month error:', error)
      setMessage('Failed to copy data from previous month.')
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
            onClick={() => setIsCopyModalOpen(true)}
            disabled={isLoading}
          >
            Copy Previous
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
        <CardHeader>
          <CardTitle>Income</CardTitle>
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
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Income Source',
                          message: 'Are you sure you want to delete this income source? This action cannot be undone.',
                          variant: 'danger',
                          onConfirm: () => store.deleteIncome(income.id)
                        })
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
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {state.categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories added yet</p>
          ) : (
            <div className="space-y-3">
              {state.categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {category.notes && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-blue-600">📝 Has notes</span>
                        </div>
                      )}
                    </div>
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
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Category',
                            message: 'Are you sure you want to delete this category? All transactions in this category will lose their category assignment.',
                            variant: 'danger',
                            onConfirm: () => store.deleteCategory(category.id)
                          })
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
                inputMode="numeric"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplayValue(formData.amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to set budget amount later</p>
          </div>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Copy Previous Modal */}
      <CopyPreviousModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onCopy={handleCopyFromPrevious}
        currentMonth={store.getCurrentMonth()}
      />

      {/* Category Detail Modal */}
      <CategoryDetailModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory ? store.getCategoriesWithSpent().find(c => c.id === selectedCategory) || null : null}
        transactions={state.transactions}
      />

      {/* Expandable Floating Action Button */}
      <ExpandableFloatingButton
        variant="plan"
        onAddIncome={() => setIsIncomeModalOpen(true)}
        onAddCategory={() => setIsCategoryModalOpen(true)}
      />
    </div>
  )
}