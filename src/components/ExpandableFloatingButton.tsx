'use client'

import { useState } from 'react'

interface ExpandableFloatingButtonProps {
  onAddExpense: () => void
  onBorrow: () => void
  borrowDisabled?: boolean
}

export function ExpandableFloatingButton({ onAddExpense, onBorrow, borrowDisabled = false }: ExpandableFloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Secondary action buttons - show when expanded */}
      {isExpanded && (
        <div className="flex flex-col space-y-3 mb-3">
          <button
            onClick={() => {
              onBorrow()
              setIsExpanded(false)
            }}
            disabled={borrowDisabled}
            className="w-14 h-14 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform transition-all duration-200 hover:scale-105"
          >
            <span className="text-xl">🔄</span>
          </button>
          
          <button
            onClick={() => {
              onAddExpense()
              setIsExpanded(false)
            }}
            className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center transform transition-all duration-200 hover:scale-105"
          >
            <span className="text-xl">💰</span>
          </button>
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