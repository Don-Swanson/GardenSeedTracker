'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface SwapListingActionsProps {
  listingId: string
  status: string
  plantName: string
}

export default function SwapListingActions({ listingId, status, plantName }: SwapListingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const setStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/swap/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update listing')
      router.refresh()
    } catch {
      alert('Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete your listing for "${plantName}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/swap/listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/swap/mine')
      router.refresh()
    } catch {
      alert('Failed to delete listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'completed' && (
        <button onClick={() => setStatus('completed')} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Mark Completed
        </button>
      )}
      {status === 'active' ? (
        <button onClick={() => setStatus('closed')} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4" /> Close Listing
        </button>
      ) : status !== 'completed' ? (
        <button onClick={() => setStatus('active')} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" /> Reactivate
        </button>
      ) : null}
      <button onClick={handleDelete} disabled={loading} className="btn-danger flex items-center gap-2 text-sm">
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  )
}
