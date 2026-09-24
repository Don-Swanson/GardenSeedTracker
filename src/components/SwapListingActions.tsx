'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface SwapListingActionsProps {
  listingId: string
  status: string
  plantName: string
  // Present only for offers linked to a seed in the owner's own inventory -
  // lets "Mark Completed" optionally reduce that seed's quantity too.
  seed?: { id: string; quantity: number; quantityUnit: string } | null
}

export default function SwapListingActions({ listingId, status, plantName, seed }: SwapListingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCompletePrompt, setShowCompletePrompt] = useState(false)
  const [reduceBy, setReduceBy] = useState('')

  const setStatus = async (newStatus: string, reduceSeedQuantityBy?: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/swap/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...(reduceSeedQuantityBy ? { reduceSeedQuantityBy } : {}) }),
      })
      if (!res.ok) throw new Error('Failed to update listing')
      setShowCompletePrompt(false)
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

  if (showCompletePrompt && seed) {
    const parsed = parseInt(reduceBy, 10)
    return (
      <div className="space-y-2 w-full sm:w-72">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Reduce &ldquo;{plantName}&rdquo; by how much? (You have {seed.quantity} {seed.quantityUnit})
        </label>
        <input
          type="number"
          min={0}
          max={seed.quantity}
          value={reduceBy}
          onChange={(e) => setReduceBy(e.target.value)}
          placeholder="Leave blank to skip"
          className="input w-full"
        />
        <div className="flex gap-2">
          <button onClick={() => setShowCompletePrompt(false)} disabled={loading} className="btn-secondary text-sm flex-1">Cancel</button>
          <button
            onClick={() => setStatus('completed', Number.isFinite(parsed) && parsed > 0 ? parsed : undefined)}
            disabled={loading}
            className="btn-primary text-sm flex-1"
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'completed' && (
        <button
          onClick={() => seed ? setShowCompletePrompt(true) : setStatus('completed')}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
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
