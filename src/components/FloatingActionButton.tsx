'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface FloatingActionButtonProps {
  onAddIncome: () => void
  onAddCategory: () => void
}

export function FloatingActionButton({ onAddIncome, onAddCategory }: FloatingActionButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleAddIncome = () => {
    setIsMenuOpen(false)
    onAddIncome()
  }

  const handleAddCategory = () => {
    setIsMenuOpen(false)
    onAddCategory()
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110"
        aria-label="Add item"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Menu Modal */}
      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="Add New Item">
        <div className="space-y-3">
          <Button
            onClick={handleAddIncome}
            className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
            variant="secondary"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="text-left">
              <div className="font-medium">Add Income</div>
              <div className="text-sm text-gray-500">Salary, freelance, etc.</div>
            </div>
          </Button>

          <Button
            onClick={handleAddCategory}
            className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
            variant="secondary"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🏷️</span>
            </div>
            <div className="text-left">
              <div className="font-medium">Add Category</div>
              <div className="text-sm text-gray-500">Groceries, rent, entertainment</div>
            </div>
          </Button>
        </div>
      </Modal>
    </>
  )
}