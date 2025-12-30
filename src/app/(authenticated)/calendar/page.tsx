import { prisma } from '@/lib/prisma'
import { hardinessZones, parseFrostDate, calculatePlantingDates, seedCategories } from '@/lib/garden-utils'
import { format, addWeeks } from 'date-fns'
import Link from 'next/link'
import { CalendarDays, Info, Thermometer } from 'lucide-react'

export const dynamic = 'force-dynamic'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { category } = params

  const settings = await prisma.userSettings.findFirst()
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  
  const currentYear = new Date().getFullYear()
  const lastFrost = settings?.lastFrostDate 
    ? new Date(settings.lastFrostDate)
    : parseFrostDate(zoneInfo?.lastFrostSpring || 'Apr 15', currentYear)
  const firstFrost = settings?.firstFrostDate
    ? new Date(settings.firstFrostDate)
    : parseFrostDate(zoneInfo?.firstFrostFall || 'Oct 15', currentYear)

  // Get planting guides
  const where: any = {}
  if (category && category !== 'all') {
    where.category = category
  }

  const plantingGuides = await prisma.plantingGuide.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  // Calculate planting windows for each crop
  const plantingCalendar = plantingGuides.map(guide => {
    const dates = lastFrost ? calculatePlantingDates(
      lastFrost,
      guide.indoorStartWeeks,
      guide.outdoorStartWeeks,
      guide.transplantWeeks
    ) : { indoorStart: null, outdoorStart: null, transplant: null }

    const harvestDate = dates.outdoorStart && guide.harvestWeeks
      ? addWeeks(dates.outdoorStart, guide.harvestWeeks)
      : null

    return {
      ...guide,
      ...dates,
      harvestDate,
    }
  })

  // Helper to get month index from date
  const getMonthIndex = (date: Date | null) => date ? date.getMonth() : -1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planting Calendar</h1>
        <p className="text-gray-600 mt-1">
          When to plant based on your growing zone
        </p>
      </div>

      {/* Zone Info */}
      <div className="card bg-garden-50 border-garden-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-garden-600" />
            <div>
              <h2 className="font-semibold text-garden-900">
                USDA Hardiness Zone {zone}
              </h2>
              <p className="text-sm text-garden-700">
                Last Spring Frost: {lastFrost ? format(lastFrost, 'MMMM d') : 'Not set'}
                {' • '}
                First Fall Frost: {firstFrost ? format(firstFrost, 'MMMM d') : 'Not set'}
              </p>
            </div>
          </div>
          <Link href="/settings" className="btn btn-primary w-fit">
            Update Zone
          </Link>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/calendar"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !category || category === 'all'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </Link>
          {seedCategories.map((cat) => (
            <Link
              key={cat.value}
              href={`/calendar?category=${cat.value}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-garden-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <span>Start Indoors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>Direct Sow / Transplant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-400 rounded"></div>
            <span>Harvest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded border-2 border-blue-400"></div>
            <span>Last Frost</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded border-2 border-red-400"></div>
            <span>First Frost</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 font-semibold text-gray-900 sticky left-0 bg-white">
                Crop
              </th>
              {months.map((month, index) => {
                const isLastFrostMonth = lastFrost && getMonthIndex(lastFrost) === index
                const isFirstFrostMonth = firstFrost && getMonthIndex(firstFrost) === index
                return (
                  <th 
                    key={month} 
                    className={`text-center py-3 px-1 text-xs font-medium ${
                      isLastFrostMonth ? 'bg-blue-50' : isFirstFrostMonth ? 'bg-red-50' : ''
                    }`}
                  >
                    {month.slice(0, 3)}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {plantingCalendar.map((crop) => {
              const indoorMonth = getMonthIndex(crop.indoorStart)
              const outdoorMonth = getMonthIndex(crop.outdoorStart)
              const transplantMonth = getMonthIndex(crop.transplant)
              const harvestMonth = getMonthIndex(crop.harvestDate)
              const categoryInfo = seedCategories.find(c => c.value === crop.category)

              return (
                <tr key={crop.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <span>{categoryInfo?.emoji || '🌱'}</span>
                      <span className="font-medium text-gray-900">{crop.name}</span>
                    </div>
                  </td>
                  {months.map((month, index) => {
                    const isIndoor = indoorMonth === index
                    const isOutdoor = outdoorMonth === index || transplantMonth === index
                    const isHarvest = harvestMonth === index
                    const isLastFrostMonth = lastFrost && getMonthIndex(lastFrost) === index
                    const isFirstFrostMonth = firstFrost && getMonthIndex(firstFrost) === index

                    return (
                      <td 
                        key={month} 
                        className={`text-center py-2 px-1 ${
                          isLastFrostMonth ? 'bg-blue-50' : 
                          isFirstFrostMonth ? 'bg-red-50' : ''
                        }`}
                      >
                        <div className="flex justify-center gap-0.5">
                          {isIndoor && (
                            <div 
                              className="w-3 h-3 bg-purple-400 rounded-full" 
                              title={`Start indoors: ${crop.indoorStart ? format(crop.indoorStart, 'MMM d') : ''}`}
                            />
                          )}
                          {isOutdoor && (
                            <div 
                              className="w-3 h-3 bg-green-400 rounded-full"
                              title={`Plant outside: ${crop.outdoorStart ? format(crop.outdoorStart, 'MMM d') : ''}`}
                            />
                          )}
                          {isHarvest && (
                            <div 
                              className="w-3 h-3 bg-amber-400 rounded-full"
                              title={`Harvest: ${crop.harvestDate ? format(crop.harvestDate, 'MMM d') : ''}`}
                            />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Planting Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Planting Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantingCalendar.map((crop) => {
            const categoryInfo = seedCategories.find(c => c.value === crop.category)
            return (
              <div key={crop.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{categoryInfo?.emoji || '🌱'}</span>
                  <h3 className="font-semibold text-gray-900">{crop.name}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {crop.indoorStart && (
                    <div className="flex justify-between">
                      <span className="text-purple-600">Start Indoors:</span>
                      <span className="font-medium">{format(crop.indoorStart, 'MMM d')}</span>
                    </div>
                  )}
                  {crop.outdoorStart && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Direct Sow:</span>
                      <span className="font-medium">{format(crop.outdoorStart, 'MMM d')}</span>
                    </div>
                  )}
                  {crop.transplant && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Transplant:</span>
                      <span className="font-medium">{format(crop.transplant, 'MMM d')}</span>
                    </div>
                  )}
                  {crop.harvestDate && (
                    <div className="flex justify-between">
                      <span className="text-amber-600">Harvest:</span>
                      <span className="font-medium">{format(crop.harvestDate, 'MMM d')}</span>
                    </div>
                  )}
                  {crop.minGerminationTemp && (
                    <div className="flex justify-between text-gray-600">
                      <span>Soil Temp:</span>
                      <span>{crop.minGerminationTemp}°F - {crop.optGerminationTemp}°F</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
