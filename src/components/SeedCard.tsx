import Link from 'next/link'
import { Seed, Planting, PlantingGuide, PlantingEvent } from '@prisma/client'
import { Sun, Droplets, Calendar, Package, Lock } from 'lucide-react'
import { formatDate, seedCategories } from '@/lib/garden-utils'
import { getFeatures } from '@/lib/subscription'

interface SeedWithPlantings extends Seed {
  plantType?: PlantingGuide | null
  plantings: (Planting & { plantingEvents?: PlantingEvent[] })[]
}

interface SeedCardProps {
  seed: SeedWithPlantings
  isPaid?: boolean
}

export default function SeedCard({ seed, isPaid = false }: SeedCardProps) {
  const features = getFeatures(isPaid)
  const categoryValue = seed.plantType?.category || seed.customCategory
  const category = seedCategories.find(c => c.value === categoryValue)
  const lastPlanting = seed.plantings[0]
  const seedName = seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown'
  
  // Check if seeds are expiring soon (within 3 months)
  const isExpiringSoon = seed.expirationDate && 
    new Date(seed.expirationDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const isExpired = seed.expirationDate && new Date(seed.expirationDate) < new Date()
  
  // Check if there's premium data to show
  const hasGrowingInfo = seed.sunRequirement || seed.waterNeeds || seed.daysToMaturity
  const hasPlantingHistory = lastPlanting

  return (
    <Link href={`/seeds/${seed.id}`} className="card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{category?.emoji || '🌱'}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-garden-600 dark:group-hover:text-garden-400 transition-colors">
              {seedName}
            </h3>
          </div>
          {seed.variety && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{seed.variety}</p>
          )}
        </div>
        {seed.brand && (
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {seed.brand}
          </span>
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Package className="w-4 h-4" />
        <span>
          {seed.quantity} {seed.quantityUnit}
        </span>
        {features.canViewSeedDates && (isExpired || isExpiringSoon) && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
            isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
          }`}>
            {isExpired ? 'Expired' : 'Expiring soon'}
          </span>
        )}
        {!features.canViewSeedDates && seed.expirationDate && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Expiry
          </span>
        )}
      </div>

      {/* Details - Growing Info (Premium) */}
      {hasGrowingInfo && (
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
          {features.canViewGrowingInfo ? (
            <>
              {seed.sunRequirement && (
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="capitalize">{seed.sunRequirement}</span>
                </div>
              )}
              {seed.waterNeeds && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="capitalize">{seed.waterNeeds} water</span>
                </div>
              )}
              {seed.daysToMaturity && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-garden-500" />
                  <span>{seed.daysToMaturity} days to maturity</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4" />
              <span className="text-xs">Growing info hidden • Upgrade to view</span>
            </div>
          )}
        </div>
      )}

      {/* Last Planting (Premium) */}
      {hasPlantingHistory && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {features.canViewPlantingHistory ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last planted: {lastPlanting.plantingEvents?.[0]?.date ? formatDate(lastPlanting.plantingEvents[0].date) : 'Unknown'} at {lastPlanting.locationName}
            </p>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Planting history hidden • Upgrade to view
            </p>
          )}
        </div>
      )}
    </Link>
  )
}
