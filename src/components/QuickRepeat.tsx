'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { store } from '@/lib/store'
import { formatCurrency } from '@/lib/month'

interface QuickRepeatProps {
  onSuccess?: () => void
}

interface FrequentPattern {
  description: string
  categoryName: string
  amount: number
  categoryId: string
}

export function QuickRepeat({ onSuccess }: QuickRepeatProps) {
  const [patterns, setPatterns] = useState<FrequentPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const frequentPatterns = await store.getFrequentPatterns()
        setPatterns(frequentPatterns)
      } catch (error) {
        console.error('Failed to load patterns:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatterns()
  }, [])

  const handleQuickAdd = async (pattern: FrequentPattern) => {
    const patternKey = `${pattern.description}-${pattern.categoryId}`
    setAddingId(patternKey)
    
    try {
      await store.addTransaction({
        amount: pattern.amount.toString(),
        category_id: pattern.categoryId,
        description: pattern.description,
        account: 'Cash', // Default account for quick adds
        is_unplanned: false
      })
      
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add quick transaction:', error)
    } finally {
      setAddingId(null)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500">Loading quick actions...</div>
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p className="text-sm">Quick actions will appear as you build spending patterns</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Quick Repeat</h3>
      <div className="grid gap-2">
        {patterns.map((pattern, index) => {
          const patternKey = `${pattern.description}-${pattern.categoryId}`
          const isAdding = addingId === patternKey
          
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(pattern)}
              disabled={isAdding}
              loading={isAdding}
              className="justify-between text-left"
            >
              <div>
                <div className="font-medium text-gray-900">{pattern.description}</div>
                <div className="text-xs text-gray-600">{pattern.categoryName}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(pattern.amount)}</div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}