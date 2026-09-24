'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'

interface SwapMessageButtonProps {
  listingId: string
  ownerUsername: string
}

export default function SwapMessageButton({ listingId, ownerUsername }: SwapMessageButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/swap/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      router.push(`/swap/inbox/${data.threadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
        <MessageCircle className="w-4 h-4" /> Message @{ownerUsername}
      </button>
    )
  }

  return (
    <div className="w-full sm:w-96 space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={`Say hello to @${ownerUsername}...`}
        className="input w-full"
        autoFocus
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1">Cancel</button>
        <button onClick={handleSend} disabled={sending || !message.trim()} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
