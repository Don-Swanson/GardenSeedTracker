'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Leaf, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

function VerifyRequestPageContent() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const email = searchParams.get('email') || ''
  const remember = searchParams.get('remember') === 'true'
  const [extending, setExtending] = useState(false)
  const [extended, setExtended] = useState(false)

  // When user is authenticated and requested "remember me", extend the session
  useEffect(() => {
    async function extendSession() {
      if (session?.user && remember && !extending && !extended) {
        setExtending(true)
        try {
          await fetch('/api/auth/extend-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remember: true }),
          })
          setExtended(true)
        } catch (error) {
          console.error('Failed to extend session:', error)
        } finally {
          setExtending(false)
        }
      }
    }
    extendSession()
  }, [session, remember, extending, extended])

  // If authenticated, redirect to home
  if (status === 'authenticated') {
    if (extending) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-garden-600 dark:text-garden-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Setting up your session...</p>
          </div>
        </div>
      )
    }
    // Redirect to home after session is ready
    window.location.href = '/'
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
        </div>

        {/* Success Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-garden-100 dark:bg-garden-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-garden-600 dark:text-garden-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;ve sent a magic link to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{email || 'your email'}</span>
          </p>

          <div className="bg-garden-50 dark:bg-garden-900/50 border border-garden-200 dark:border-garden-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-garden-600 dark:text-garden-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-garden-800 dark:text-garden-200">Click the link in your email to sign in</p>
                <p className="text-garden-600 dark:text-garden-400 mt-1">
                  The link is valid for 24 hours.
                  {remember && ' You\'ll stay signed in for 1 year.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <Link href="/auth/signin" className="text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 font-medium">
                try again
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Email Tips */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <strong>Tip:</strong> Add noreply@gardenseedtracker.com to your contacts to ensure 
            our emails don&apos;t end up in spam.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-garden-600 dark:text-garden-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <VerifyRequestPageContent />
    </Suspense>
  )
}
