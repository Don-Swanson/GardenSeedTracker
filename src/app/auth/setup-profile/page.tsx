'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Leaf, User, AtSign, Check, X, Loader2, AlertCircle } from 'lucide-react'

function SetupProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const { data: session, status, update } = useSession()
  
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill name from session if available
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session])

  // Debounced username validation
  useEffect(() => {
    if (!username) {
      setUsernameError('')
      setUsernameValid(false)
      return
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setUsernameError('Username must be 3-20 characters, letters, numbers, and underscores only')
      setUsernameValid(false)
      return
    }

    // Check availability
    const checkUsername = setTimeout(async () => {
      setCheckingUsername(true)
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        
        if (data.available) {
          setUsernameError('')
          setUsernameValid(true)
        } else {
          setUsernameError('This username is already taken')
          setUsernameValid(false)
        }
      } catch {
        setUsernameError('Failed to check username availability')
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
      setError('Please enter your name')
      return
    }
    
    if (username && !usernameValid) {
      setError('Please choose a valid username')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      // Update the session with new data
      await update()
      
      // Redirect to callback URL
      router.push(callbackUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push(callbackUrl)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-garden-600 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
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
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Tell us a bit about yourself
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Jane Smith"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This is how we&apos;ll address you in the app
              </p>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    usernameError 
                      ? 'border-red-300 dark:border-red-600' 
                      : usernameValid 
                        ? 'border-green-300 dark:border-green-600'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="gardener123"
                />
                {username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : usernameValid ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : usernameError ? (
                      <X className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {usernameError ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{usernameError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your public username for community contributions. Must be appropriate and in good taste.
                </p>
              )}
            </div>

            {/* Info box about username visibility */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Your username will be shown publicly when you contribute to the 
                Plant Encyclopedia (plant submissions, suggestions, etc.). You can change it later in settings.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 focus:ring-4 focus:ring-garden-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SetupProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-garden-600 animate-spin" />
      </div>
    }>
      <SetupProfileContent />
    </Suspense>
  )
}
