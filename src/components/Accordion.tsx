'use client'

import { useState } from 'react'

interface AccordionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function Accordion({ title, defaultOpen = false, children, className = '' }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}