'use client'

import { useState } from 'react'
import { QuickAdd } from '@/components/QuickAdd'
import { Button } from '@/components/Button'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { DollarSign } from 'lucide-react'

export default function TrackPage() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white bg-gray-800 p-4 rounded-lg">Track Expenses</h1>
      
      <MonthSwitcher />

      <div className="text-center py-12">
        <div className="mb-4">
          <DollarSign className="h-16 w-16 mx-auto text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Ready to track an expense?</h2>
        <p className="text-gray-600 mb-6">Add your transactions quickly and easily</p>
        
        <Button onClick={() => setIsQuickAddOpen(true)} size="lg">
          Add Transaction
        </Button>
      </div>

      <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  )
}