import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Calendar, Sun, Droplets, Package, MapPin } from 'lucide-react'
import { formatDate, seedCategories, plantingStatuses } from '@/lib/garden-utils'
import DeleteSeedButton from '@/components/DeleteSeedButton'
import { getAuthSession } from '@/lib/auth'
import { getFeatures } from '@/lib/subscription'
import LockedContent, { LockedCard, ProBadge } from '@/components/LockedContent'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SeedDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Get user session for subscription check
  const session = await getAuthSession()
  const isPaid = session?.user?.isPaid ?? false
  const features = getFeatures(isPaid)
  
  const seed = await prisma.seed.findUnique({
    where: { id },
    include: {
      plantType: true,
      plantings: {
        orderBy: { createdAt: 'desc' },
        include: {
          plantingEvents: { orderBy: { date: 'desc' } },
          location: true,
        },
      },
    },
  })

  if (!seed) {
    notFound()
  }

  const categoryValue = seed.plantType?.category || seed.customCategory
  const category = seedCategories.find(c => c.value === categoryValue)
  const isExpired = seed.expirationDate && new Date(seed.expirationDate) < new Date()
  const seedName = seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown'

  // Get planting guide for this seed type
  const plantingGuide = seed.plantType
  
  // Check if premium data exists (for showing locked previews)
  const hasDates = !!(seed.purchaseDate || seed.expirationDate)
  const hasGrowingInfo = !!(seed.sunRequirement || seed.waterNeeds || seed.daysToGerminate || seed.daysToMaturity || seed.spacing || seed.plantingDepth)
  const hasNotes = !!seed.notes
  const hasSource = !!(seed.source || seed.lotNumber)
  const hasPlantingHistory = seed.plantings.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/seeds" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Seeds
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category?.emoji || '🌱'}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{seedName}</h1>
                {seed.variety && (
                  <p className="text-lg text-gray-600">{seed.variety}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/seeds/${seed.id}/edit`} className="btn btn-secondary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <DeleteSeedButton seedId={seed.id} seedName={seedName} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Status */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Status
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {seed.quantity} {seed.quantityUnit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Brand</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {seed.brand || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Purchased
                  {!features.canViewSeedDates && <ProBadge />}
                </p>
                <LockedContent hasAccess={features.canViewSeedDates} hasData={!!seed.purchaseDate} placeholder="—">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatDate(seed.purchaseDate)}
                  </p>
                </LockedContent>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Expires
                  {!features.canViewSeedDates && <ProBadge />}
                </p>
                <LockedContent hasAccess={features.canViewSeedDates} hasData={!!seed.expirationDate} placeholder="—">
                  <p className={`text-lg font-medium ${isExpired ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {formatDate(seed.expirationDate)}
                    {isExpired && ' (Expired)'}
                  </p>
                </LockedContent>
              </div>
            </div>
          </div>

          {/* Growing Info */}
          <LockedCard
            hasAccess={features.canViewGrowingInfo}
            hasData={hasGrowingInfo}
            title="Growing Information"
            featureName="Growing Info"
          >
            <div className="card border-0 shadow-none p-0">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Growing Information</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {seed.sunRequirement && (
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sun</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{seed.sunRequirement}</p>
                    </div>
                  </div>
                )}
                {seed.waterNeeds && (
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Water</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{seed.waterNeeds}</p>
                    </div>
                  </div>
                )}
                {seed.daysToGerminate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-garden-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Germination</p>
                      <p className="font-medium text-gray-900 dark:text-white">{seed.daysToGerminate} days</p>
                    </div>
                  </div>
                )}
                {seed.daysToMaturity && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-garden-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Maturity</p>
                      <p className="font-medium text-gray-900 dark:text-white">{seed.daysToMaturity} days</p>
                    </div>
                  </div>
                )}
                {seed.spacing && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spacing</p>
                    <p className="font-medium text-gray-900 dark:text-white">{seed.spacing}</p>
                  </div>
                )}
                {seed.plantingDepth && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Planting Depth</p>
                    <p className="font-medium text-gray-900 dark:text-white">{seed.plantingDepth}</p>
                  </div>
                )}
              </div>
            </div>
          </LockedCard>

          {/* Notes */}
          {(hasNotes || !features.canViewSeedNotes) && (
            <LockedCard
              hasAccess={features.canViewSeedNotes}
              hasData={hasNotes}
              title="Notes"
              featureName="Notes"
            >
              <div className="card border-0 shadow-none p-0">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
                <p className="text-gray-700 dark:text-gray-300">{seed.notes}</p>
              </div>
            </LockedCard>
          )}

          {/* Source Info */}
          {(hasSource || !features.canViewSeedSource) && (
            <LockedCard
              hasAccess={features.canViewSeedSource}
              hasData={hasSource}
              title="Source Information"
              featureName="Source Info"
            >
              <div className="card border-0 shadow-none p-0">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Source Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  {seed.source && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
                      <p className="font-medium text-gray-900 dark:text-white">{seed.source}</p>
                    </div>
                  )}
                  {seed.lotNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lot Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">{seed.lotNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </LockedCard>
          )}

          {/* Planting History */}
          <LockedCard
            hasAccess={features.canViewPlantingHistory}
            hasData={hasPlantingHistory}
            title="Planting History"
            featureName="Planting History"
          >
            <div className="card border-0 shadow-none p-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Planting History
                </h2>
                <Link 
                  href={`/plantings/new?seedId=${seed.id}`}
                  className="text-sm text-garden-600 hover:text-garden-700 dark:text-garden-400"
                >
                  Log planting →
                </Link>
              </div>

              {seed.plantings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No plantings recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {seed.plantings.map((planting: typeof seed.plantings[0]) => {
                    const status = plantingStatuses.find(s => s.value === planting.status)
                    const lastEvent = planting.plantingEvents?.[0]
                    return (
                      <div 
                        key={planting.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{planting.location?.name || planting.locationName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {lastEvent ? formatDate(lastEvent.date) : 'No date'} • {planting.quantityPlanted} planted
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${status?.color || 'bg-gray-100 text-gray-800'}`}>
                          {status?.label || planting.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </LockedCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Planting Guide */}
          {plantingGuide && (
            <div className="card bg-garden-50 border-garden-200">
              <h2 className="font-semibold text-garden-900 mb-4">Planting Guide</h2>
              
              <div className="space-y-3 text-sm">
                {plantingGuide.indoorStartWeeks && (
                  <div>
                    <p className="text-garden-700 font-medium">Start Indoors</p>
                    <p className="text-garden-600">
                      {plantingGuide.indoorStartWeeks} weeks before last frost
                    </p>
                  </div>
                )}
                {plantingGuide.outdoorStartWeeks !== null && (
                  <div>
                    <p className="text-garden-700 font-medium">Direct Sow</p>
                    <p className="text-garden-600">
                      {plantingGuide.outdoorStartWeeks >= 0 
                        ? `${plantingGuide.outdoorStartWeeks} weeks after last frost`
                        : `${Math.abs(plantingGuide.outdoorStartWeeks)} weeks before last frost`
                      }
                    </p>
                  </div>
                )}
                {plantingGuide.minGerminationTemp && (
                  <div>
                    <p className="text-garden-700 font-medium">Soil Temperature</p>
                    <p className="text-garden-600">
                      Min: {plantingGuide.minGerminationTemp}°F
                      {plantingGuide.optGerminationTemp && ` • Optimal: ${plantingGuide.optGerminationTemp}°F`}
                    </p>
                  </div>
                )}
                {plantingGuide.companionPlants && (
                  <div>
                    <p className="text-garden-700 font-medium">Companion Plants</p>
                    <p className="text-garden-600">{plantingGuide.companionPlants}</p>
                  </div>
                )}
                {plantingGuide.avoidPlants && (
                  <div>
                    <p className="text-garden-700 font-medium">Avoid Planting With</p>
                    <p className="text-garden-600">{plantingGuide.avoidPlants}</p>
                  </div>
                )}
                {plantingGuide.commonPests && (
                  <div>
                    <p className="text-garden-700 font-medium">Common Pests</p>
                    <p className="text-garden-600">{plantingGuide.commonPests}</p>
                  </div>
                )}
              </div>

              <Link 
                href="/calendar"
                className="block mt-4 text-center text-sm text-garden-700 hover:text-garden-800"
              >
                View planting calendar →
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link 
                href={`/plantings/new?seedId=${seed.id}`}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Log Planting
              </Link>
              <Link 
                href={`/seeds/${seed.id}/edit`}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
