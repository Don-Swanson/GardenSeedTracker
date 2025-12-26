'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, MapPin, Thermometer, CreditCard, Crown, Calendar, RefreshCw, X, Clock } from 'lucide-react'
import { hardinessZones } from '@/lib/garden-utils'

interface UserSettings {
  id: string
  zipCode: string | null
  hardinessZone: string | null
  lastFrostDate: string | null
  firstFrostDate: string | null
  latitude: number | null
  longitude: number | null
}

interface SubscriptionInfo {
  isActive: boolean
  isPaid: boolean
  isLifetimeMember: boolean
  subscriptionStatus: string
  subscriptionEndDate: string | null
  subscriptionTier: number | null
  autoRenew: boolean
  daysUntilExpiry: number | null
  lifetimeGrantedAt: string | null
  trialEndDate: string | null
  daysLeftInTrial: number | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [cancellingSubscription, setCancellingSubscription] = useState(false)
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/subscription').then(res => res.json())
    ])
      .then(([settingsData, subscriptionData]) => {
        setSettings(settingsData)
        setSubscription(subscriptionData)
      })
      .catch(() => setMessage('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      zipCode: formData.get('zipCode') || null,
      hardinessZone: formData.get('hardinessZone') || null,
      lastFrostDate: formData.get('lastFrostDate') || null,
      firstFrostDate: formData.get('firstFrostDate') || null,
      latitude: parseFloat(formData.get('latitude') as string) || null,
      longitude: parseFloat(formData.get('longitude') as string) || null,
    }

    try {
      const res = await fetch('/api/settings', {
        method: settings?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to save')

      setMessage('Settings saved successfully!')
      router.refresh()
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleZoneChange = (zone: string) => {
    const zoneInfo = hardinessZones[zone]
    if (zoneInfo && settings) {
      // Update the form with frost dates from the zone
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        const currentYear = new Date().getFullYear()
        
        // Parse frost dates and set them
        if (zoneInfo.lastFrostSpring !== 'Frost-free') {
          const [month, day] = zoneInfo.lastFrostSpring.split(' ')
          const months: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          }
          const lastFrost = form.querySelector('[name="lastFrostDate"]') as HTMLInputElement
          if (lastFrost) {
            lastFrost.value = `${currentYear}-${months[month]}-${day.padStart(2, '0')}`
          }
        }
        
        if (zoneInfo.firstFrostFall !== 'Frost-free') {
          const [month, day] = zoneInfo.firstFrostFall.split(' ')
          const months: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          }
          const firstFrost = form.querySelector('[name="firstFrostDate"]') as HTMLInputElement
          if (firstFrost) {
            firstFrost.value = `${currentYear}-${months[month]}-${day.padStart(2, '0')}`
          }
        }
      }
    }
  }

  const handleToggleAutoRenew = async () => {
    if (!subscription) return
    
    setTogglingAutoRenew(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: !subscription.autoRenew }),
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      const data = await res.json()
      setSubscription({ ...subscription, autoRenew: data.autoRenew })
      setMessage(data.message)
    } catch {
      setMessage('Failed to update auto-renewal setting')
    } finally {
      setTogglingAutoRenew(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your current billing period.')) {
      return
    }
    
    setCancellingSubscription(true)
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })
      
      if (!res.ok) throw new Error('Failed to cancel')
      
      const data = await res.json()
      setSubscription({ 
        ...subscription!, 
        autoRenew: false, 
        subscriptionStatus: 'canceling' 
      })
      setMessage(data.message)
    } catch {
      setMessage('Failed to cancel subscription')
    } finally {
      setCancellingSubscription(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your location and growing zone</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Subscription Management */}
        {subscription && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h2>
            
            {/* Lifetime Member Badge */}
            {subscription.isLifetimeMember && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Lifetime Member</h3>
                    <p className="text-sm text-amber-700">
                      You have permanent access to all paid features. Thank you for your support!
                    </p>
                    {subscription.lifetimeGrantedAt && (
                      <p className="text-xs text-amber-600 mt-1">
                        Member since {new Date(subscription.lifetimeGrantedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trial Status */}
            {!subscription.isLifetimeMember && subscription.subscriptionStatus === 'trial' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Free Trial Active</h3>
                    {subscription.trialEndDate && (
                      <p className="text-sm text-blue-700 mt-1">
                        Trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}
                        {subscription.daysLeftInTrial !== null && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {subscription.daysLeftInTrial} days left
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      After trial, you&apos;ll be charged ${subscription.subscriptionTier || 5}/year automatically.
                    </p>
                  </div>
                </div>
                
                {/* Cancel Trial */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={cancellingSubscription}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    {cancellingSubscription ? 'Canceling...' : 'Cancel trial'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Subscription */}
            {!subscription.isLifetimeMember && subscription.isActive && subscription.subscriptionStatus !== 'trial' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {subscription.subscriptionStatus === 'canceling' 
                        ? 'Subscription Canceling' 
                        : `Pro - $${subscription.subscriptionTier || 5}/year`}
                    </h3>
                    {subscription.subscriptionEndDate && (
                      <p className="text-sm text-green-700 mt-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {subscription.subscriptionStatus === 'canceling' 
                          ? `Access until ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}`
                          : `Renews on ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}`}
                        {subscription.daysUntilExpiry !== null && subscription.daysUntilExpiry <= 30 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-2">
                            {subscription.daysUntilExpiry} days left
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Renewal Reminders Toggle */}
                {subscription.subscriptionStatus !== 'canceling' && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-green-700" />
                        <span className="text-sm text-green-800">Renewal reminders</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleAutoRenew}
                        disabled={togglingAutoRenew}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          subscription.autoRenew ? 'bg-green-600' : 'bg-gray-300'
                        } ${togglingAutoRenew ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {subscription.autoRenew 
                        ? 'We\'ll email you a week before expiry with a renewal link.'
                        : 'You won\'t receive renewal reminder emails.'}
                    </p>
                  </div>
                )}

                {/* Cancel Button */}
                {subscription.subscriptionStatus !== 'canceling' && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={cancellingSubscription}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      {cancellingSubscription ? 'Canceling...' : 'Cancel subscription'}
                    </button>
                  </div>
                )}

                {/* Reactivate Button */}
                {subscription.subscriptionStatus === 'canceling' && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <button
                      type="button"
                      onClick={handleToggleAutoRenew}
                      disabled={togglingAutoRenew}
                      className="btn btn-primary text-sm"
                    >
                      {togglingAutoRenew ? 'Reactivating...' : 'Reactivate subscription'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Free Tier */}
            {!subscription.isLifetimeMember && !subscription.isActive && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700">Free Plan</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upgrade to access all features including the planting calendar, garden almanac, and more.
                </p>
                <a 
                  href="/upgrade" 
                  className="btn btn-primary mt-3 inline-block text-sm"
                >
                  Upgrade for $5+/year
                </a>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </h2>
          
          <div>
            <label htmlFor="zipCode" className="label">ZIP Code</label>
            <input 
              type="text" 
              id="zipCode" 
              name="zipCode" 
              defaultValue={settings?.zipCode || ''}
              className="input"
              placeholder="e.g., 22201"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="label">Latitude</label>
              <input 
                type="number" 
                id="latitude" 
                name="latitude" 
                defaultValue={settings?.latitude || ''}
                className="input"
                placeholder="e.g., 38.8977"
                step="0.0001"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="label">Longitude</label>
              <input 
                type="number" 
                id="longitude" 
                name="longitude" 
                defaultValue={settings?.longitude || ''}
                className="input"
                placeholder="e.g., -77.0365"
                step="0.0001"
              />
            </div>
          </div>
        </div>

        {/* Growing Zone */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
            <Thermometer className="w-5 h-5" />
            USDA Hardiness Zone
          </h2>
          
          <div>
            <label htmlFor="hardinessZone" className="label">Hardiness Zone</label>
            <select 
              id="hardinessZone" 
              name="hardinessZone" 
              defaultValue={settings?.hardinessZone || ''}
              className="input"
              onChange={(e) => handleZoneChange(e.target.value)}
            >
              <option value="">Select your zone</option>
              {Object.entries(hardinessZones).map(([zone, info]) => (
                <option key={zone} value={zone}>
                  Zone {zone} ({info.minTemp}°F to {info.maxTemp}°F) - {info.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              <a 
                href="https://planthardiness.ars.usda.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-garden-600 hover:underline"
              >
                Find your zone on the USDA website →
              </a>
            </p>
          </div>
        </div>

        {/* Frost Dates */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Frost Dates</h2>
          <p className="text-sm text-gray-600">
            These are automatically estimated based on your zone, but you can customize them for your specific location.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lastFrostDate" className="label">Last Spring Frost</label>
              <input 
                type="date" 
                id="lastFrostDate" 
                name="lastFrostDate" 
                defaultValue={settings?.lastFrostDate ? settings.lastFrostDate.split('T')[0] : ''}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Average date of last frost in spring</p>
            </div>
            <div>
              <label htmlFor="firstFrostDate" className="label">First Fall Frost</label>
              <input 
                type="date" 
                id="firstFrostDate" 
                name="firstFrostDate" 
                defaultValue={settings?.firstFrostDate ? settings.firstFrostDate.split('T')[0] : ''}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Average date of first frost in fall</p>
            </div>
          </div>
        </div>

        {/* Zone Info */}
        {settings?.hardinessZone && hardinessZones[settings.hardinessZone] && (
          <div className="p-4 bg-garden-50 rounded-lg">
            <h3 className="font-medium text-garden-900 mb-2">
              Zone {settings.hardinessZone} Information
            </h3>
            <div className="text-sm text-garden-700 space-y-1">
              <p>
                <strong>Temperature Range:</strong>{' '}
                {hardinessZones[settings.hardinessZone].minTemp}°F to{' '}
                {hardinessZones[settings.hardinessZone].maxTemp}°F
              </p>
              <p>
                <strong>Typical Last Frost:</strong>{' '}
                {hardinessZones[settings.hardinessZone].lastFrostSpring}
              </p>
              <p>
                <strong>Typical First Frost:</strong>{' '}
                {hardinessZones[settings.hardinessZone].firstFrostFall}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
