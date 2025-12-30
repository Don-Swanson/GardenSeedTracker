'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Leaf, Check, Star, Calendar, BookOpen, Sprout, 
  ArrowRight, Shield, CreditCard, Sparkles, Heart, Clock
} from 'lucide-react'
import { PRICING } from '@/lib/subscription'

function UpgradePageContent() {
  const searchParams = useSearchParams()
  const requestedFeature = searchParams.get('feature')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<'trial' | 'subscription' | null>(null)
  const [selectedTier, setSelectedTier] = useState<number>(10) // Default to $10 tier

  const freeFeatures = [
    { name: 'Seed Inventory Tracking', description: 'Track all your seeds with quantities' },
    { name: 'Seed Wishlist', description: 'Keep track of seeds you want to buy' },
  ]

  const paidFeatures = [
    { 
      name: 'Planting Log', 
      description: 'Record when and where you plant each seed',
      icon: Sprout,
    },
    { 
      name: 'Planting Calendar', 
      description: 'Zone-specific planting schedules',
      icon: Calendar,
    },
    { 
      name: 'Farmers Almanac', 
      description: 'Moon phases, companion planting, pest guides',
      icon: BookOpen,
    },
    { 
      name: 'Plant Database', 
      description: 'Access comprehensive planting guides',
      icon: Leaf,
    },
    { 
      name: 'Export Data', 
      description: 'Download your garden data anytime',
      icon: ArrowRight,
    },
    { 
      name: 'Priority Support', 
      description: 'Get help when you need it',
      icon: Shield,
    },
  ]

  const handleStartTrial = async () => {
    setIsLoading(true)
    setLoadingType('trial')
    try {
      const response = await fetch('/api/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTrial: true }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start trial. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingType(null)
    }
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    setLoadingType('subscription')
    try {
      const response = await fetch('/api/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingType(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-garden-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-garden-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-garden-800">GardenSeed</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-garden-100 rounded-full text-garden-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Support & Unlock Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Grow With Us
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Support the Garden Seed Tracker with a yearly contribution and unlock all premium features.
            Pay what feels right — minimum $5/year.
          </p>
          
          {requestedFeature && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg inline-block">
              <p className="text-amber-800">
                <strong>The {requestedFeature.replace('/', '')} feature</strong> requires a Pro subscription.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <p className="text-gray-600 mt-1">Get started with basics</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-600">/forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{feature.name}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/seeds"
              className="block w-full py-3 text-center border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Current Plan
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-garden-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-garden-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Most Popular
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Pro
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-gray-600 mt-1">Everything you need + support development</p>
            </div>

            {/* Trial Banner */}
            {PRICING.trial.enabled && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">Try Free for {PRICING.trial.durationDays} Days</h4>
                    <p className="text-sm text-blue-700">
                      Full access to all Pro features. Converts to ${PRICING.trial.convertToAmount}/year after trial.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartTrial}
                  disabled={isLoading}
                  className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingType === 'trial' ? 'Starting...' : 'Start Free Trial'}
                </button>
              </div>
            )}
            
            {/* Tier Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Choose your annual plan:</p>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRICING.tiers.map((tier) => (
                  <button
                    key={tier.amount}
                    onClick={() => setSelectedTier(tier.amount)}
                    className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all relative ${
                      selectedTier === tier.amount
                        ? 'bg-garden-600 text-white ring-2 ring-garden-600 ring-offset-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ${tier.amount}
                    {tier.popular && (
                      <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs px-1.5 py-0.5 rounded-full">
                        ★
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <span className="text-3xl font-bold text-gray-900">${selectedTier}</span>
                <span className="text-gray-600">/year</span>
                <p className="text-xs text-gray-500 mt-1">Auto-renews annually. Cancel anytime.</p>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-garden-700 font-medium">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                Everything in Free, plus:
              </li>
              {paidFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <feature.icon className="w-5 h-5 text-garden-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{feature.name}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 bg-garden-600 text-white rounded-lg font-semibold hover:bg-garden-700 focus:ring-4 focus:ring-garden-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingType === 'subscription' ? (
                'Loading...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Subscribe ${selectedTier}/year
                </>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment via Square. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Why Support Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-garden-50 rounded-2xl p-8 text-center">
            <Heart className="w-12 h-12 text-garden-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Different Tiers?
            </h2>
            <p className="text-gray-600 mb-6">
              We believe everyone should have access to great gardening tools. All tiers get the 
              same features — choose what feels right for your budget. Higher tiers help us develop 
              new features faster and keep the servers running smoothly. Thank you for your support!
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div>
                <div className="text-2xl font-bold text-garden-600">100%</div>
                <div>Goes to development</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-garden-600">50+</div>
                <div>Plants in database</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-garden-600">∞</div>
                <div>Gratitude</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                How does the free trial work?
              </h3>
              <p className="text-gray-600">
                Start with {PRICING.trial.durationDays} days of full Pro access completely free. 
                After the trial, you&apos;ll be automatically subscribed at ${PRICING.trial.convertToAmount}/year. 
                Cancel anytime during or after your trial from Settings.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel anytime from your Settings page. You&apos;ll keep your Pro 
                features until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                How does auto-renewal work?
              </h3>
              <p className="text-gray-600">
                Your subscription automatically renews each year at your selected tier. Square 
                securely stores your payment method — we never see your card details. You&apos;ll 
                get an email reminder before each renewal.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I don&apos;t renew?
              </h3>
              <p className="text-gray-600">
                Your seed inventory and wishlist remain accessible (free features). 
                Pro data is preserved but inaccessible until you renew — we keep it for up to a year. 
                See our <a href="/terms" className="text-garden-600 hover:underline">Terms of Service</a> for details.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my payment secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. Square handles all payment processing and card storage — we never 
                see or store your card details. Square is PCI-DSS Level 1 compliant, the highest 
                security standard.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my tier later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your tier at any time from Settings. The new 
                rate takes effect at your next renewal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <UpgradePageContent />
    </Suspense>
  )
}
