'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'

interface SwapBlockButtonProps {
  userId: string
  username: string
}

export default function SwapBlockButton({ userId, username }: SwapBlockButtonProps) {
  const router = useRouter()
  const [blocking, setBlocking] = useState(false)

  const handleBlock = async () => {
    if (!confirm(`Block @${username}? You won't see their listings, and neither of you will be able to message the other.`)) return
    setBlocking(true)
    try {
      const res = await fetch('/api/swap/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Failed to block user')
      router.push('/swap/inbox')
      router.refresh()
    } catch {
      alert('Failed to block user')
      setBlocking(false)
    }
  }

  return (
    <button onClick={handleBlock} disabled={blocking} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
      <ShieldOff className="w-3.5 h-3.5" /> {blocking ? 'Blocking...' : 'Block'}
    </button>
  )
}
