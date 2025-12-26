import Link from 'next/link'
import { Seed, Planting } from '@prisma/client'
import { Sun, Droplets, Calendar, Package } from 'lucide-react'
import { formatDate, seedCategories } from '@/lib/garden-utils'

interface SeedWithPlantings extends Seed {
  plantings: Planting[]
}

interface SeedCardProps {
  seed: SeedWithPlantings
}

export default function SeedCard({ seed }: SeedCardProps) {
  const category = seedCategories.find(c => c.value === seed.category)
  const lastPlanting = seed.plantings[0]
  
  // Check if seeds are expiring soon (within 3 months)
  const isExpiringSoon = seed.expirationDate && 
    new Date(seed.expirationDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const isExpired = seed.expirationDate && new Date(seed.expirationDate) < new Date()

  return (
    <Link href={`/seeds/${seed.id}`} className="card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{category?.emoji || '🌱'}</span>
            <h3 className="font-semibold text-gray-900 group-hover:text-garden-600 transition-colors">
              {seed.name}
            </h3>
          </div>
          {seed.variety && (
            <p className="text-sm text-gray-500 mt-0.5">{seed.variety}</p>
          )}
        </div>
        {seed.brand && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {seed.brand}
          </span>
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Package className="w-4 h-4" />
        <span>
          {seed.quantity} {seed.quantityUnit}
        </span>
        {(isExpired || isExpiringSoon) && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
            isExpired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isExpired ? 'Expired' : 'Expiring soon'}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-3">
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
      </div>

      {/* Last Planting */}
      {lastPlanting && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Last planted: {formatDate(lastPlanting.plantingDate)} at {lastPlanting.location}
          </p>
        </div>
      )}
    </Link>
  )
}
