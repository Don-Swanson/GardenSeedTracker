'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, UserCog } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImpersonationData {
  impersonating: boolean
  user?: {
    id: string
    email: string
    name: string | null
  }
}

export default function ImpersonationBanner() {
  const router = useRouter()
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    // Check impersonation status on mount and periodically
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/impersonate/status')
        if (res.ok) {
          const data = await res.json()
          setImpersonation(data)
        }
      } catch (error) {
        console.error('Error checking impersonation status:', error)
      }
    }

    checkStatus()
    // Check every 30 seconds in case session expires
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleStopImpersonation = async () => {
    setStopping(true)
    try {
      const res = await fetch('/api/admin/impersonate/stop', {
        method: 'POST',
      })
      if (res.ok) {
        // Clear local state immediately
        setImpersonation(null)
        // Redirect to admin users page
        window.location.href = '/admin/users'
      } else {
        alert('Failed to stop impersonation')
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error)
      alert('Failed to stop impersonation')
    } finally {
      setStopping(false)
    }
  }

  if (!impersonation?.impersonating) {
    return null
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">
            <span className="hidden sm:inline">Admin Impersonation Active: </span>
            <span className="sm:hidden">Impersonating: </span>
            Viewing as <strong>{impersonation.user?.email || 'user'}</strong>
            {impersonation.user?.name && (
              <span className="hidden md:inline"> ({impersonation.user.name})</span>
            )}
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          disabled={stopping}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">{stopping ? 'Stopping...' : 'Exit Impersonation'}</span>
          <span className="sm:hidden">{stopping ? '...' : 'Exit'}</span>
        </button>
      </div>
    </div>
  )
}
