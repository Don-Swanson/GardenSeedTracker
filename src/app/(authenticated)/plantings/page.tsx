import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ChevronRight } from 'lucide-react'
import { formatDate, plantingStatuses } from '@/lib/garden-utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function PlantingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { status } = params

  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }

  const plantings = await prisma.planting.findMany({
    where,
    include: { 
      seed: { include: { plantType: true } },
      plantingEvents: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planting Log</h1>
          <p className="text-gray-600 mt-1">
            Track where and when you planted your seeds ({plantings.length} records)
          </p>
        </div>
        <Link href="/plantings/new" className="btn btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Log Planting
        </Link>
      </div>

      {/* Status Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/plantings"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !status || status === 'all'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </Link>
          {plantingStatuses.map((s) => (
            <Link
              key={s.value}
              href={`/plantings?status=${s.value}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === s.value
                  ? 'bg-garden-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Plantings List */}
      {plantings.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plantings found</h3>
          <p className="text-gray-500 mb-4">
            {status 
              ? 'Try selecting a different status filter.'
              : 'Start logging your plantings to track your garden progress.'}
          </p>
          <Link href="/plantings/new" className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log Your First Planting
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plantings.map((planting) => {
            const statusInfo = plantingStatuses.find(s => s.value === planting.status)
            const latestEvent = planting.plantingEvents[0]
            const eventCount = planting.plantingEvents.length
            return (
              <div key={planting.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-garden-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-garden-600" />
                    </div>
                    <div className="flex-1">
                      <Link 
                        href={`/seeds/${planting.seed.id}`}
                        className="font-semibold text-gray-900 hover:text-garden-600"
                      >
                        {planting.seed.plantType?.name || planting.seed.customPlantName || planting.seed.nickname || 'Unknown'}
                        {planting.seed.variety && ` (${planting.seed.variety})`}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">{planting.locationName}</span>
                        {' • '}{planting.quantityPlanted} planted total
                      </p>
                      
                      {/* Planting Dates Summary */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-garden-600" />
                          <span className="font-medium text-gray-700">
                            {eventCount} planting date{eventCount !== 1 ? 's' : ''}:
                          </span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {planting.plantingEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-2 h-2 bg-garden-400 rounded-full flex-shrink-0"></span>
                              <span>{formatDate(event.date)}</span>
                              {event.method && (
                                <span className="text-gray-400">({event.method})</span>
                              )}
                              {event.notes && (
                                <span className="text-gray-400 truncate max-w-xs">— {event.notes}</span>
                              )}
                            </div>
                          ))}
                          {eventCount > 3 && (
                            <p className="text-sm text-garden-600">
                              +{eventCount - 3} more date{eventCount - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {planting.harvestDate && (
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="text-green-600 font-medium">Harvested:</span> {formatDate(planting.harvestDate)}
                          {planting.actualYield && ` — ${planting.actualYield}`}
                        </p>
                      )}
                      
                      {planting.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{planting.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className={`text-xs px-3 py-1 rounded-full ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusInfo?.label || planting.status}
                    </span>
                    <Link 
                      href={`/plantings/${planting.id}`}
                      className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
