import { prisma } from '@/lib/prisma'
import { getCurrentSeason, seasonalTips, formatDate, hardinessZones, getEffectiveLastFrostDate, getEffectiveFirstFrostDate } from '@/lib/garden-utils'
import { getMoonPhaseCalculated } from '@/lib/moon'
import { computePlantingReminders, type ReminderPlantInput } from '@/lib/planting-reminders'
import Link from 'next/link'
import { 
  Package, 
  MapPin, 
  Star, 
  CalendarDays, 
  Moon,
  Sun,
  Droplets,
  Thermometer,
  Sprout,
  ArrowRight
} from 'lucide-react'
import { startOfDay } from 'date-fns'

import { getAuthSession } from '@/lib/auth'

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  const [seeds, plantings, wishlistItems, settings, inStockSeeds, wishlistForReminders] = await Promise.all([
    prisma.seed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { plantType: { omit: { sourceData: true } } },
    }),
    prisma.planting.findMany({
      where: { userId },
      include: { 
        seed: { include: { plantType: { omit: { sourceData: true } } } },
        plantingEvents: { orderBy: { date: 'desc' }, take: 1 },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.wishlistItem.findMany({
      where: { userId, purchased: false },
      orderBy: { priority: 'asc' },
      take: 5,
    }),
    prisma.userSettings.findFirst({ where: { userId } }),
    // Full in-stock inventory (not just the 5 most recent above) for the
    // "Plant This Week" card - same "in stock" definition the reminder
    // emails use.
    prisma.seed.findMany({
      where: { userId, isArchived: false, quantity: { gt: 0 } },
      include: { plantType: true },
    }),
    prisma.wishlistItem.findMany({
      where: { userId, purchased: false },
      include: { plantType: true },
    }),
  ])

  const seedCount = await prisma.seed.count({ where: { userId } })
  const activePlantings = await prisma.planting.count({
    where: {
      userId,
      status: { in: ['planted', 'germinated', 'growing'] }
    }
  })
  const wishlistCount = await prisma.wishlistItem.count({
    where: { userId, purchased: false }
  })

  return {
    seeds,
    plantings,
    wishlistItems,
    settings,
    inStockSeeds,
    wishlistForReminders,
    stats: {
      seedCount,
      activePlantings,
      wishlistCount,
    }
  }
}

