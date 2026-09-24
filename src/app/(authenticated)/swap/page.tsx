'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Repeat, Search, MapPin, Truck, Package2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

interface SwapListing {
  id: string
  type: 'offer' | 'want'
  customPlantName: string | null
  variety: string | null
  quantity: string | null
  description: string | null
  shippingOk: boolean
  localPickupOk: boolean
  createdAt: string
  distanceMiles?: number
  plantType: { id: string; name: string; category: string } | null
  user: { id: string; username: string | null; name: string | null; lastActiveAt: string | null }
}

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '10', label: 'Within 10 miles' },
  { value: '25', label: 'Within 25 miles' },
  { value: '50', label: 'Within 50 miles' },
  { value: '100', label: 'Within 100 miles' },
]

export default function SwapBoardPage() {
  const [listings, setListings] = useState<SwapListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState<'all' | 'offer' | 'want'>('all')
  const [search, setSearch] = useState('')
  const [maxDistanceMiles, setMaxDistanceMiles] = useState('')
  const [sort, setSort] = useState<'newest' | 'distance'>('newest')
  const [shippingOk, setShippingOk] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), sort })
      if (type !== 'all') params.set('type', type)
      if (search) params.set('q', search)
      if (maxDistanceMiles) params.set('maxDistanceMiles', maxDistanceMiles)
      if (shippingOk) params.set('shippingOk', 'true')

      const res = await fetch(`/api/swap/listings?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load the swap board')
      setListings(data.listings)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the swap board')
    } finally {
      setLoading(false)
    }
  }, [page, type, search, maxDistanceMiles, sort, shippingOk])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-7 h-7 text-garden-600 dark:text-garden-400" />
            Seed Swap Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Trade seeds with other gardeners. Messages stay in-app - you choose what to share.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/swap/mine" className="btn-secondary flex items-center gap-2 w-fit">
            <Inbox className="w-4 h-4" />
            My Listings
          </Link>
          <Link href="/swap/new" className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="w-5 h-5" />
            Post a Listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plant, variety, or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as typeof type); setPage(1) }}
            className="input md:w-40"
          >
            <option value="all">Offers &amp; Wants</option>
            <option value="offer">Offering</option>
            <option value="want">Looking For</option>
          </select>
          <select
            value={maxDistanceMiles}
            onChange={(e) => { setMaxDistanceMiles(e.target.value); setPage(1) }}
            className="input md:w-48"
          >
            {DISTANCE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="input md:w-40"
          >
            <option value="newest">Newest first</option>
            <option value="distance">Nearest first</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={shippingOk}
            onChange={(e) => { setShippingOk(e.target.checked); setPage(1) }}
            className="rounded border-gray-300"
          />
          Shipping available only
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">{error}</div>
      )}

      {/* Listings */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-12">
          <Repeat className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No listings found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Try widening your filters, or be the first to post.</p>
          <Link href="/swap/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Post a Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const plantName = listing.plantType?.name || listing.customPlantName || 'Unknown Plant'
            return (
              <Link
                key={listing.id}
                href={`/swap/${listing.id}`}
                className="card hover:shadow-md transition-shadow flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    listing.type === 'offer'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {listing.type === 'offer' ? 'Offering' : 'Looking For'}
                  </span>
                  {typeof listing.distanceMiles === 'number' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> ~{listing.distanceMiles} mi
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {plantName}{listing.variety ? ` (${listing.variety})` : ''}
                </h3>
                {listing.quantity && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{listing.quantity}</p>
                )}
                {listing.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{listing.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2">
                  <span>@{listing.user.username || 'gardener'}</span>
                  {listing.shippingOk && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Ships</span>}
                  {listing.localPickupOk && <span className="flex items-center gap-1"><Package2 className="w-3 h-3" /> Pickup</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
