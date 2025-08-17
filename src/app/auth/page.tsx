'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      })

      if (error) {
        // Show friendly error for common issues
        let friendlyMessage = 'Authentication is currently unavailable. You can continue using the app offline - your data will be saved locally.'
        
        if (error.message.includes('Invalid API key')) {
          friendlyMessage = 'Cloud authentication is not set up yet. The app works perfectly offline - your data is saved locally on this device.'
        } else if (error.message.includes('Database error') || error.message.includes('saving new user')) {
          friendlyMessage = 'Authentication database is not ready. You can continue using the app offline - your data will be saved locally.'
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Please check your email and click the magic link to complete sign in.'
        }
        
        setError(friendlyMessage)
        return
      }

      setMessage('Check your email for a magic link to sign in!')
    } catch (err) {
      console.error('Auth error:', err)
      setError('Authentication is currently unavailable. You can continue using the app offline.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign In to BudgetBoss</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMagicLink} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              No password needed! We&apos;ll send you a secure link to sign in.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm"
            >
              ← Continue without signing in
            </Button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Why sign in?</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Sync your budget across devices</li>
              <li>• Share budgets with partners</li>
              <li>• Backup your data securely</li>
              <li>• Access from anywhere</li>
            </ul>
          </div>

          {error && (error.includes('offline') || error.includes('not set up') || error.includes('not ready')) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📱 Offline Mode Available</h4>
              <p className="text-xs text-blue-800 mb-2">
                Your budgets will be saved locally on this device. You can set up cloud sync later.
              </p>
              <button
                onClick={() => router.push('/')}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Continue to App →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}