import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Plus, Repeat } from 'lucide-react'
import SwapListingActions from '@/components/SwapListingActions'

export const dynamic = 'force-dynamic'

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  closed: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  hidden: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export default async function MySwapListingsPage() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return <div>Please sign in to view your listings.</div>
  }

  const listings = await prisma.swapListing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      plantType: { select: { name: true } },
      seed: { select: { id: true, quantity: true, quantityUnit: true } },
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/swap" className="text-sm text-garden-600 dark:text-garden-400 hover:underline flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Swap Board
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h1>
        <Link href="/swap/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" /> Post a Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="card text-center py-12">
          <Repeat className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">You haven&apos;t posted anything yet</h3>
          <Link href="/swap/new" className="btn-primary inline-flex items-center gap-2 mt-2">
            <Plus className="w-5 h-5" /> Post a Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const plantName = listing.plantType?.name || listing.customPlantName || 'Unknown Plant'
            return (
              <div key={listing.id} className="card space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      listing.type === 'offer'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {listing.type === 'offer' ? 'Offering' : 'Looking For'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>
                  {listing.expiresAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Expires {new Date(listing.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link href={`/swap/${listing.id}`} className="font-semibold text-gray-900 dark:text-white hover:underline block">
                  {plantName}{listing.variety ? ` (${listing.variety})` : ''}
                </Link>
                {listing.quantity && <p className="text-sm text-gray-500 dark:text-gray-400">{listing.quantity}</p>}
                <SwapListingActions listingId={listing.id} status={listing.status} plantName={plantName} seed={listing.seed} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
