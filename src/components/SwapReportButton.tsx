'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'

interface SwapReportButtonProps {
  listingId?: string
  messageId?: string
  label?: string
}

export default function SwapReportButton({ listingId, messageId, label = 'Report' }: SwapReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/swap/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, messageId, reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to file report')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file report')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
        <Flag className="w-3.5 h-3.5" /> {label}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <p className="text-gray-900 dark:text-white font-medium">Thanks - a moderator will take a look.</p>
            <button onClick={() => setOpen(false)} className="btn-secondary mt-4 w-full">Close</button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Report {listingId ? 'this listing' : 'this message'}</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What's wrong with it?"
              className="input w-full"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={sending || !reason.trim()} className="btn-primary text-sm flex-1">
                {sending ? 'Sending...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
