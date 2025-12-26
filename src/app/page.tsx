import { prisma } from '@/lib/prisma'
import { getMoonPhase, getCurrentSeason, seasonalTips, formatDate, hardinessZones, parseFrostDate } from '@/lib/garden-utils'
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
  ArrowRight
} from 'lucide-react'

async function getDashboardData() {
  const [seeds, plantings, wishlistItems, settings] = await Promise.all([
    prisma.seed.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.planting.findMany({
      include: { seed: true },
      orderBy: { plantingDate: 'desc' },
      take: 5,
    }),
    prisma.wishlistItem.findMany({
      where: { purchased: false },
      orderBy: { priority: 'asc' },
      take: 5,
    }),
    prisma.userSettings.findFirst(),
  ])

  const seedCount = await prisma.seed.count()
  const activePlantings = await prisma.planting.count({
    where: {
      status: { in: ['planted', 'germinated', 'growing'] }
    }
  })
  const wishlistCount = await prisma.wishlistItem.count({
    where: { purchased: false }
  })

  return {
    seeds,
    plantings,
    wishlistItems,
    settings,
    stats: {
      seedCount,
      activePlantings,
      wishlistCount,
    }
  }
}

export default async function Dashboard() {
  const { seeds, plantings, wishlistItems, settings, stats } = await getDashboardData()
  
  const today = new Date()
  const moonPhase = getMoonPhase(today)
  const currentSeason = getCurrentSeason(today)
  const tips = seasonalTips[currentSeason]
  
  // Get frost dates from zone
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  const lastFrost = zoneInfo ? parseFrostDate(zoneInfo.lastFrostSpring, today.getFullYear()) : null
  const firstFrost = zoneInfo ? parseFrostDate(zoneInfo.firstFrostFall, today.getFullYear()) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Garden Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening in your garden.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/seeds" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Seed Varieties</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.seedCount}</p>
            </div>
            <div className="w-12 h-12 bg-garden-100 rounded-lg flex items-center justify-center group-hover:bg-garden-200 transition-colors">
              <Package className="w-6 h-6 text-garden-600" />
            </div>
          </div>
        </Link>

        <Link href="/plantings" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Plantings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activePlantings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link href="/wishlist" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Wishlist Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.wishlistCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <Star className="w-6 h-6 text-yellow-600" />
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
              <h2 className="text-lg font-semibold text-gray-900">Recent Seeds</h2>
              <Link href="/seeds" className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {seeds.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No seeds yet. <Link href="/seeds/new" className="text-garden-600 hover:underline">Add your first seed!</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {seeds.map((seed) => (
                  <Link
                    key={seed.id}
                    href={`/seeds/${seed.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{seed.name}</p>
                      <p className="text-sm text-gray-500">
                        {seed.variety && `${seed.variety} • `}
                        {seed.quantity} {seed.quantityUnit}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {seed.category || 'Uncategorized'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Plantings */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Plantings</h2>
              <Link href="/plantings" className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {plantings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No plantings yet. <Link href="/plantings/new" className="text-garden-600 hover:underline">Log your first planting!</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {plantings.map((planting) => (
                  <div
                    key={planting.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{planting.seed.name}</p>
                      <p className="text-sm text-gray-500">
                        {planting.location} • {formatDate(planting.plantingDate)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize
                      ${planting.status === 'planted' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${planting.status === 'germinated' ? 'bg-green-100 text-green-800' : ''}
                      ${planting.status === 'growing' ? 'bg-emerald-100 text-emerald-800' : ''}
                      ${planting.status === 'harvested' ? 'bg-blue-100 text-blue-800' : ''}
                      ${planting.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {planting.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Moon Phase */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Moon Phase
            </h2>
            <div className="text-center">
              <span className="text-6xl">{moonPhase.emoji}</span>
              <p className="font-medium text-gray-900 mt-2">{moonPhase.phase}</p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round(moonPhase.illumination)}% illuminated
              </p>
              <div className="mt-4 p-3 bg-garden-50 rounded-lg">
                <p className="text-sm text-garden-800">
                  <strong>Planting tip:</strong> {moonPhase.plantingAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* Growing Zone */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Growing Zone
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">USDA Zone</span>
                <span className="font-semibold text-garden-700">{zone}</span>
              </div>
              {zoneInfo && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Spring Frost</span>
                    <span className="font-medium">{zoneInfo.lastFrostSpring}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">First Fall Frost</span>
                    <span className="font-medium">{zoneInfo.firstFrostFall}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min Temp</span>
                    <span className="font-medium">{zoneInfo.minTemp}°F to {zoneInfo.maxTemp}°F</span>
                  </div>
                </>
              )}
              <Link
                href="/settings"
                className="block text-center text-sm text-garden-600 hover:text-garden-700 mt-2"
              >
                Update your zone →
              </Link>
            </div>
          </div>

          {/* Seasonal Tips */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5" />
              {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Tips
            </h2>
            <ul className="space-y-2">
              {tips.slice(0, 4).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-garden-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            <Link
              href="/almanac"
              className="block text-center text-sm text-garden-600 hover:text-garden-700 mt-4"
            >
              View full almanac →
            </Link>
          </div>

          {/* Wishlist Preview */}
          {wishlistItems.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Wishlist
                </h2>
                <Link href="/wishlist" className="text-sm text-garden-600 hover:text-garden-700">
                  View all →
                </Link>
              </div>
              <ul className="space-y-2">
                {wishlistItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
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
