'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Leaf, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function VerifyRequestPage() {
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
        <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-garden-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Setting up your session...</p>
          </div>
        </div>
      )
    }
    // Redirect to home after session is ready
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-garden-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-garden-800">GardenSeed</span>
          </Link>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-garden-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-garden-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a magic link to{' '}
            <span className="font-semibold text-gray-900">{email || 'your email'}</span>
          </p>

          <div className="bg-garden-50 border border-garden-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-garden-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-garden-800">Click the link in your email to sign in</p>
                <p className="text-garden-600 mt-1">
                  The link is valid for 24 hours.
                  {remember && ' You\'ll stay signed in for 1 year.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-500">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <Link href="/auth/signin" className="text-garden-600 hover:text-garden-700 font-medium">
                try again
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Email Tips */}
        <div className="mt-6 p-4 bg-white/50 rounded-xl">
          <p className="text-xs text-gray-500 text-center">
            <strong>Tip:</strong> Add noreply@gardenseedtracker.com to your contacts to ensure 
            our emails don&apos;t end up in spam.
          </p>
        </div>
      </div>
    </div>
  )
}
