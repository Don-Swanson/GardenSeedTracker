import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { 
  getCurrentSeason, 
  seasonalTips, 
  hardinessZones, 
  parseFrostDate,
  seedCategories 
} from '@/lib/garden-utils'
import { getMoonPhaseCalculated, type MoonPhaseData, getUpcomingMoonEvents } from '@/lib/moon'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns'
import { Moon, Sun, Droplets, Thermometer, Wind, Leaf, Bug, Calendar, BookOpen, ArrowRight, RefreshCw, Sunrise, Sunset, CloudSun, Star } from 'lucide-react'
import Link from 'next/link'

// Extended astronomy data from API
interface AstronomyData {
  moonPhase: MoonPhaseData
  sunrise: string
  sunset: string
  dayLength: string
  moonrise: string
  moonset: string
  solarNoon: string
  goldenHourMorning: { begin: string; end: string }
  goldenHourEvening: { begin: string; end: string }
}

// Full moon names by month
const fullMoonNames: Record<number, { name: string; meaning: string }> = {
  0: { name: 'Wolf Moon', meaning: 'Named for howling wolves in midwinter' },
  1: { name: 'Snow Moon', meaning: 'Heaviest snowfalls typically occur in February' },
  2: { name: 'Worm Moon', meaning: 'Earthworms emerge as ground thaws' },
  3: { name: 'Pink Moon', meaning: 'Named for pink phlox flowers blooming' },
  4: { name: 'Flower Moon', meaning: 'Flowers bloom abundantly in May' },
  5: { name: 'Strawberry Moon', meaning: 'Strawberry harvesting season begins' },
  6: { name: 'Buck Moon', meaning: 'Male deer grow new antlers' },
  7: { name: 'Sturgeon Moon', meaning: 'Sturgeon fishing season in Great Lakes' },
  8: { name: 'Harvest Moon', meaning: 'Closest full moon to autumn equinox' },
  9: { name: 'Hunter\'s Moon', meaning: 'Ideal time for hunting before winter' },
  10: { name: 'Beaver Moon', meaning: 'Time to set beaver traps before winter' },
  11: { name: 'Cold Moon', meaning: 'Winter cold arrives in earnest' },
}

// Default location: Niceville, FL
const DEFAULT_LOCATION = {
  latitude: 30.5169,
  longitude: -86.4822,
}

// Server-side function to fetch comprehensive astronomy data
async function getAstronomyData(date: Date, lat?: number, lon?: number): Promise<AstronomyData> {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const IPGEO_API_KEY = process.env.IPGEO_API_KEY
  
  // Default location (Niceville, FL) - can be customized based on user settings
  const latitude = lat || DEFAULT_LOCATION.latitude
  const longitude = lon || DEFAULT_LOCATION.longitude
  
  const defaultData: AstronomyData = {
    moonPhase: getMoonPhaseCalculated(date),
    sunrise: '--:--',
    sunset: '--:--',
    dayLength: '--:--',
    moonrise: '--:--',
    moonset: '--:--',
    solarNoon: '--:--',
    goldenHourMorning: { begin: '--:--', end: '--:--' },
    goldenHourEvening: { begin: '--:--', end: '--:--' },
  }
  
  if (!IPGEO_API_KEY) {
    return defaultData
  }
  
  try {
    const response = await fetch(
      `https://api.ipgeolocation.io/v2/astronomy?apiKey=${IPGEO_API_KEY}&lat=${latitude}&long=${longitude}&date=${dateStr}`,
      { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000)
      }
    )
    
    if (!response.ok) {
      return defaultData
    }
    
    const data = await response.json()
    const astronomy = data.astronomy || data
    
    // Parse moon illumination
    const rawIllumination = astronomy.moon_illumination_percentage
    const illumination = typeof rawIllumination === 'string' 
      ? Math.round(Math.abs(parseFloat(rawIllumination)))
      : typeof rawIllumination === 'number'
        ? Math.round(Math.abs(rawIllumination))
        : 0
    
    const rawPhase = astronomy.moon_phase || 'Unknown'
    const phase = formatPhaseName(rawPhase)
    const emoji = getPhaseEmoji(phase, illumination)
    const gardeningInfo = getGardeningInfo(phase)
    
    return {
      moonPhase: {
        phase,
        illumination,
        emoji,
        ...gardeningInfo
      },
      sunrise: astronomy.sunrise || '--:--',
      sunset: astronomy.sunset || '--:--',
      dayLength: astronomy.day_length || '--:--',
      moonrise: astronomy.moonrise === '-:-' ? 'No moonrise' : (astronomy.moonrise || '--:--'),
      moonset: astronomy.moonset === '-:-' ? 'No moonset' : (astronomy.moonset || '--:--'),
      solarNoon: astronomy.solar_noon || '--:--',
      goldenHourMorning: {
        begin: astronomy.morning?.golden_hour_begin || '--:--',
        end: astronomy.morning?.golden_hour_end || '--:--'
      },
      goldenHourEvening: {
        begin: astronomy.evening?.golden_hour_begin || '--:--',
        end: astronomy.evening?.golden_hour_end || '--:--'
      },
    }
  } catch (error) {
    console.error('Astronomy API error:', error)
    return defaultData
  }
}

