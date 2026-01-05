'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  UserCog, 
  Search, 
  AlertTriangle,
  Eye,
  LogOut,
  Shield
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export default function ImpersonatePage() {
  const searchParams = useSearchParams()
  const preselectedUserId = searchParams.get('user')
  
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [impersonating, setImpersonating] = useState<User | null>(null)
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [preselectedUser, setPreselectedUser] = useState<User | null>(null)

  // Check for existing impersonation session
  useEffect(() => {
    const checkImpersonation = async () => {
      try {
        const res = await fetch('/api/admin/impersonate/status')
        if (res.ok) {
          const data = await res.json()
          if (data.impersonating) {
            setImpersonating(data.user)
            setImpersonationToken(data.token)
          }
        }
      } catch (err) {
        console.error('Failed to check impersonation status:', err)
      }
    }
    checkImpersonation()
  }, [])

  // Fetch preselected user by ID
  useEffect(() => {
    if (preselectedUserId) {
      fetchUserById(preselectedUserId)
    }
  }, [preselectedUserId])

  const fetchUserById = async (userId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setPreselectedUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to search users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(search)
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const startImpersonation = async (user: User) => {
    if (!confirm(`Start impersonating ${user.email}?\n\nYou will see the app exactly as they do. All actions will be logged.`)) {
      return
    }

    setStarting(true)
    try {
      const res = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (res.ok) {
        const data = await res.json()
        setImpersonating(user)
        setImpersonationToken(data.token)
        // Redirect to dashboard as impersonated user
        window.location.href = '/dashboard'
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to start impersonation')
      }
    } catch (err) {
      console.error('Failed to start impersonation:', err)
      alert('Failed to start impersonation')
    } finally {
      setStarting(false)
    }
  }

  const stopImpersonation = async () => {
    try {
      const res = await fetch('/api/admin/impersonate/stop', {
        method: 'POST'
      })

      if (res.ok) {
        setImpersonating(null)
        setImpersonationToken(null)
        // Reload to restore admin session
        window.location.href = '/admin'
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to stop impersonation')
      }
    } catch (err) {
      console.error('Failed to stop impersonation:', err)
      alert('Failed to stop impersonation')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Impersonation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View the app as another user for troubleshooting
        </p>
      </div>

      {/* Troubleshooting Only Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">🔧 For Troubleshooting Only</h3>
          <p className="text-blue-800 dark:text-blue-300 text-sm mt-1">
            This feature is intended <strong>exclusively</strong> for troubleshooting and replicating user-reported issues. 
            Use it to understand what a user sees when they report a problem or need assistance.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-200">Important Notice</h3>
          <p className="text-amber-800 dark:text-amber-300 text-sm mt-1">
            Impersonation allows you to view the app exactly as another user sees it. 
            All impersonation sessions are logged for security and auditing purposes. 
            Use this feature responsibly and only for troubleshooting user issues.
          </p>
        </div>
      </div>

      {/* Current Impersonation Status */}
      {impersonating && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  Currently Impersonating
                </h3>
                <p className="text-red-800 dark:text-red-300">
                  {impersonating.name || impersonating.email}
                </p>
              </div>
            </div>
            <button
              onClick={stopImpersonation}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Stop Impersonation
            </button>
          </div>
        </div>
      )}

      {/* Search Users */}
      {!impersonating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select User to Impersonate
          </h2>
          
          {/* Show preselected user prominently */}
          {preselectedUser && (
            <div className="mb-4 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-2 font-medium">Selected User:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {preselectedUser.name || preselectedUser.email}
                    {preselectedUser.role === 'admin' && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        <Shield className="w-3 h-3 inline mr-1" />
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{preselectedUser.email}</p>
                </div>
                <button
                  onClick={() => startImpersonation(preselectedUser)}
                  disabled={starting || preselectedUser.role === 'admin'}
                  className="btn bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  {starting ? 'Starting...' : 'Start Impersonation'}
                </button>
              </div>
              {preselectedUser.role === 'admin' && (
                <p className="text-sm text-red-600 mt-2">Cannot impersonate admin users</p>
              )}
            </div>
          )}
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-4">Searching...</div>
          ) : users.length === 0 && search.length >= 2 ? (
            <div className="text-center text-gray-500 py-4">No users found</div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name || user.email}
                      {user.role === 'admin' && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => startImpersonation(user)}
                    disabled={starting || user.role === 'admin'}
                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    {starting ? 'Starting...' : 'Impersonate'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Enter at least 2 characters to search for users
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How Impersonation Works</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="font-bold text-garden-600">1.</span>
            Search for and select a user to impersonate
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-garden-600">2.</span>
            You'll be redirected to their dashboard view
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-garden-600">3.</span>
            You'll see a red banner at the top indicating you're impersonating
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-garden-600">4.</span>
            Click "Stop Impersonation" to return to your admin session
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-garden-600">5.</span>
            All impersonation activity is logged in the audit trail
          </li>
        </ul>
      </div>
    </div>
  )
}
