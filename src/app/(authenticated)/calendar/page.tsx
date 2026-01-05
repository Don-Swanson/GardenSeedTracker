import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { hardinessZones, parseFrostDate, calculatePlantingDates, seedCategories } from '@/lib/garden-utils'
import { format, addWeeks } from 'date-fns'
import Link from 'next/link'
import { Thermometer, Package, Star, Layers } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface PageProps {
  searchParams: Promise<{ category?: string; view?: string }>
}

interface PlantingCalendarItem {
  id: string
  name: string
  variety?: string | null
  category: string | null
  indoorStart: Date | null
  outdoorStart: Date | null
  transplant: Date | null
  harvestDate: Date | null
  minGerminationTemp?: number | null
  optGerminationTemp?: number | null
  source: 'encyclopedia' | 'inventory' | 'wishlist'
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  
  const userId = session?.user?.id
  
  const params = await searchParams
  const { category, view = 'all' } = params

  // Get user-specific settings if logged in, otherwise use defaults
  const settings = userId ? await prisma.userSettings.findFirst({ where: { userId } }) : null
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  
  const currentYear = new Date().getFullYear()
  const lastFrost = settings?.lastFrostDate 
    ? new Date(settings.lastFrostDate)
    : parseFrostDate(zoneInfo?.lastFrostSpring || 'Apr 15', currentYear)
  const firstFrost = settings?.firstFrostDate
    ? new Date(settings.firstFrostDate)
    : parseFrostDate(zoneInfo?.firstFrostFall || 'Oct 15', currentYear)

  let plantingCalendar: PlantingCalendarItem[] = []

