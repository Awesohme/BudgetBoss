'use client'

import { Button } from './Button'

interface UpdateBannerProps {
  isVisible: boolean
  onUpdate: () => void
  onDismiss: () => void
}

export function UpdateBanner({ isVisible, onUpdate, onDismiss }: UpdateBannerProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔄</span>
          <div>
            <p className="font-medium text-sm">New version available!</p>
            <p className="text-xs text-blue-100">Update now to get the latest features</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-white hover:bg-blue-700 border-white/20"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={onUpdate}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  )
}