export default async function Dashboard() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return <div>Please sign in to view your dashboard.</div>
  }
  const { seeds, plantings, wishlistItems, settings, inStockSeeds, wishlistForReminders, stats } = await getDashboardData(session.user.id)
  
  const today = new Date()
  // Shared with the Almanac page's fallback calculation, instead of a
  // separate (and previously slightly different) copy of the same math.
  const moonPhase = getMoonPhaseCalculated(today)
  const currentSeason = getCurrentSeason(today)
  const tips = seasonalTips[currentSeason]
  
  // Get frost dates - a custom date the user set in Settings takes priority
  // over the zone average, same resolution the reminder emails use.
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  const lastFrost = getEffectiveLastFrostDate(settings, today.getFullYear())
  const firstFrost = getEffectiveFirstFrostDate(settings, today.getFullYear())

  // "Plant This Week" - the same reminder computation the daily email cron
  // uses, shown right in the app instead of only by email.
  const reminderPlants: ReminderPlantInput[] = [
    ...inStockSeeds.map((seed): ReminderPlantInput => ({
      key: `seed:${seed.id}`,
      plantName: seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown Plant',
      variety: seed.variety,
      category: seed.plantType?.category || seed.customCategory,
      source: 'seed',
      indoorStartWeeks: seed.plantType?.indoorStartWeeks ?? null,
      outdoorStartWeeks: seed.plantType?.outdoorStartWeeks ?? null,
      transplantWeeks: seed.plantType?.transplantWeeks ?? null,
      daysToMaturity: seed.plantType?.daysToMaturity ?? seed.daysToMaturity ?? null,
      overrideIndoorStart: seed.enableIndoorStartReminder,
      overrideDirectSow: seed.enableDirectSowReminder,
      overrideTransplant: seed.enableTransplantReminder,
    })),
    ...(settings?.enableWishlistReminders ? wishlistForReminders.map((item): ReminderPlantInput => ({
      key: `wishlist:${item.id}`,
      plantName: item.plantType?.name || item.customPlantName || 'Unknown Plant',
      variety: item.variety,
      category: item.plantType?.category ?? null,
      source: 'wishlist',
      indoorStartWeeks: item.plantType?.indoorStartWeeks ?? item.indoorStartWeeks ?? null,
      outdoorStartWeeks: item.plantType?.outdoorStartWeeks ?? item.outdoorStartWeeks ?? null,
      transplantWeeks: item.plantType?.transplantWeeks ?? null,
      daysToMaturity: item.plantType?.daysToMaturity ?? null,
    })) : []),
  ]
  const upcomingPlantings = computePlantingReminders({
    plants: reminderPlants,
    today: startOfDay(today),
    reminderLeadDays: 14,
    lastFrostDate: lastFrost,
    firstFrostDate: firstFrost,
    globalReminders: {
      // Always show what's due this dashboard card regardless of whether
      // email reminders are turned on - those two are independent controls.
      indoorStart: true,
      directSow: true,
      transplant: true,
      fallDirectSow: true,
    },
  }).sort((a, b) => a.plantingDate.getTime() - b.plantingDate.getTime())

  const reminderTypeLabels: Record<string, string> = {
    indoor_start: 'Start indoors',
    direct_sow: 'Direct sow',
    transplant: 'Transplant',
    fall_direct_sow: 'Fall direct sow',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Garden Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Welcome back! Here&apos;s what&apos;s happening in your garden.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/seeds" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Seed Varieties</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.seedCount}</p>
            </div>
            <div className="w-12 h-12 bg-garden-100 dark:bg-garden-900 rounded-lg flex items-center justify-center group-hover:bg-garden-200 dark:group-hover:bg-garden-800 transition-colors">
              <Package className="w-6 h-6 text-garden-600 dark:text-garden-400" />
            </div>
          </div>
        </Link>

        <Link href="/plantings" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Plantings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.activePlantings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Link>

        <Link href="/wishlist" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wishlist Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.wishlistCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Seeds */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Seeds</h2>
              <Link href="/seeds" className="text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {seeds.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No seeds yet. <Link href="/seeds/new" className="text-garden-600 dark:text-garden-400 hover:underline">Add your first seed!</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {seeds.map((seed) => (
                  <Link
                    key={seed.id}
                    href={`/seeds/${seed.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {seed.variety && `${seed.variety} • `}
                        {seed.quantity} {seed.quantityUnit}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {seed.plantType?.category || seed.customCategory || 'Uncategorized'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Plantings */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Plantings</h2>
              <Link href="/plantings" className="text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {plantings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No plantings yet. <Link href="/plantings/new" className="text-garden-600 dark:text-garden-400 hover:underline">Log your first planting!</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {plantings.map((planting) => {
                  const seedName = planting.seed.plantType?.name || planting.seed.customPlantName || planting.seed.nickname || 'Unknown'
                  const lastEvent = planting.plantingEvents[0]
                  const plantingDate = lastEvent?.date
                  return (
                  <div
                    key={planting.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{seedName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {planting.location?.name || planting.locationName} • {plantingDate ? formatDate(plantingDate) : 'No date'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize
                      ${planting.status === 'planted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                      ${planting.status === 'germinated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${planting.status === 'growing' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : ''}
                      ${planting.status === 'harvested' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${planting.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                    `}>
                      {planting.status}
                    </span>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Plant This Week */}
          {upcomingPlantings.length > 0 && (
            <div className="card border-l-4 border-garden-500">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-garden-600 dark:text-garden-400" />
                Plant This Week
              </h2>
              <ul className="space-y-3">
                {upcomingPlantings.slice(0, 6).map((reminder, index) => (
                  <li key={`${reminder.plantKey}-${reminder.type}-${index}`} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {reminder.plantName}{reminder.variety ? ` (${reminder.variety})` : ''}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {reminderTypeLabels[reminder.type]} · {formatDate(reminder.plantingDate)}
                        {reminder.source === 'wishlist' ? ' · wishlist' : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/calendar"
                className="block text-center text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 mt-4"
              >
                View full calendar →
              </Link>
            </div>
          )}

          {/* Moon Phase */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Moon Phase
            </h2>
            <div className="text-center">
              <span className="text-6xl">{moonPhase.emoji}</span>
              <p className="font-medium text-gray-900 dark:text-white mt-2">{moonPhase.phase}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(moonPhase.illumination)}% illuminated
              </p>
              <div className="mt-4 p-3 bg-garden-50 dark:bg-garden-900/50 rounded-lg">
                <p className="text-sm text-garden-800 dark:text-garden-200">
                  <strong>Planting tip:</strong> {moonPhase.plantingAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* Growing Zone */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Growing Zone
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">USDA Zone</span>
                <span className="font-semibold text-garden-700 dark:text-garden-400">{zone}</span>
              </div>
              {zoneInfo && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Last Spring Frost</span>
                    <span className="font-medium text-gray-900 dark:text-white">{zoneInfo.lastFrostSpring}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">First Fall Frost</span>
                    <span className="font-medium text-gray-900 dark:text-white">{zoneInfo.firstFrostFall}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Min Temp</span>
                    <span className="font-medium text-gray-900 dark:text-white">{zoneInfo.minTemp}°F to {zoneInfo.maxTemp}°F</span>
                  </div>
                </>
              )}
              <Link
                href="/settings"
                className="block text-center text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 mt-2"
              >
                Update your zone →
              </Link>
            </div>
          </div>

          {/* Seasonal Tips */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5" />
              {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Tips
            </h2>
            <ul className="space-y-2">
              {tips.slice(0, 4).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-garden-500 dark:text-garden-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            <Link
              href="/almanac"
              className="block text-center text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 mt-4"
            >
              View full almanac →
            </Link>
          </div>

          {/* Wishlist Preview */}
          {wishlistItems.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Wishlist
                </h2>
                <Link href="/wishlist" className="text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300">
                  View all →
                </Link>
              </div>
              <ul className="space-y-2">
                {wishlistItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.customPlantName || 'Unknown'}</span>
                    <span className="text-yellow-500">
                      {'★'.repeat(6 - item.priority)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
