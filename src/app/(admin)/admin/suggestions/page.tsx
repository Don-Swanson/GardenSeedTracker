'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

interface PlantSuggestion {
  id: string
  plantId: string
  plant: {
    id: string
    name: string
  }
  userId: string | null
  userEmail: string | null
  userName: string | null
  section: string
  suggestionType: string
  currentContent: string | null
  suggestedContent: string
  sourceUrl: string | null
  notes: string | null
  status: string
  adminNotes: string | null
  reviewedById: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

type StatusFilter = 'all' | 'pending' | 'reviewing' | 'approved' | 'rejected'

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<PlantSuggestion[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({ pending: 0, reviewing: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [statusFilter])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const res = await fetch(`/api/admin/suggestions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch suggestions')
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      if (data.counts) {
        setCounts(data.counts)
      }
    } catch (err) {
      setError('Failed to load suggestions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(id)
      const notes = adminNotes[id] || ''
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes: notes })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update suggestion')
      }
      // Refresh the list
      fetchSuggestions()
      setExpandedId(null)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to update suggestion')
    } finally {
      setProcessing(null)
    }
  }

  const filteredSuggestions = suggestions.filter(s => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      s.plant.name.toLowerCase().includes(term) ||
      s.userEmail?.toLowerCase().includes(term) ||
      s.userName?.toLowerCase().includes(term) ||
      s.section.toLowerCase().includes(term) ||
      s.suggestedContent.toLowerCase().includes(term)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>
      case 'reviewing':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1"><Eye className="h-3 w-3" />Reviewing</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>
    }
  }

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      general: 'General Info',
      zones: 'Growing Zones',
      facts: 'Quick Facts',
      variations: 'Varieties',
      recipes: 'Recipes',
      medicinal: 'Medicinal Uses',
      holistic: 'Holistic Info'
    }
    return labels[section] || section
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'addition':
        return <span className="text-green-600 dark:text-green-400">+ Addition</span>
      case 'correction':
        return <span className="text-blue-600 dark:text-blue-400">✎ Correction</span>
      case 'removal':
        return <span className="text-red-600 dark:text-red-400">- Removal</span>
      default:
        return <span>{type}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Plant Suggestions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and manage user-submitted plant information suggestions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by plant, user, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'reviewing', 'approved', 'rejected'] as const).map(status => {
          const count = counts[status] || 0
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-4 rounded-lg border transition-colors ${
                statusFilter === status 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{status}</div>
            </button>
          )
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading suggestions...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredSuggestions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No suggestions match your search' : `No ${statusFilter === 'all' ? '' : statusFilter} suggestions`}
          </p>
        </div>
      )}

      {/* Suggestions list */}
      {!loading && filteredSuggestions.length > 0 && (
        <div className="space-y-4">
          {filteredSuggestions.map(suggestion => (
            <div 
              key={suggestion.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header row - always visible */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button className="flex-shrink-0">
                    {expandedId === suggestion.id ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link 
                        href={`/plants/${suggestion.plant.id}`}
                        className="font-medium text-green-600 dark:text-green-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {suggestion.plant.name}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{getSectionLabel(suggestion.section)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm">{getSuggestionTypeLabel(suggestion.suggestionType)}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {suggestion.userName || suggestion.userEmail || 'Anonymous'} • {new Date(suggestion.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {getStatusBadge(suggestion.status)}
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === suggestion.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                  {/* Current vs Suggested */}
                  {suggestion.currentContent && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Content:</h4>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-sm whitespace-pre-wrap">
                        {suggestion.currentContent}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Content:</h4>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-sm whitespace-pre-wrap">
                      {suggestion.suggestedContent}
                    </div>
                  </div>

                  {/* Source URL */}
                  {suggestion.sourceUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source:</h4>
                      <a 
                        href={suggestion.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                      >
                        {suggestion.sourceUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* User notes */}
                  {suggestion.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Notes:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.notes}</p>
                    </div>
                  )}

                  {/* Existing admin notes */}
                  {suggestion.adminNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Notes:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.adminNotes}</p>
                    </div>
                  )}

                  {/* Actions for pending/reviewing */}
                  {(suggestion.status === 'pending' || suggestion.status === 'reviewing') && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Admin Notes (optional):
                        </label>
                        <textarea
                          value={adminNotes[suggestion.id] || ''}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [suggestion.id]: e.target.value })}
                          placeholder="Add notes about this review decision..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(suggestion.id, 'approve')}
                          disabled={processing === suggestion.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processing === suggestion.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(suggestion.id, 'reject')}
                          disabled={processing === suggestion.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          {processing === suggestion.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        Note: Approving a suggestion marks it for manual implementation. You'll need to update the plant information manually.
                      </p>
                    </div>
                  )}

                  {/* Review info for already reviewed */}
                  {suggestion.reviewedAt && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Reviewed on {new Date(suggestion.reviewedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
