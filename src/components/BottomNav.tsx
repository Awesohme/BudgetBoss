'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, DollarSign, History, TrendingUp } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plan', label: 'Plan', icon: ClipboardList },
  { href: '/track', label: 'Track', icon: DollarSign },
  { href: '/history', label: 'History', icon: History },
  { href: '/insights', label: 'Insights', icon: TrendingUp }
]

export function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const IconComponent = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}