'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Inbox, MessageCircle } from 'lucide-react'

interface ThreadSummary {
  id: string
  listing: { id: string; customPlantName: string | null; type: 'offer' | 'want'; status: string; plantType: { name: string } | null }
  otherUser: { id: string; username: string | null; name: string | null }
  lastMessage: { body: string; createdAt: string } | null
  lastMessageAt: string
  unread: boolean
}

export default function SwapInboxPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/swap/threads')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setThreads(data.threads || [])
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load inbox'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/swap" className="text-sm text-garden-600 dark:text-garden-400 hover:underline flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Swap Board
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Inbox className="w-6 h-6 text-garden-600 dark:text-garden-400" />
        Swap Board Inbox
      </h1>

      {error && <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="card text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Messages you send or receive about swap listings will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const plantName = thread.listing.plantType?.name || thread.listing.customPlantName || 'Unknown Plant'
            return (
              <Link
                key={thread.id}
                href={`/swap/inbox/${thread.id}`}
                className="card hover:shadow-md transition-shadow flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${thread.unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      @{thread.otherUser.username || 'gardener'}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">· {plantName}</span>
                  </div>
                  {thread.lastMessage && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{thread.lastMessage.body}</p>
                  )}
                </div>
                {thread.unread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-garden-600 flex-shrink-0" aria-label="Unread" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
