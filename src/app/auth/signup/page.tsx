'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, User, AtSign, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react'

function SignUpPageContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Username validation
  const [usernameError, setUsernameError] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Username validation effect
  useEffect(() => {
    if (!username) {
      setUsernameError('')
      setUsernameValid(false)
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setUsernameError('3-20 characters, letters, numbers, underscores only')
      setUsernameValid(false)
      return
    }

    const checkUsername = setTimeout(async () => {
      setCheckingUsername(true)
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        
        if (data.available) {
          setUsernameError('')
          setUsernameValid(true)
        } else {
          setUsernameError(data.error || 'Username taken')
          setUsernameValid(false)
        }
      } catch {
        setUsernameError('Failed to check')
        setUsernameValid(false)
      } finally {
        setCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(checkUsername)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setErrorMessage('Please enter your name')
      return
    }
    
    if (username && !usernameValid) {
      setErrorMessage('Please choose a valid username')
      return
    }
    
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // First, store the signup data temporarily
      const signupRes = await fetch('/api/auth/signup-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          username: username.trim() || null,
        }),
      })
      
      if (!signupRes.ok) {
        const data = await signupRes.json()
        setErrorMessage(data.error || 'Failed to process signup')
        setIsLoading(false)
        return
      }

      // Then send the magic link
      const result = await signIn('email', {
        email: email.toLowerCase().trim(),
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage('Failed to send verification link. Please try again.')
        setIsLoading(false)
      } else {
        // Redirect to verify request page
        window.location.href = `/auth/verify-request?email=${encodeURIComponent(email)}&signup=true`
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-garden-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-garden-800 dark:text-garden-400">GardenSeed</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Join the gardening community</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Info */}
          <div className="mb-6 p-4 bg-garden-50 dark:bg-garden-900/50 border border-garden-200 dark:border-garden-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-garden-600 dark:text-garden-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-garden-800 dark:text-garden-200">
                <p className="font-medium">Passwordless account</p>
                <p className="text-garden-600 dark:text-garden-400 mt-1">
                  We&apos;ll send you a magic link to verify your email. No password to remember!
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Jane Gardener"
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-gray-400 text-xs">(optional, public)</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  autoComplete="username"
                  maxLength={20}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    usernameError ? 'border-red-500' : 
                    usernameValid ? 'border-green-500' : 
                    'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="your_username"
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                )}
                {!checkingUsername && usernameValid && username && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {usernameError && (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for crediting community contributions
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !name || (!!username && !usernameValid)}
              className="w-full py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 focus:ring-4 focus:ring-garden-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 font-medium">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-garden-600 dark:text-garden-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <SignUpPageContent />
    </Suspense>
  )
}
