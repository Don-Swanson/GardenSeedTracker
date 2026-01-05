'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bell, Mail, Save, Check } from 'lucide-react'
import Link from 'next/link'

interface NotificationSettings {
  newUserSignup: boolean
  userDeleted: boolean
  newPlantSubmission: boolean
  newPlantSuggestion: boolean
  newPlantRequest: boolean
  dailyDigest: boolean
  weeklyDigest: boolean
  errorAlerts: boolean
}

const defaultSettings: NotificationSettings = {
  newUserSignup: true,
  userDeleted: false,
  newPlantSubmission: true,
  newPlantSuggestion: true,
  newPlantRequest: true,
  dailyDigest: false,
  weeklyDigest: true,
  errorAlerts: true,
}

const notificationGroups = [
  {
    title: 'User Events',
    icon: '👤',
    settings: [
      { key: 'newUserSignup', label: 'New user signups', description: 'When a new user creates an account' },
      { key: 'userDeleted', label: 'User deletions', description: 'When a user account is deleted' },
    ]
  },
  {
    title: 'Content Events',
    icon: '🌿',
    settings: [
      { key: 'newPlantSubmission', label: 'New plant submissions', description: 'When a user submits a new plant for review' },
      { key: 'newPlantSuggestion', label: 'Plant update suggestions', description: 'When a user suggests an update to plant info' },
      { key: 'newPlantRequest', label: 'Plant requests', description: 'When a user requests a new plant to be added' },
    ]
  },
  {
    title: 'Digest & System',
    icon: '📊',
    settings: [
      { key: 'dailyDigest', label: 'Daily digest', description: 'Receive a daily summary of all activity' },
      { key: 'weeklyDigest', label: 'Weekly digest', description: 'Receive a weekly summary of all activity' },
      { key: 'errorAlerts', label: 'Error alerts', description: 'Critical system errors and issues' },
    ]
  }
]

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/notification-settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (err) {
      console.error(err)
      // Use defaults if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/admin/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEnableAll = () => {
    setSettings({
      newUserSignup: true,
      userDeleted: true,
      newPlantSubmission: true,
      newPlantSuggestion: true,
      newPlantRequest: true,
      dailyDigest: true,
      weeklyDigest: true,
      errorAlerts: true,
    })
    setSaved(false)
  }

  const handleDisableAll = () => {
    setSettings({
      newUserSignup: false,
      userDeleted: false,
      newPlantSubmission: false,
      newPlantSuggestion: false,
      newPlantRequest: false,
      dailyDigest: false,
      weeklyDigest: false,
      errorAlerts: false,
    })
    setSaved(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Email Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose which events you want to receive email notifications for
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDisableAll}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Disable All
          </button>
          <button
            onClick={handleEnableAll}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Enable All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {notificationGroups.map(group => (
          <div 
            key={group.title}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium flex items-center gap-2">
                <span>{group.icon}</span>
                {group.title}
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {group.settings.map(setting => (
                <label 
                  key={setting.key}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <div className="flex-1 pr-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{setting.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings[setting.key as keyof NotificationSettings]}
                    onClick={() => handleToggle(setting.key as keyof NotificationSettings)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      settings[setting.key as keyof NotificationSettings]
                        ? 'bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings[setting.key as keyof NotificationSettings]
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between sticky bottom-0 bg-gray-100 dark:bg-gray-900 -mx-6 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Mail className="h-4 w-4" />
          <span>Notifications will be sent to your admin email address</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
