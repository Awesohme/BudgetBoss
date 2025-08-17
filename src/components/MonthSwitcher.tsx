'use client'

import { useState, useEffect } from 'react'
import { store } from '@/lib/store'
import { formatMonth, getMonthOptions } from '@/lib/month'

export function MonthSwitcher() {
  const [currentMonth, setCurrentMonth] = useState(store.getCurrentMonth())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const monthOptions = getMonthOptions(currentMonth)

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentMonth(store.getCurrentMonth())
    })
    return unsubscribe
  }, [])

  const handleMonthChange = async (month: string) => {
    await store.setCurrentMonth(month)
    setIsDropdownOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="font-medium">{formatMonth(currentMonth)}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {monthOptions.map((month) => (
              <button
                key={month}
                onClick={() => handleMonthChange(month)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                  month === currentMonth ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                {formatMonth(month)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}