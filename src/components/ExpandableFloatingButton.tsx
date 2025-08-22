'use client'

import { useState } from 'react'
import { RefreshCw, DollarSign, FileText, Banknote } from 'lucide-react'

interface ExpandableFloatingButtonProps {
  onAddExpense?: () => void
  onBorrow?: () => void
  onAddIncome?: () => void
  onAddCategory?: () => void
  borrowDisabled?: boolean
  variant?: 'home' | 'plan'
}

export function ExpandableFloatingButton({ 
  onAddExpense, 
  onBorrow, 
  onAddIncome, 
  onAddCategory, 
  borrowDisabled = false, 
  variant = 'home' 
}: ExpandableFloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Secondary action buttons - show when expanded */}
      {isExpanded && (
        <div className="flex flex-col space-y-3 mb-3">
          {variant === 'home' && (
            <>
              <button
                onClick={() => {
                  onBorrow?.()
                  setIsExpanded(false)
                }}
                disabled={borrowDisabled}
                className="w-14 h-14 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => {
                  onAddExpense?.()
                  setIsExpanded(false)
                }}
                className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center transform transition-all duration-200 hover:scale-105"
              >
                <DollarSign className="h-6 w-6" />
              </button>
            </>
          )}
          
          {variant === 'plan' && (
            <>
              <button
                onClick={() => {
                  onAddCategory?.()
                  setIsExpanded(false)
                }}
                className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center transform transition-all duration-200 hover:scale-105"
              >
                <FileText className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => {
                  onAddIncome?.()
                  setIsExpanded(false)
                }}
                className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center transform transition-all duration-200 hover:scale-105"
              >
                <Banknote className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main floating action button */}
      <button
        onClick={toggleExpanded}
        className={`w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transform transition-all duration-200 ${
          isExpanded ? 'rotate-45' : 'hover:scale-105'
        }`}
      >
        <span className="text-2xl font-bold">+</span>
      </button>
    </div>
  )
}