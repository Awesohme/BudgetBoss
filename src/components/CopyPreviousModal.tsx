'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { db } from '@/lib/db'
import { getPreviousMonth } from '@/lib/month'

interface CopyPreviousModalProps {
  isOpen: boolean
  onClose: () => void
  onCopy: (options: CopyOptions) => void
  currentMonth: string
}

interface CopyOptions {
  incomes: boolean
  categories: boolean
  previousMonth: string
}

interface PreviousMonthData {
  month: string
  incomeCount: number
  categoryCount: number
}

export function CopyPreviousModal({ isOpen, onClose, onCopy, currentMonth }: CopyPreviousModalProps) {
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    incomes: true,
    categories: true,
    previousMonth: ''
  })
  const [availableMonths, setAvailableMonths] = useState<PreviousMonthData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAvailableMonths()
    }
  }, [isOpen, currentMonth])

  const loadAvailableMonths = async () => {
    setIsLoading(true)
    try {
      const allMonths = await db.getAllStoredMonths()
      const previousMonthsData: PreviousMonthData[] = []

      for (const month of allMonths) {
        if (month < currentMonth) { // Only show months before current
          const plan = await db.getPlan(month)
          if (plan && (plan.incomes.length > 0 || plan.categories.length > 0)) {
            previousMonthsData.push({
              month,
              incomeCount: plan.incomes.length,
              categoryCount: plan.categories.length
            })
          }
        }
      }

      // Sort by month descending (most recent first)
      previousMonthsData.sort((a, b) => b.month.localeCompare(a.month))
      setAvailableMonths(previousMonthsData)

      // Auto-select the most recent month if available
      if (previousMonthsData.length > 0) {
        setCopyOptions(prev => ({ ...prev, previousMonth: previousMonthsData[0].month }))
      }
    } catch (error) {
      console.error('Failed to load available months:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const handleCopy = () => {
    if (copyOptions.previousMonth && (copyOptions.incomes || copyOptions.categories)) {
      onCopy(copyOptions)
      onClose()
    }
  }

  const selectedMonth = availableMonths.find(m => m.month === copyOptions.previousMonth)
  const hasValidSelection = copyOptions.previousMonth && (copyOptions.incomes || copyOptions.categories)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Copy from Previous Month">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading previous months...</p>
          </div>
        ) : availableMonths.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Previous Data Found</h3>
            <p className="text-gray-600">
              You don&apos;t have any previous months with budget data to copy from.
            </p>
          </div>
        ) : (
          <>
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Month to Copy From
              </label>
              <div className="space-y-2">
                {availableMonths.map((monthData) => (
                  <div
                    key={monthData.month}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      copyOptions.previousMonth === monthData.month
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCopyOptions(prev => ({ ...prev, previousMonth: monthData.month }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="previousMonth"
                        value={monthData.month}
                        checked={copyOptions.previousMonth === monthData.month}
                        onChange={(e) => setCopyOptions(prev => ({ ...prev, previousMonth: e.target.value }))}
                        className="mr-3 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {formatMonthDisplay(monthData.month)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {monthData.incomeCount} income source{monthData.incomeCount !== 1 ? 's' : ''} • {' '}
                          {monthData.categoryCount} categor{monthData.categoryCount !== 1 ? 'ies' : 'y'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy Options */}
            {copyOptions.previousMonth && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to copy?
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="copy-incomes"
                      checked={copyOptions.incomes}
                      onChange={(e) => setCopyOptions(prev => ({ ...prev, incomes: e.target.checked }))}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <label htmlFor="copy-incomes" className="text-gray-900">
                      Income Sources
                      {selectedMonth && (
                        <span className="text-sm text-gray-500 ml-1">
                          ({selectedMonth.incomeCount} item{selectedMonth.incomeCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="copy-categories"
                      checked={copyOptions.categories}
                      onChange={(e) => setCopyOptions(prev => ({ ...prev, categories: e.target.checked }))}
                      className="mr-3 text-blue-600 rounded"
                    />
                    <label htmlFor="copy-categories" className="text-gray-900">
                      Categories
                      {selectedMonth && (
                        <span className="text-sm text-gray-500 ml-1">
                          ({selectedMonth.categoryCount} item{selectedMonth.categoryCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {!copyOptions.incomes && !copyOptions.categories && (
                  <p className="text-sm text-red-600 mt-2">
                    Please select at least one option to copy.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!hasValidSelection || isLoading}
            className="flex-1"
          >
            Copy Selected Data
          </Button>
        </div>
      </div>
    </Modal>
  )
}