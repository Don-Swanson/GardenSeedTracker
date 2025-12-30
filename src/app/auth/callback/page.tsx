'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// This page handles the redirect after magic link authentication
// It extends the session if "remember me" was selected
function AuthCallbackPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const remember = searchParams.get('remember') === 'true'
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    async function handleCallback() {
      // Extend session if remember me was selected
      if (remember) {
        try {
          await fetch('/api/auth/extend-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remember: true }),
          })
        } catch (error) {
          console.error('Failed to extend session:', error)
        }
      }
      
      // Redirect to the callback URL
      router.push(callbackUrl)
    }
    
    handleCallback()
  }, [remember, callbackUrl, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-garden-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-garden-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackPageContent />
    </Suspense>
  )
}