  if (view === 'all') {
    // Get all planting guides from encyclopedia
    const where: Record<string, unknown> = {}
    if (category && category !== 'all') {
      where.category = category
    }

    const plantingGuides = await prisma.plantingGuide.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    plantingCalendar = plantingGuides.map((guide: { id: string; name: string; category: string; indoorStartWeeks: number | null; outdoorStartWeeks: number | null; transplantWeeks: number | null; harvestWeeks: number | null; minGerminationTemp: number | null; optGerminationTemp: number | null }) => {
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
        id: guide.id,
        name: guide.name,
        category: guide.category,
        ...dates,
        harvestDate,
        minGerminationTemp: guide.minGerminationTemp,
        optGerminationTemp: guide.optGerminationTemp,
        source: 'encyclopedia' as const,
      }
    })
  } else if (view === 'inventory' || view === 'inventory-wishlist') {
    // Get user's seeds from inventory
    const seeds = await prisma.seed.findMany({
      where: { 
        userId,
        isArchived: false,
      },
      include: { plantType: true },
    })

    // Build calendar from inventory seeds
    const inventoryCalendar: PlantingCalendarItem[] = seeds
      .filter((seed: { plantType: unknown }) => seed.plantType) // Only seeds with planting guide
      .map((seed: { id: string; variety: string | null; plantType: { id: string; name: string; category: string; indoorStartWeeks: number | null; outdoorStartWeeks: number | null; transplantWeeks: number | null; harvestWeeks: number | null; minGerminationTemp: number | null; optGerminationTemp: number | null } | null }) => {
        const guide = seed.plantType!
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
          id: `seed-${seed.id}`,
          name: guide.name,
          variety: seed.variety,
          category: guide.category,
          ...dates,
          harvestDate,
          minGerminationTemp: guide.minGerminationTemp,
          optGerminationTemp: guide.optGerminationTemp,
          source: 'inventory' as const,
        }
      })

    plantingCalendar = inventoryCalendar

    // Also get wishlist items if requested
    if (view === 'inventory-wishlist') {
      const wishlistItems = await prisma.wishlistItem.findMany({
        where: {
          userId,
          purchased: false,
        },
        include: { plantType: true },
      })

      const wishlistCalendar: PlantingCalendarItem[] = wishlistItems
        .filter((item: { plantType: unknown; indoorStartWeeks: number | null; outdoorStartWeeks: number | null }) => item.plantType || item.indoorStartWeeks || item.outdoorStartWeeks)
        .map((item: { id: string; customPlantName: string | null; variety: string | null; indoorStartWeeks: number | null; outdoorStartWeeks: number | null; plantType: { name: string; category: string; indoorStartWeeks: number | null; outdoorStartWeeks: number | null; transplantWeeks: number | null; harvestWeeks: number | null; minGerminationTemp: number | null; optGerminationTemp: number | null } | null }) => {
          const guide = item.plantType
          
          // Use plant encyclopedia data or custom dates from wishlist item
          const indoorStartWeeks = guide?.indoorStartWeeks ?? item.indoorStartWeeks
          const outdoorStartWeeks = guide?.outdoorStartWeeks ?? item.outdoorStartWeeks
          const transplantWeeks = guide?.transplantWeeks ?? null
          const harvestWeeks = guide?.harvestWeeks ?? null

          const dates = lastFrost ? calculatePlantingDates(
            lastFrost,
            indoorStartWeeks,
            outdoorStartWeeks,
            transplantWeeks
          ) : { indoorStart: null, outdoorStart: null, transplant: null }

          const harvestDate = dates.outdoorStart && harvestWeeks
            ? addWeeks(dates.outdoorStart, harvestWeeks)
            : null

          return {
            id: `wishlist-${item.id}`,
            name: guide?.name || item.customPlantName || 'Unknown',
            variety: item.variety,
            category: guide?.category || null,
            ...dates,
            harvestDate,
            minGerminationTemp: guide?.minGerminationTemp,
            optGerminationTemp: guide?.optGerminationTemp,
            source: 'wishlist' as const,
          }
        })

      plantingCalendar = [...inventoryCalendar, ...wishlistCalendar]
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      plantingCalendar = plantingCalendar.filter(item => item.category === category)
    }

    // Sort by name
    plantingCalendar.sort((a, b) => a.name.localeCompare(b.name))

    // Remove duplicates (same plant type)
    const seen = new Set<string>()
    plantingCalendar = plantingCalendar.filter(item => {
      const key = `${item.name}-${item.variety || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Helper to get month index from date
  const getMonthIndex = (date: Date | null) => date ? date.getMonth() : -1

  // Count items per view
  const inventoryCount = userId ? await prisma.seed.count({
    where: { userId, isArchived: false, plantTypeId: { not: null } },
  }) : 0
  
  const wishlistCount = userId ? await prisma.wishlistItem.count({
    where: { 
      userId, 
      purchased: false,
      OR: [
        { plantTypeId: { not: null } },
        { indoorStartWeeks: { not: null } },
        { outdoorStartWeeks: { not: null } },
      ],
    },
  }) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planting Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          When to plant based on your growing zone
        </p>
      </div>

      {/* Zone Info */}
      <div className="card bg-garden-100 dark:bg-garden-900/30 border-2 border-garden-300 dark:border-garden-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-garden-600" />
            <div>
              <h2 className="font-semibold text-garden-900 dark:text-garden-100">
                USDA Hardiness Zone {zone}
              </h2>
              <p className="text-sm text-garden-700 dark:text-garden-300">
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

      {/* View Filter */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">View Plants From:</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/calendar?view=all${category ? `&category=${category}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              view === 'all'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            All Plants
          </Link>
          <Link
            href={`/calendar?view=inventory${category ? `&category=${category}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              view === 'inventory'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Package className="w-4 h-4" />
            My Inventory ({inventoryCount})
          </Link>
          <Link
            href={`/calendar?view=inventory-wishlist${category ? `&category=${category}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              view === 'inventory-wishlist'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Star className="w-4 h-4" />
            Inventory + Wishlist ({inventoryCount + wishlistCount})
          </Link>
        </div>
        {(view === 'inventory' || view === 'inventory-wishlist') && plantingCalendar.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            <strong>No plants found.</strong> Make sure your {view === 'inventory-wishlist' ? 'seeds and wishlist items' : 'seeds'} are linked to plants in the encyclopedia to see them here. 
            <Link href="/seeds" className="underline ml-1">Manage your seeds →</Link>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by Category:</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/calendar?view=${view}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !category || category === 'all'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </Link>
          {seedCategories.map((cat) => (
            <Link
              key={cat.value}
              href={`/calendar?view=${view}&category=${cat.value}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-garden-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
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
          {(view === 'inventory' || view === 'inventory-wishlist') && (
            <>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-garden-600" />
                <span>From Inventory</span>
              </div>
              {view === 'inventory-wishlist' && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>From Wishlist</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {plantingCalendar.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                  Crop
                </th>
                {months.map((month, index) => {
                  const isLastFrostMonth = lastFrost && getMonthIndex(lastFrost) === index
                  const isFirstFrostMonth = firstFrost && getMonthIndex(firstFrost) === index
                  return (
                    <th 
                      key={month} 
                      className={`text-center py-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 ${
                        isLastFrostMonth ? 'bg-blue-50 dark:bg-blue-900/30' : isFirstFrostMonth ? 'bg-red-50 dark:bg-red-900/30' : ''
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
                  <tr key={crop.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 px-2 sticky left-0 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <span>{categoryInfo?.emoji || '🌱'}</span>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{crop.name}</span>
                          {crop.variety && (
                            <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({crop.variety})</span>
                          )}
                        </div>
                        {crop.source === 'inventory' && (
                          <span title="In your inventory"><Package className="w-3 h-3 text-garden-600 ml-1" /></span>
                        )}
                        {crop.source === 'wishlist' && (
                          <span title="On your wishlist"><Star className="w-3 h-3 text-amber-500 ml-1" /></span>
                        )}
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
                            isLastFrostMonth ? 'bg-blue-50 dark:bg-blue-900/30' : 
                            isFirstFrostMonth ? 'bg-red-50 dark:bg-red-900/30' : ''
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
      )}

      {/* Detailed Planting Guide */}
      {plantingCalendar.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Detailed Planting Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantingCalendar.map((crop) => {
              const categoryInfo = seedCategories.find(c => c.value === crop.category)
              return (
                <div key={crop.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{categoryInfo?.emoji || '🌱'}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h3>
                      {crop.variety && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{crop.variety}</p>
                      )}
                    </div>
                    {crop.source === 'inventory' && (
                      <span title="In your inventory"><Package className="w-4 h-4 text-garden-600" /></span>
                    )}
                    {crop.source === 'wishlist' && (
                      <span title="On your wishlist"><Star className="w-4 h-4 text-amber-500" /></span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {crop.indoorStart && (
                      <div className="flex justify-between">
                        <span className="text-purple-600 dark:text-purple-400">Start Indoors:</span>
                        <span className="font-medium">{format(crop.indoorStart, 'MMM d')}</span>
                      </div>
                    )}
                    {crop.outdoorStart && (
                      <div className="flex justify-between">
                        <span className="text-green-600 dark:text-green-400">Direct Sow:</span>
                        <span className="font-medium">{format(crop.outdoorStart, 'MMM d')}</span>
                      </div>
                    )}
                    {crop.transplant && (
                      <div className="flex justify-between">
                        <span className="text-green-600 dark:text-green-400">Transplant:</span>
                        <span className="font-medium">{format(crop.transplant, 'MMM d')}</span>
                      </div>
                    )}
                    {crop.harvestDate && (
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400">Harvest:</span>
                        <span className="font-medium">{format(crop.harvestDate, 'MMM d')}</span>
                      </div>
                    )}
                    {crop.minGerminationTemp && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
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
      )}
    </div>
  )
}
