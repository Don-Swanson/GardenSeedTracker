'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: string
  senderId: string
  body: string
  createdAt: string
}

interface ThreadDetail {
  id: string
  listing: { id: string; customPlantName: string | null; plantType: { name: string } | null }
  otherUser: { id: string; username: string | null; name: string | null }
  messages: Message[]
}

export default function SwapConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadThread = useCallback(() => {
    fetch(`/api/swap/threads/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setThread(data)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load conversation'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadThread() }, [loadThread])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread?.messages.length])

  const handleSend = async () => {
    if (!reply.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/swap/threads/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setReply('')
      loadThread()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
  if (error && !thread) return <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">{error}</div>
  if (!thread) return null

  const plantName = thread.listing.plantType?.name || thread.listing.customPlantName || 'Unknown Plant'
  const myId = session?.user?.id

  return (
    <div className="max-w-2xl mx-auto space-y-4 flex flex-col h-[calc(100vh-12rem)]">
      <div>
        <Link href="/swap/inbox" className="text-sm text-garden-600 dark:text-garden-400 hover:underline flex items-center gap-1 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
          @{thread.otherUser.username || 'gardener'}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> · about {plantName}</span>
        </h1>
        <Link href={`/swap/${thread.listing.id}`} className="text-xs text-garden-600 dark:text-garden-400 hover:underline">
          View listing →
        </Link>
      </div>

      <div className="card flex-1 overflow-y-auto space-y-3">
        {thread.messages.map((msg) => {
          const isMine = msg.senderId === myId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                isMine
                  ? 'bg-garden-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                {msg.body}
                <div className={`text-[10px] mt-1 ${isMine ? 'text-garden-100' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Type a message..."
          maxLength={2000}
          className="input flex-1"
        />
        <button onClick={handleSend} disabled={sending || !reply.trim()} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
