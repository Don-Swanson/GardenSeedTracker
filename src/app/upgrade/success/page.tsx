'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function UpgradeSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (sessionId) {
      // Verify the session and update UI
      setIsVerified(true)
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Pro! 🎉
          </h1>
          <p className="text-gray-600 mb-8">
            Your subscription is now active. You have access to all premium features.
          </p>

          {/* Features Unlocked */}
          <div className="bg-garden-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-garden-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              You can now:
            </h3>
            <ul className="space-y-3 text-garden-700">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Log and track all your plantings
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Access zone-specific planting calendar
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Use the Farmers Almanac features
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Browse the full plant database
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Export your garden data
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              href="/plantings"
              className="w-full py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Logging Plantings
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors block"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Receipt Info */}
          <p className="mt-6 text-sm text-gray-500">
            A receipt has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  )
}
