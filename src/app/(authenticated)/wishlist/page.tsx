import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, Star, ExternalLink, Check, ShoppingCart } from 'lucide-react'
import WishlistActions from '@/components/WishlistActions'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ show?: string }>
}

export default async function WishlistPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return <div>Please sign in to view your wishlist.</div>
  }
  const userId = session.user.id
  
  const params = await searchParams
  const showPurchased = params.show === 'purchased'

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId, purchased: showPurchased },
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
    include: { plantType: true },
  })

  const purchasedCount = await prisma.wishlistItem.count({
    where: { userId, purchased: true },
  })

  const unpurchasedCount = await prisma.wishlistItem.count({
    where: { userId, purchased: false },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seed Wishlist</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Keep track of seeds you want to buy
          </p>
        </div>
        <Link href="/wishlist/new" className="btn btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Add to Wishlist
        </Link>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-4">
          <Link
            href="/wishlist"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showPurchased
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            To Buy ({unpurchasedCount})
          </Link>
          <Link
            href="/wishlist?show=purchased"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showPurchased
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Check className="w-4 h-4 inline mr-2" />
            Purchased ({purchasedCount})
          </Link>
        </div>
      </div>

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <div className="card text-center py-12">
          <Star className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {showPurchased ? 'No purchased items' : 'Your wishlist is empty'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {showPurchased 
              ? 'Items you mark as purchased will appear here.'
              : 'Start adding seeds you want to buy.'}
          </p>
          {!showPurchased && (
            <Link href="/wishlist/new" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Your First Item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {wishlistItems.map((item) => {
            const itemName = item.plantType?.name || item.customPlantName || 'Unknown'
            return (
            <div key={item.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{itemName}</h3>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.priority
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {item.variety && <span>{item.variety}</span>}
                    {item.brand && <span>• {item.brand}</span>}
                    {item.estimatedPrice && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ${item.estimatedPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>
                  )}
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-garden-600 hover:text-garden-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View source
                    </a>
                  )}
                </div>
                
                <WishlistActions item={{ ...item, name: itemName }} />
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
