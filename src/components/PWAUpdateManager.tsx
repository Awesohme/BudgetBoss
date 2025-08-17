'use client'

import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate'
import { UpdateBanner } from './UpdateBanner'

export function PWAUpdateManager() {
  const { updateAvailable, updateApp, dismissUpdate } = useServiceWorkerUpdate()

  return (
    <UpdateBanner
      isVisible={updateAvailable}
      onUpdate={updateApp}
      onDismiss={dismissUpdate}
    />
  )
}