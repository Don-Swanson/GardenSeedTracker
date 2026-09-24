'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flag, CheckCircle, XCircle, EyeOff, Eye, Clock } from 'lucide-react'

interface SwapReport {
  id: string
  reason: string
  status: string
  adminNotes: string | null
  createdAt: string
  reporter: { id: string; username: string | null; email: string }
  reportedUser: { id: string; username: string | null; email: string } | null
  listing: { id: string; customPlantName: string | null; status: string; plantType: { name: string } | null } | null
  message: { id: string; body: string; threadId: string } | null
}

type StatusFilter = 'pending' | 'resolved' | 'dismissed' | 'all'

export default function AdminSwapReportsPage() {
  const [reports, setReports] = useState<SwapReport[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({ pending: 0, resolved: 0, dismissed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/swap/reports?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setReports(data.reports || [])
      if (data.counts) setCounts(data.counts)
    } catch (err) {
      setError('Failed to load reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleReview = async (id: string, action: 'resolve' | 'dismiss', hideListing = false) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/swap/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, hideListing }),
      })
      if (!res.ok) throw new Error('Failed to update report')
      fetchReports()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update report')
    } finally {
      setProcessing(null)
    }
  }

  const handleListingVisibility = async (listingId: string, action: 'hide' | 'unhide') => {
    setProcessing(listingId)
    try {
      const res = await fetch(`/api/admin/swap/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Failed to update listing')
      fetchReports()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update listing')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Swap Board Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review reported listings and messages</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'resolved', 'dismissed', 'all'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-4 rounded-lg border transition-colors ${
              statusFilter === status
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold">{status === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[status] || 0}</div>
            <div className="text-sm text-gray-500 capitalize">{status}</div>
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Flag className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No {statusFilter === 'all' ? '' : statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const plantName = report.listing?.plantType?.name || report.listing?.customPlantName
            return (
              <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" /> {new Date(report.createdAt).toLocaleString()}
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : report.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{report.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reported by @{report.reporter.username || report.reporter.email}
                  </p>
                </div>

                <p className="text-gray-900 dark:text-white"><strong>Reason:</strong> {report.reason}</p>

                {report.reportedUser && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    About: @{report.reportedUser.username || report.reportedUser.email}
                  </p>
                )}

                {report.listing && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                    <Link href={`/swap/${report.listing.id}`} className="font-medium text-green-600 dark:text-green-400 hover:underline">
                      {plantName || 'Listing'}
                    </Link>
                    <span className="ml-2 text-gray-500 dark:text-gray-400 capitalize">({report.listing.status})</span>
                  </div>
                )}

                {report.message && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    &ldquo;{report.message.body}&rdquo;
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(report.id, 'resolve', true)}
                        disabled={processing === report.id || !report.listing}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <EyeOff className="w-4 h-4" /> Resolve &amp; Hide Listing
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'resolve')}
                        disabled={processing === report.id}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'dismiss')}
                        disabled={processing === report.id}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Dismiss
                      </button>
                    </>
                  )}
                  {report.listing?.status === 'hidden' && (
                    <button
                      onClick={() => handleListingVisibility(report.listing!.id, 'unhide')}
                      disabled={processing === report.listing.id}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Unhide Listing
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
