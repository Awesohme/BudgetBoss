'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { Progress } from '@/components/Progress'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'
import type { BudgetState } from '@/lib/models'

export default function InsightsPage() {
  const [state, setState] = useState<BudgetState>(store.getState())
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    store.loadMonth(store.getCurrentMonth())
    return unsubscribe
  }, [])

  const categoriesWithSpent = store.getCategoriesWithSpent()
  const frequentCategories = store.getFrequentCategories()
  const borrowedLent = store.getBorrowedLentSummary()
  const overspentCategories = store.getOverspentCategories()
  const underBudgetCategories = store.getUnderBudgetCategories()

  const handleExcelExport = async () => {
    setIsExporting(true)
    try {
      await store.exportToExcel()
      // Success message could be added here if desired
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
        <h1 className="text-2xl font-bold text-white">Budget Insights</h1>
        <Button
          onClick={handleExcelExport}
          disabled={isExporting}
          loading={isExporting}
          variant="secondary"
          icon={<span>📊</span>}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isExporting ? 'Exporting...' : 'Export Excel'}
        </Button>
      </div>
      
      <MonthSwitcher />

      {/* Excel Export Info */}
      <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Excel Export Available</h3>
              <p className="text-sm text-gray-700 mb-3">
                Export all your budget data across all months into a comprehensive Excel file with 6 detailed sheets:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• Summary Overview</div>
                <div>• Monthly Breakdown</div>
                <div>• All Transactions</div>
                <div>• Category Performance</div>
                <div>• Income Analysis</div>
                <div>• Unplanned Expenses</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Health */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesWithSpent.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories to analyze yet</p>
          ) : (
            <div className="space-y-4">
              {categoriesWithSpent.map((category) => {
                const percentage = category.budgeted + category.borrowed > 0 
                  ? (category.spent / (category.budgeted + category.borrowed)) * 100 
                  : 0
                
                let progressColor: 'green' | 'yellow' | 'red' = 'green'
                if (category.health === 'warning') progressColor = 'yellow'
                if (category.health === 'overspent') progressColor = 'red'

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(category.spent)} / {formatCurrency(category.budgeted + category.borrowed)}
                      </span>
                    </div>
                    <Progress 
                      value={category.spent} 
                      max={category.budgeted + category.borrowed} 
                      color={progressColor}
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{percentage.toFixed(1)}% used</span>
                      <span className={category.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {category.remaining >= 0 ? 'Remaining: ' : 'Overspent: '}
                        {formatCurrency(Math.abs(category.remaining))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Frequent Categories */}
      {frequentCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Used Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {frequentCategories.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.count} transaction{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Borrowing Summary */}
      {(borrowedLent.borrowed > 0 || borrowedLent.lent > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Category Borrowing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Total Borrowed</p>
                <p className="text-lg font-semibold text-blue-800">
                  {formatCurrency(borrowedLent.borrowed)}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Total Lent</p>
                <p className="text-lg font-semibold text-green-800">
                  {formatCurrency(borrowedLent.lent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overspent Categories */}
      {overspentCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🚨 Overspent Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overspentCategories.map((category) => (
                <div key={category.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-red-900">{category.name}</span>
                    </div>
                    <span className="text-red-700 font-semibold">
                      -{formatCurrency(Math.abs(category.remaining))}
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Spent {formatCurrency(category.spent)} of {formatCurrency(category.budgeted + category.borrowed)} budgeted
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Under Budget Categories */}
      {underBudgetCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💰 Money Left Over</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {underBudgetCategories.map((category) => (
                <div key={category.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-green-900">{category.name}</span>
                    </div>
                    <span className="text-green-700 font-semibold">
                      {formatCurrency(category.remaining)}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Spent {formatCurrency(category.spent)} of {formatCurrency(category.budgeted + category.borrowed)} budgeted
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Savings:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(underBudgetCategories.reduce((sum, cat) => sum + cat.remaining, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {state.transactions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-semibold mb-2">No insights yet</h2>
            <p className="text-gray-600">Start tracking transactions to see insights about your spending</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}