'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.',
  },
  Verification: {
    title: 'Link Expired',
    description: 'The sign-in link has expired or has already been used. Please request a new one.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during sign in. Please try again.',
  },
}

function AuthErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  
  const { title, description } = errorMessages[error] || errorMessages.Default

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

        {/* Error Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">{description}</p>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 focus:ring-4 focus:ring-garden-200 transition-all"
          >
            Try again
          </Link>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-garden-600 dark:text-garden-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorPageContent />
    </Suspense>
  )
}
