'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, AlertCircle, Sparkles } from 'lucide-react'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')
  
  const [email, setEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error === 'Verification' ? 'The sign-in link has expired or already been used.' :
    error === 'Configuration' ? 'There was a problem with the server configuration.' :
    error ? 'An error occurred. Please try again.' : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Sign in with email magic link
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage('Failed to send login link. Please try again.')
        setIsLoading(false)
      } else {
        // Redirect to verify request page
        window.location.href = `/auth/verify-request?email=${encodeURIComponent(email)}&remember=${rememberMe}`
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl })
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
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in with your email to continue</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Magic Link Info */}
          <div className="mb-6 p-4 bg-garden-50 border border-garden-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-garden-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-garden-800">
                <p className="font-medium">Passwordless login</p>
                <p className="text-garden-600 mt-1">
                  Enter your email and we&apos;ll send you a magic link to sign in instantly. No password needed!
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-garden-600 border-gray-300 rounded focus:ring-garden-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Keep me signed in for 1 year
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 focus:ring-4 focus:ring-garden-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending link...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send magic link
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-garden-600 hover:text-garden-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-garden-600 hover:text-garden-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
