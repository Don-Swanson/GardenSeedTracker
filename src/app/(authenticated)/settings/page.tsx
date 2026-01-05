'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Save, MapPin, Thermometer, Calendar, RefreshCw, X, Clock, User, AtSign, Mail, Check, Loader2, Bell, MapPinned, Heart } from 'lucide-react'
import { hardinessZones } from '@/lib/garden-utils'

// Default location: Niceville, FL
const DEFAULT_LOCATION = {
  zipCode: '32578',
  latitude: 30.5169,
  longitude: -86.4822,
}

interface UserSettings {
  id: string
  zipCode: string | null
  hardinessZone: string | null
  lastFrostDate: string | null
  firstFrostDate: string | null
  latitude: number | null
  longitude: number | null
  // Planting reminder settings
  enableIndoorStartReminders: boolean
  enableDirectSowReminders: boolean
  enableTransplantReminders: boolean
  reminderLeadDays: number
}

interface UserProfile {
  name: string | null
  username: string | null
  email: string
  pendingEmail: string | null
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update: updateSession } = useSession()
  
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  // Profile editing states
  const [editingName, setEditingName] = useState('')
  const [editingUsername, setEditingUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  
  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  
  // Location/geocoding states
  const [geocodingZip, setGeocodingZip] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  // Check for URL params
  useEffect(() => {
    const emailChanged = searchParams.get('emailChanged')
    const error = searchParams.get('error')
    
    if (emailChanged === 'true') {
      setMessage('Email changed successfully! Please sign in again with your new email.')
    } else if (error === 'invalid_token') {
      setMessage('Invalid or missing verification token.')
    } else if (error === 'expired_token') {
      setMessage('Email change link has expired. Please try again.')
    } else if (error === 'email_taken') {
      setMessage('That email address is no longer available.')
    } else if (error === 'verification_failed') {
      setMessage('Failed to verify email change. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/profile').then(res => res.json()),
    ])
      .then(([settingsData, profileData]) => {
        setSettings(settingsData)
        setProfile(profileData)
        setEditingName(profileData.name || '')
        setEditingUsername(profileData.username || '')
      })
      .catch(() => setMessage('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  // Username validation
  useEffect(() => {
    if (!editingUsername || editingUsername === profile?.username) {
      setUsernameError('')
      setUsernameValid(editingUsername === profile?.username)
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(editingUsername)) {
      setUsernameError('3-20 characters, letters, numbers, underscores only')
      setUsernameValid(false)
      return
    }

    const checkUsername = setTimeout(async () => {
      setCheckingUsername(true)
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(editingUsername)}`)
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
  }, [editingUsername, profile?.username])

  const handleSaveProfile = async () => {
    if (usernameError || checkingUsername) return
    
    setSavingProfile(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName.trim(),
          username: editingUsername.trim() || null,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setMessage(data.error || 'Failed to save profile')
        return
      }
      
      setProfile({
        ...profile!,
        name: editingName.trim(),
        username: editingUsername.trim() || null,
      })
      updateSession()
      setMessage('Profile updated successfully!')
    } catch {
      setMessage('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return
    
    setChangingEmail(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setMessage(data.error || 'Failed to request email change')
        return
      }
      
      setProfile({
        ...profile!,
        pendingEmail: newEmail.trim(),
      })
      setShowEmailChange(false)
      setNewEmail('')
      setMessage('Verification email sent! Check your new email address to confirm the change.')
    } catch {
      setMessage('Failed to request email change')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleCancelEmailChange = async () => {
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setProfile({
          ...profile!,
          pendingEmail: null,
        })
        setMessage('Email change cancelled.')
      }
    } catch {
      setMessage('Failed to cancel email change')
    }
  }

  // Geocode zip code to get lat/long
  const handleGeocodeZip = async () => {
    const zipInput = document.getElementById('zipCode') as HTMLInputElement
    const zip = zipInput?.value?.trim()
    
    if (!zip) {
      setGeocodeError('Please enter a ZIP code')
      return
    }
    
    // Validate US zip code format
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      setGeocodeError('Please enter a valid US ZIP code (e.g., 32578)')
      return
    }
    
    setGeocodingZip(true)
    setGeocodeError('')
    
    try {
      // Use a free geocoding API (Zippopotam.us for zip codes)
      const res = await fetch(`https://api.zippopotam.us/us/${zip.substring(0, 5)}`)
      
      if (!res.ok) {
        throw new Error('ZIP code not found')
      }
      
      const data = await res.json()
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0]
        const lat = parseFloat(place.latitude)
        const lng = parseFloat(place.longitude)
        
        // Update form inputs
        const latInput = document.getElementById('latitude') as HTMLInputElement
        const lngInput = document.getElementById('longitude') as HTMLInputElement
        
        if (latInput) latInput.value = lat.toFixed(4)
        if (lngInput) lngInput.value = lng.toFixed(4)
        
        setGeocodeError('')
        setMessage(`Location set to ${place['place name']}, ${place['state abbreviation']}`)
      }
    } catch {
      setGeocodeError('Could not find location for this ZIP code')
    } finally {
      setGeocodingZip(false)
    }
  }
  
  // Use default location (Niceville, FL)
  const handleUseDefaultLocation = () => {
    const zipInput = document.getElementById('zipCode') as HTMLInputElement
    const latInput = document.getElementById('latitude') as HTMLInputElement
    const lngInput = document.getElementById('longitude') as HTMLInputElement
    
    if (zipInput) zipInput.value = DEFAULT_LOCATION.zipCode
    if (latInput) latInput.value = DEFAULT_LOCATION.latitude.toFixed(4)
    if (lngInput) lngInput.value = DEFAULT_LOCATION.longitude.toFixed(4)
    
    setMessage('Location set to Niceville, FL (default)')
  }

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
      // Planting reminder settings
      enableIndoorStartReminders: formData.get('enableIndoorStartReminders') === 'on',
      enableDirectSowReminders: formData.get('enableDirectSowReminders') === 'on',
      enableTransplantReminders: formData.get('enableTransplantReminders') === 'on',
      reminderLeadDays: parseInt(formData.get('reminderLeadDays') as string) || 7,
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Configure your location and growing zone</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('success') || message.includes('successfully') || message.includes('Verification email sent') || message.includes('Location set to')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Section */}
      <div className="card space-y-4 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>
        
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <AtSign className="w-4 h-4" />
              Username
              <span className="text-xs text-gray-500">(optional, public)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={editingUsername}
                onChange={(e) => setEditingUsername(e.target.value.toLowerCase())}
                className={`input-field pr-10 ${
                  usernameError ? 'border-red-500 focus:border-red-500' : 
                  usernameValid && editingUsername ? 'border-green-500 focus:border-green-500' : ''
                }`}
                placeholder="your_username"
                maxLength={20}
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
              {!checkingUsername && usernameValid && editingUsername && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {usernameError && (
              <p className="text-sm text-red-500 mt-1">{usernameError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Used for crediting community contributions. Will be publicly visible.
            </p>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="input-field bg-gray-50 dark:bg-gray-800 flex-1"
              />
              <button
                type="button"
                onClick={() => setShowEmailChange(!showEmailChange)}
                className="btn-secondary text-sm whitespace-nowrap"
              >
                Change Email
              </button>
            </div>
            
            {/* Pending Email Change Notice */}
            {profile?.pendingEmail && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Pending change:</strong> Verification sent to {profile.pendingEmail}
                </p>
                <button
                  type="button"
                  onClick={handleCancelEmailChange}
                  className="text-sm text-amber-600 dark:text-amber-400 underline hover:no-underline mt-1"
                >
                  Cancel email change
                </button>
              </div>
            )}
            
            {/* Email Change Form */}
            {showEmailChange && !profile?.pendingEmail && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter new email address"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestEmailChange}
                    disabled={changingEmail || !newEmail.trim()}
                    className="btn-primary text-sm"
                  >
                    {changingEmail ? 'Sending...' : 'Send Verification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailChange(false)
                      setNewEmail('')
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  A verification link will be sent to the new email address.
                </p>
              </div>
            )}
          </div>

          {/* Save Profile Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile || (!!editingUsername && !usernameValid && editingUsername !== profile?.username) || checkingUsername}
              className="btn-primary"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Support the Project */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Support the Project
          </h2>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
              Garden Seed Tracker is free and open source. If you find it useful, consider supporting its development!
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://ko-fi.com/gardenseedtracker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5E5B] hover:bg-[#e54543] text-white rounded-lg text-sm font-medium transition-colors"
              >
                ☕ Buy me a Coffee
              </a>
              <a
                href="https://github.com/sponsors/Don-Swanson"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA4AAA] hover:bg-[#d43d99] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Heart className="w-4 h-4" />
                GitHub Sponsors
              </a>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </h2>
          
          <div>
            <label htmlFor="zipCode" className="label">ZIP Code</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="zipCode" 
                name="zipCode" 
                defaultValue={settings?.zipCode || ''}
                className="input flex-1"
                placeholder="e.g., 32578"
                maxLength={10}
              />
              <button
                type="button"
                onClick={handleGeocodeZip}
                disabled={geocodingZip}
                className="btn-secondary whitespace-nowrap flex items-center gap-2"
              >
                {geocodingZip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPinned className="w-4 h-4" />
                )}
                {geocodingZip ? 'Looking up...' : 'Auto-fill Coordinates'}
              </button>
            </div>
            {geocodeError && (
              <p className="text-sm text-red-500 mt-1">{geocodeError}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter your ZIP code and click &quot;Auto-fill Coordinates&quot; to automatically set your latitude and longitude for accurate astronomy data.
            </p>
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
                placeholder="e.g., 30.5169"
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
                placeholder="e.g., -86.4822"
                step="0.0001"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Don&apos;t know your location?</span>
            <button
              type="button"
              onClick={handleUseDefaultLocation}
              className="text-garden-600 dark:text-garden-400 hover:underline"
            >
              Use default (Niceville, FL)
            </button>
          </div>
        </div>

        {/* Growing Zone */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <a 
                href="https://planthardiness.ars.usda.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-garden-600 dark:text-garden-400 hover:underline"
              >
                Find your zone on the USDA website →
              </a>
            </p>
          </div>
        </div>

        {/* Frost Dates */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Frost Dates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average date of last frost in spring</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average date of first frost in fall</p>
            </div>
          </div>
        </div>

        {/* Planting Reminders */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Planting Reminders
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get email reminders when it&apos;s time to start planting your seeds. These settings apply to all seeds in your inventory and wishlist.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> If you prefer to control reminders for specific seeds, you can disable these global settings and enable reminders individually on each seed in your inventory.
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Indoor Start Reminders</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remind me when to start seeds indoors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableIndoorStartReminders"
                  defaultChecked={settings?.enableIndoorStartReminders ?? false}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-garden-300 dark:peer-focus:ring-garden-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-garden-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Direct Sow Reminders</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remind me when to direct sow seeds outdoors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableDirectSowReminders"
                  defaultChecked={settings?.enableDirectSowReminders ?? false}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-garden-300 dark:peer-focus:ring-garden-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-garden-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Transplant Reminders</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remind me when to transplant seedlings outdoors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableTransplantReminders"
                  defaultChecked={settings?.enableTransplantReminders ?? false}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-garden-300 dark:peer-focus:ring-garden-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-garden-600"></div>
              </label>
            </div>
            
            <div>
              <label htmlFor="reminderLeadDays" className="label">Reminder Lead Time</label>
              <select 
                id="reminderLeadDays" 
                name="reminderLeadDays" 
                defaultValue={settings?.reminderLeadDays ?? 7}
                className="input"
              >
                <option value="3">3 days before planting date</option>
                <option value="5">5 days before planting date</option>
                <option value="7">7 days before planting date</option>
                <option value="10">10 days before planting date</option>
                <option value="14">14 days before planting date</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How many days before the planting date should we send the reminder</p>
            </div>
          </div>
        </div>

        {/* Zone Info */}
        {settings?.hardinessZone && hardinessZones[settings.hardinessZone] && (
          <div className="p-4 bg-garden-50 dark:bg-garden-900/30 rounded-lg border border-garden-200 dark:border-garden-700">
            <h3 className="font-medium text-garden-900 dark:text-garden-200 mb-2">
              Zone {settings.hardinessZone} Information
            </h3>
            <div className="text-sm text-garden-700 dark:text-garden-300 space-y-1">
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

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
