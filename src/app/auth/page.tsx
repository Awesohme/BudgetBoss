'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signInWithPassword, signUp, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const errorFromCallback = searchParams.get('error')
    if (errorFromCallback) {
      setError('Authentication failed. Please try signing in again.')
    }
  }, [searchParams])

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      let result
      if (authMode === 'signup') {
        result = await signUp(email, password)
        if (!result.error) {
          setMessage('Account created! Please check your email and click the confirmation link to complete signup.')
          setAuthMode('signin') // Switch to signin mode after successful signup
          return
        }
      } else {
        result = await signInWithPassword(email, password)
        if (!result.error) {
          // Successful login - redirect will happen automatically via useEffect
          return
        }
      }

      // Handle errors
      if (result.error) {
        console.error('Auth error:', result.error)
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (result.error.message?.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (result.error.message?.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.')
          setAuthMode('signin')
        } else {
          setError(result.error.message || 'Authentication failed')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Supabase auth error:', error)
        if (error.message?.includes('email_address_invalid')) {
          setError('This email address is not allowed. Please use a valid email address or continue using the app offline.')
        } else if (error.message?.includes('rate_limit') || error.message?.includes('too many requests')) {
          setError('Please wait a moment before requesting another magic link. Check your email for the previous link or try again in a minute.')
        } else {
          setError('Unable to send magic link. You can continue using the app offline - your data will be saved locally.')
        }
        return
      }

      setMessage('Check your email for a magic link to sign in!')
    } catch (err) {
      console.error('Auth error:', err)
      setError('Unable to send magic link. You can continue using the app offline - your data will be saved locally.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {authMode === 'signin' ? 'Sign In to BudgetBoss' : 'Create BudgetBoss Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                authMode === 'signin' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                authMode === 'signup' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailPassword} className="space-y-4">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                required
                minLength={6}
              />
              {authMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full"
            >
              {isLoading 
                ? (authMode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                : (authMode === 'signin' ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Or use magic link instead:</p>
            <form onSubmit={handleMagicLink} className="space-y-2">
              <Button
                type="submit"
                variant="ghost"
                disabled={isLoading || !email}
                className="w-full text-sm"
              >
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          </div>

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

          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">📱 Offline Mode Available</h4>
            <p className="text-xs text-gray-700 mb-2">
              Your budgets will be saved locally on this device. You can set up cloud sync later.
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Continue to App →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}