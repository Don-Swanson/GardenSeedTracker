import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { haversineMiles } from '@/lib/geo'
import { coarseActivityLabel } from '@/lib/swap'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Truck, Package2 } from 'lucide-react'
import SwapListingActions from '@/components/SwapListingActions'
import SwapMessageButton from '@/components/SwapMessageButton'
import SwapReportButton from '@/components/SwapReportButton'

export const dynamic = 'force-dynamic'

export default async function SwapListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return <div>Please sign in to view this listing.</div>
  }

  const { id } = await params
  const [listing, viewerSettings] = await Promise.all([
    prisma.swapListing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, name: true, lastActiveAt: true } },
        plantType: { select: { id: true, name: true, category: true } },
      },
    }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id }, select: { latitude: true, longitude: true } }),
  ])

  const isOwner = listing?.userId === session.user.id
  if (!listing || (listing.status === 'hidden' && !isOwner)) {
    notFound()
  }

  const plantName = listing.plantType?.name || listing.customPlantName || 'Unknown Plant'
  const distanceMiles = (viewerSettings?.latitude != null && viewerSettings?.longitude != null && listing.latitude != null && listing.longitude != null)
    ? Math.round(haversineMiles(viewerSettings.latitude, viewerSettings.longitude, listing.latitude, listing.longitude))
    : null

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    closed: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    hidden: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/swap" className="text-sm text-garden-600 dark:text-garden-400 hover:underline flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Swap Board
      </Link>

      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              listing.type === 'offer'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {listing.type === 'offer' ? 'Offering' : 'Looking For'}
            </span>
            {listing.status !== 'active' && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge[listing.status]}`}>
                {listing.status}
              </span>
            )}
          </div>
          {distanceMiles !== null && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> ~{distanceMiles} miles away
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {plantName}{listing.variety ? ` (${listing.variety})` : ''}
        </h1>

        {listing.quantity && (
          <p className="text-gray-700 dark:text-gray-300"><strong>Quantity:</strong> {listing.quantity}</p>
        )}
        {listing.description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
        )}

        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          {listing.localPickupOk && <span className="flex items-center gap-1"><Package2 className="w-4 h-4" /> Local pickup</span>}
          {listing.shippingOk && <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> Willing to ship</span>}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">@{listing.user.username || 'gardener'}</p>
            {coarseActivityLabel(listing.user.lastActiveAt) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{coarseActivityLabel(listing.user.lastActiveAt)}</p>
            )}
          </div>

          {isOwner ? (
            <SwapListingActions listingId={listing.id} status={listing.status} plantName={plantName} />
          ) : (
            <div className="flex flex-col items-end gap-2">
              <SwapMessageButton listingId={listing.id} ownerUsername={listing.user.username || 'gardener'} />
              <SwapReportButton listingId={listing.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
