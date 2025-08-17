'use client'

import { useState, useEffect } from 'react'

interface UseServiceWorkerUpdateReturn {
  updateAvailable: boolean
  updateApp: () => Promise<void>
  dismissUpdate: () => void
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const setupServiceWorker = async () => {
      try {
        // Get existing registration or wait for it
        let swRegistration = await navigator.serviceWorker.getRegistration()
        
        if (!swRegistration) {
          // Wait a bit for registration to complete
          await new Promise(resolve => setTimeout(resolve, 1000))
          swRegistration = await navigator.serviceWorker.getRegistration()
        }

        if (swRegistration) {
          setRegistration(swRegistration)

          // Check for updates immediately
          swRegistration.update()

          // Listen for new service worker waiting
          const handleUpdateFound = () => {
            const newWorker = swRegistration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is installed and ready
                  setUpdateAvailable(true)
                }
              })
            }
          }

          // Listen for updates
          swRegistration.addEventListener('updatefound', handleUpdateFound)

          // Check if there's already a waiting service worker
          if (swRegistration.waiting) {
            setUpdateAvailable(true)
          }

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload page when new service worker takes control
            window.location.reload()
          })

          // Check for updates periodically (every 60 seconds)
          const updateInterval = setInterval(() => {
            swRegistration.update()
          }, 60000)

          return () => {
            clearInterval(updateInterval)
            swRegistration.removeEventListener('updatefound', handleUpdateFound)
          }
        }
      } catch (error) {
        console.error('Service Worker setup error:', error)
      }
    }

    setupServiceWorker()
  }, [])

  const updateApp = async (): Promise<void> => {
    if (!registration?.waiting) {
      return
    }

    // Tell the waiting service worker to skip waiting and become active
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    setUpdateAvailable(false)
  }

  const dismissUpdate = (): void => {
    setUpdateAvailable(false)
  }

  return {
    updateAvailable,
    updateApp,
    dismissUpdate
  }
}