// Format phase name from API format (WAXING_GIBBOUS) to display format (Waxing Gibbous)
function formatPhaseName(phase: string): string {
  return phase
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getPhaseEmoji(phase: string, illumination: number): string {
  const phaseLower = phase.toLowerCase()
  if (phaseLower.includes('new')) return '🌑'
  if (phaseLower.includes('waxing') && phaseLower.includes('crescent')) return '🌒'
  if (phaseLower.includes('first quarter')) return '🌓'
  if (phaseLower.includes('waxing') && phaseLower.includes('gibbous')) return '🌔'
  if (phaseLower.includes('full')) return '🌕'
  if (phaseLower.includes('waning') && phaseLower.includes('gibbous')) return '🌖'
  if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) return '🌗'
  if (phaseLower.includes('waning') && phaseLower.includes('crescent')) return '🌘'
  
  // Fallback based on illumination
  if (illumination < 5) return '🌑'
  if (illumination >= 95) return '🌕'
  return '🌙'
}

function getGardeningInfo(phase: string): {
  plantingAdvice: string
  daysUntilFull: number
  daysUntilNew: number
  isGoodForPlanting: boolean
  isGoodForHarvesting: boolean
  isGoodForPruning: boolean
} {
  const phaseLower = phase.toLowerCase()
  
  if (phaseLower.includes('new') || (phaseLower.includes('waxing') && phaseLower.includes('crescent'))) {
    return {
      plantingAdvice: 'Best for planting leafy crops (lettuce, spinach, cabbage)',
      daysUntilFull: 15,
      daysUntilNew: 0,
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (phaseLower.includes('first quarter') || (phaseLower.includes('waxing') && phaseLower.includes('gibbous'))) {
    return {
      plantingAdvice: 'Ideal for fruiting annuals (tomatoes, peppers, squash, beans)',
      daysUntilFull: 7,
      daysUntilNew: 22,
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (phaseLower.includes('full') || (phaseLower.includes('waning') && phaseLower.includes('gibbous'))) {
    return {
      plantingAdvice: 'Best for planting root crops, bulbs, and perennials. Good for harvesting.',
      daysUntilFull: 0,
      daysUntilNew: 15,
      isGoodForPlanting: true,
      isGoodForHarvesting: true,
      isGoodForPruning: false
    }
  } else {
    return {
      plantingAdvice: 'Rest period. Best for pruning, weeding, pest control, and turning compost.',
      daysUntilFull: 22,
      daysUntilNew: 7,
      isGoodForPlanting: false,
      isGoodForHarvesting: true,
      isGoodForPruning: true
    }
  }
}

export const dynamic = 'force-dynamic'

// Companion planting chart
const companionChart = [
  { crop: 'Tomatoes', goodCompanions: 'Basil, Carrots, Celery, Parsley, Marigolds', badCompanions: 'Brassicas, Fennel, Corn' },
  { crop: 'Peppers', goodCompanions: 'Tomatoes, Basil, Carrots, Onions, Spinach', badCompanions: 'Fennel, Kohlrabi' },
  { crop: 'Cucumbers', goodCompanions: 'Beans, Peas, Radishes, Sunflowers, Corn', badCompanions: 'Potatoes, Aromatic Herbs' },
  { crop: 'Beans', goodCompanions: 'Corn, Squash, Carrots, Cucumbers, Cabbage', badCompanions: 'Onions, Garlic, Fennel' },
  { crop: 'Carrots', goodCompanions: 'Lettuce, Onions, Tomatoes, Rosemary, Sage', badCompanions: 'Dill, Parsnips' },
  { crop: 'Lettuce', goodCompanions: 'Carrots, Radishes, Strawberries, Chives', badCompanions: 'Celery' },
  { crop: 'Squash', goodCompanions: 'Corn, Beans, Nasturtiums, Marigolds', badCompanions: 'Potatoes' },
  { crop: 'Brassicas', goodCompanions: 'Beets, Celery, Onions, Potatoes, Dill', badCompanions: 'Tomatoes, Peppers, Strawberries' },
]

// Pest control tips
const pestControlTips = [
  {
    pest: 'Aphids',
    description: 'Small soft-bodied insects that cluster on new growth',
    organicControl: 'Spray with water, introduce ladybugs, use neem oil spray',
    prevention: 'Encourage beneficial insects, avoid over-fertilizing with nitrogen',
  },
  {
    pest: 'Tomato Hornworms',
    description: 'Large green caterpillars that devour tomato foliage',
    organicControl: 'Hand pick, introduce parasitic wasps, use BT spray',
    prevention: 'Rotate crops, till soil in fall to destroy pupae',
  },
  {
    pest: 'Squash Vine Borers',
    description: 'Moths whose larvae tunnel into squash stems',
    organicControl: 'Inject BT into stems, surgical removal of larvae',
    prevention: 'Use row covers until flowering, plant resistant varieties',
  },
  {
    pest: 'Cabbage Worms',
    description: 'Green caterpillars that eat holes in brassica leaves',
    organicControl: 'Hand pick, use BT spray, introduce parasitic wasps',
    prevention: 'Use row covers, plant with aromatic herbs',
  },
  {
    pest: 'Slugs & Snails',
    description: 'Slimy mollusks that eat seedlings and leaves',
    organicControl: 'Beer traps, diatomaceous earth, copper barriers',
    prevention: 'Remove hiding spots, water in morning, use drip irrigation',
  },
  {
    pest: 'Japanese Beetles',
    description: 'Metallic green beetles that skeletonize leaves',
    organicControl: 'Hand pick into soapy water, use milky spore for grubs',
    prevention: 'Apply beneficial nematodes to lawn, avoid traps near garden',
  },
]

export default async function AlmanacPage() {
  const session = await getAuthSession()
  
  const userId = session?.user?.id
  
  // Get user-specific settings if logged in
  const settings = userId ? await prisma.userSettings.findFirst({ where: { userId } }) : null
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  
  const today = new Date()
  const currentSeason = getCurrentSeason(today)
  
  // Get comprehensive astronomy data (includes moon phase, sunrise/sunset, etc.)
  const lat = settings?.latitude ? parseFloat(settings.latitude.toString()) : undefined
  const lon = settings?.longitude ? parseFloat(settings.longitude.toString()) : undefined
  const astronomyData = await getAstronomyData(today, lat, lon)
  const moonPhase = astronomyData.moonPhase
  
  // Calculate days until spring/next season
  const springDate = new Date(today.getFullYear(), 2, 20) // March 20
  const summerDate = new Date(today.getFullYear(), 5, 21)
  const fallDate = new Date(today.getFullYear(), 8, 22)
  const winterDate = new Date(today.getFullYear(), 11, 21)
  
  let daysUntilNextSeason = 0
  let nextSeasonName = ''
  if (currentSeason === 'winter') {
    const targetSpring = today > springDate ? new Date(today.getFullYear() + 1, 2, 20) : springDate
    daysUntilNextSeason = differenceInDays(targetSpring, today)
    nextSeasonName = 'spring'
  } else if (currentSeason === 'spring') {
    daysUntilNextSeason = differenceInDays(summerDate, today)
    nextSeasonName = 'summer'
  } else if (currentSeason === 'summer') {
    daysUntilNextSeason = differenceInDays(fallDate, today)
    nextSeasonName = 'fall'
  } else {
    daysUntilNextSeason = differenceInDays(winterDate, today)
    nextSeasonName = 'winter'
  }
  
  // Get day of year
  const startOfYearDate = new Date(today.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((today.getTime() - startOfYearDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Get upcoming moon events
  const upcomingMoonEvents = getUpcomingMoonEvents(today, 4)
  
  // Get next full moon info
  const nextFullMoon = upcomingMoonEvents.find(e => e.phase === 'Full Moon')
  const nextFullMoonMonth = nextFullMoon ? nextFullMoon.date.getMonth() : today.getMonth()
  const fullMoonInfo = fullMoonNames[nextFullMoonMonth]
  
  // Generate moon calendar for current month
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Use calculated moon phases for calendar (to avoid API rate limits)
  const moonCalendar = daysInMonth.map(day => ({
    date: day,
    ...getMoonPhaseCalculated(day),
  }))

  // Get planting guides for companion planting info
  type PlantGuide = {
    id: string
    name: string
    category: string
    hardinessZones: string | null
    optimalZones: string | null
    indoorStartWeeks: number | null
    outdoorStartWeeks: number | null
    transplantWeeks: number | null
    daysToMaturity: number | null
    description: string | null
  }
  
  const plantingGuides: PlantGuide[] = await prisma.plantingGuide.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      category: true,
      hardinessZones: true,
      optimalZones: true,
      indoorStartWeeks: true,
      outdoorStartWeeks: true,
      transplantWeeks: true,
      daysToMaturity: true,
      description: true,
    },
  })

  // Filter plants recommended for user's zone
  const recommendedPlants = plantingGuides.filter((plant: PlantGuide) => {
    if (!plant.hardinessZones) return false
    try {
      const zones = JSON.parse(plant.hardinessZones)
      // Check if user's zone (without the letter) is in the list
      const zoneNumber = zone.replace(/[ab]/g, '')
      return zones.some((z: string) => z.startsWith(zoneNumber) || z === zone)
    } catch {
      return false
    }
  })

  // Get optimal plants (best performing in user's zone)
  const optimalPlants = plantingGuides.filter((plant: PlantGuide) => {
    if (!plant.optimalZones) return false
    try {
      const zones = JSON.parse(plant.optimalZones)
      const zoneNumber = zone.replace(/[ab]/g, '')
      return zones.some((z: string) => z.startsWith(zoneNumber) || z === zone)
    } catch {
      return false
    }
  })

  // Get season-appropriate plants based on current timing
  const currentMonth = today.getMonth()
  const lastFrostDate = settings?.lastFrostDate 
    ? new Date(settings.lastFrostDate) 
    : (zoneInfo ? parseFrostDate(zoneInfo.lastFrostSpring, today.getFullYear()) : null)
  
  const seasonalPlants = recommendedPlants.filter((plant: PlantGuide) => {
    // Determine if plant should be started now based on season
    if (currentSeason === 'winter' || currentSeason === 'spring') {
      // Show plants that can be started indoors in late winter/early spring
      return plant.indoorStartWeeks && plant.indoorStartWeeks > 0
    } else if (currentSeason === 'summer') {
      // Show plants that can be direct sowed or transplanted
      return (plant.outdoorStartWeeks !== null && plant.outdoorStartWeeks !== undefined) || 
             (plant.transplantWeeks !== null && plant.transplantWeeks !== undefined)
    } else {
      // Fall - show cool weather crops or perennials for next year
      return plant.category === 'Vegetable' || plant.category === 'Herb'
    }
  }).slice(0, 12) // Limit to 12 plants

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Garden Almanac</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Your guide to successful gardening with moon phases, companion planting, and seasonal tips
        </p>
      </div>

      {/* Plant Encyclopedia Promo */}
      <Link 
        href="/plants"
        className="block card bg-gradient-to-r from-garden-100 to-emerald-100 dark:from-garden-900/30 dark:to-emerald-900/30 border-2 border-garden-300 dark:border-garden-700 hover:shadow-lg transition-shadow group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-garden-100 dark:bg-garden-800 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-garden-600 dark:text-garden-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-garden-900 dark:text-garden-100 group-hover:text-garden-700 dark:group-hover:text-garden-300">
                Plant Encyclopedia
              </h2>
              <p className="text-sm text-garden-700 dark:text-garden-300">
                Explore detailed guides with growing tips, recipes, medicinal uses, and more for 50+ plants
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-garden-600 dark:text-garden-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Today's Date Banner */}
      <div className="card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wide font-medium">Today is</p>
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{format(today, 'EEEE, MMMM d, yyyy')}</h2>
            <p className="text-amber-700 dark:text-amber-300 mt-1">Day {dayOfYear} of {today.getFullYear()}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-800 dark:text-amber-200">{daysUntilNextSeason}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">days until {nextSeasonName}</p>
          </div>
        </div>
      </div>

      {/* Today's Overview - Extended */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Moon Phase */}
        <div className="card text-center">
          <Moon className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Today&apos;s Moon</h2>
          <div className="mt-4">
            <span className="text-5xl">{moonPhase.emoji}</span>
            <p className="font-medium text-gray-900 dark:text-white mt-2">{moonPhase.phase}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{moonPhase.illumination}% illuminated</p>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-sm text-indigo-800 dark:text-indigo-200">
            {moonPhase.plantingAdvice}
          </div>
        </div>

        {/* Sun Times */}
        <div className="card text-center">
          <Sun className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Sun &amp; Daylight</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Sunrise</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{astronomyData.sunrise}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Sunset className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Sunset</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{astronomyData.sunset}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Day Length</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{astronomyData.dayLength}</span>
            </div>
            <div className="pt-2 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Golden Hour</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                🌅 {astronomyData.goldenHourMorning.begin} - {astronomyData.goldenHourMorning.end}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                🌇 {astronomyData.goldenHourEvening.begin} - {astronomyData.goldenHourEvening.end}
              </p>
            </div>
          </div>
        </div>

        {/* Moon Rise/Set */}
        <div className="card text-center">
          <Star className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Moon Times</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">🌙 Moonrise</span>
              <span className="font-medium text-gray-900 dark:text-white">{astronomyData.moonrise}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">🌑 Moonset</span>
              <span className="font-medium text-gray-900 dark:text-white">{astronomyData.moonset}</span>
            </div>
          </div>
          {nextFullMoon && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <p className="text-xs text-purple-600 dark:text-purple-300 uppercase font-medium">Next Full Moon</p>
              <p className="font-semibold text-purple-900 dark:text-purple-100">{fullMoonInfo.name}</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">{format(nextFullMoon.date, 'MMM d, yyyy')}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">{fullMoonInfo.meaning}</p>
            </div>
          )}
        </div>

        {/* Zone Info */}
        <div className="card text-center">
          <Thermometer className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Growing Zone {zone}</h2>
          {zoneInfo && (
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Spring Frost</p>
                <p className="font-medium text-gray-900 dark:text-white">{zoneInfo.lastFrostSpring}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">First Fall Frost</p>
                <p className="font-medium text-gray-900 dark:text-white">{zoneInfo.firstFrostFall}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Min Winter Temp</p>
                <p className="font-medium text-gray-900 dark:text-white">{zoneInfo.minTemp}°F to {zoneInfo.maxTemp}°F</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Moon Events */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Upcoming Moon Events
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {upcomingMoonEvents.map((event, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-3xl">{event.emoji}</span>
              <p className="font-semibold text-gray-900 dark:text-white mt-2">{event.phase}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{format(event.date, 'MMM d')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {differenceInDays(event.date, today) === 0 ? 'Today' : 
                 differenceInDays(event.date, today) === 1 ? 'Tomorrow' :
                 `in ${differenceInDays(event.date, today)} days`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Moon Calendar */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Moon className="w-6 h-6" />
          Moon Calendar - {format(today, 'MMMM yyyy')}
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
          {/* Empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {moonCalendar.map((day) => {
            const isToday = format(day.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            return (
              <div 
                key={day.date.toISOString()}
                className={`text-center p-2 rounded-lg ${isToday ? 'bg-garden-100 dark:bg-garden-900/50 ring-2 ring-garden-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">{format(day.date, 'd')}</p>
                <p className="text-xl">{day.emoji}</p>
              </div>
            )
          })}
        </div>
        
        {/* Moon Phase Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-xl">🌑</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">New Moon</p>
              <p className="text-gray-500 dark:text-gray-400">Plant leafy crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌓</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">First Quarter</p>
              <p className="text-gray-500 dark:text-gray-400">Plant fruiting crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌕</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Full Moon</p>
              <p className="text-gray-500 dark:text-gray-400">Plant root crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌗</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Last Quarter</p>
              <p className="text-gray-500 dark:text-gray-400">Rest, weed, harvest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Tips */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Garden Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasonalTips[currentSeason].map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-6 h-6 bg-garden-100 dark:bg-garden-900 text-garden-700 dark:text-garden-300 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-700 dark:text-gray-300">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Companion Planting Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Companion Planting Guide
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Growing certain plants together can improve growth, deter pests, and increase yields.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Crop</th>
                <th className="text-left py-3 px-4 font-semibold text-green-700 dark:text-green-400">Good Companions ✓</th>
                <th className="text-left py-3 px-4 font-semibold text-red-700 dark:text-red-400">Avoid ✗</th>
              </tr>
            </thead>
            <tbody>
              {companionChart.map((row, index) => (
                <tr key={row.crop} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.crop}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{row.goodCompanions}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{row.badCompanions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Plants for Your Zone */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-6 h-6 text-garden-600" />
            Recommended Plants for Zone {zone}
          </h2>
          <Link href="/plants" className="text-garden-600 hover:text-garden-700 dark:text-garden-400 dark:hover:text-garden-300 text-sm font-medium flex items-center gap-1">
            View All Plants <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          These plants thrive in your hardiness zone and are perfect for {currentSeason} gardening.
        </p>
        
        {optimalPlants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-garden-700 dark:text-garden-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Best Performers in Zone {zone}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {optimalPlants.slice(0, 6).map((plant) => (
                <Link
                  key={plant.id}
                  href={`/plants/${plant.id}`}
                  className="p-3 bg-gradient-to-br from-garden-50 to-emerald-50 dark:from-garden-900/30 dark:to-emerald-900/30 border border-garden-200 dark:border-garden-700 rounded-lg hover:shadow-md transition-shadow text-center group"
                >
                  <span className="text-2xl block mb-1">
                    {seedCategories.find(c => c.value === plant.category)?.emoji || '🌱'}
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-garden-600 dark:group-hover:text-garden-400 truncate">
                    {plant.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{plant.category}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            {currentSeason === 'winter' || currentSeason === 'spring' 
              ? '🏠 Start Indoors Now' 
              : currentSeason === 'summer'
                ? '🌿 Plant Outdoors Now'
                : '🍂 Fall Planting Options'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seasonalPlants.length > 0 ? (
              seasonalPlants.map((plant) => (
                <Link
                  key={plant.id}
                  href={`/plants/${plant.id}`}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {seedCategories.find(c => c.value === plant.category)?.emoji || '🌱'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-garden-600 dark:group-hover:text-garden-400 truncate">
                        {plant.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{plant.category}</p>
                      {plant.daysToMaturity && (
                        <p className="text-xs text-garden-600 dark:text-garden-400 mt-1">
                          {plant.daysToMaturity} days to harvest
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No seasonal recommendations available.</p>
                <Link href="/plants" className="text-garden-600 hover:text-garden-700 dark:text-garden-400 mt-2 inline-block">
                  Browse all plants →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> Your hardiness zone ({zone}) determines which plants will survive your winters. 
            {zoneInfo && ` Your zone typically has a minimum temperature of ${zoneInfo.minTemp}°F.`}
            {!settings?.hardinessZone && ' Set your zone in settings for personalized recommendations.'}
          </p>
        </div>
      </div>

      {/* Pest Control */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bug className="w-6 h-6" />
          Organic Pest Control Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pestControlTips.map((pest) => (
            <div key={pest.pest} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{pest.pest}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{pest.description}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-green-700 dark:text-green-400">Control: </span>
                  <span className="text-gray-600 dark:text-gray-400">{pest.organicControl}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-400">Prevention: </span>
                  <span className="text-gray-600 dark:text-gray-400">{pest.prevention}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Watering Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Droplets className="w-6 h-6" />
          Watering Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Low Water Needs</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Water deeply once per week</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tomatoes (established), Peppers, Herbs, Succulents, Native plants
            </p>
          </div>
          <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Moderate Water Needs</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Water 2-3 times per week</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Beans, Peas, Carrots, Beets, Cabbage, Most vegetables
            </p>
          </div>
          <div className="p-4 bg-blue-200 dark:bg-blue-900/50 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">High Water Needs</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Keep soil consistently moist</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lettuce, Spinach, Celery, Cucumbers, Melons, Seedlings
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">💡 Watering Tips</h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Water in the morning to reduce evaporation and disease</li>
            <li>• Use drip irrigation or soaker hoses for efficient watering</li>
            <li>• Mulch to retain moisture and reduce watering frequency</li>
            <li>• Water deeply and less frequently to encourage deep roots</li>
            <li>• Check soil moisture 2 inches deep before watering</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
