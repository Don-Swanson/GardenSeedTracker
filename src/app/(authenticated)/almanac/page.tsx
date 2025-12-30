import { prisma } from '@/lib/prisma'
import { 
  getMoonPhase, 
  getCurrentSeason, 
  seasonalTips, 
  hardinessZones, 
  parseFrostDate,
  seedCategories 
} from '@/lib/garden-utils'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Moon, Sun, Droplets, Thermometer, Wind, Leaf, Bug, Calendar, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
  const settings = await prisma.userSettings.findFirst()
  const zone = settings?.hardinessZone || '7a'
  const zoneInfo = hardinessZones[zone]
  
  const today = new Date()
  const currentSeason = getCurrentSeason(today)
  const moonPhase = getMoonPhase(today)
  
  // Generate moon calendar for current month
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const moonCalendar = daysInMonth.map(day => ({
    date: day,
    ...getMoonPhase(day),
  }))

  // Get planting guides for companion planting info
  const plantingGuides = await prisma.plantingGuide.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Garden Almanac</h1>
        <p className="text-gray-600 mt-1">
          Your guide to successful gardening with moon phases, companion planting, and seasonal tips
        </p>
      </div>

      {/* Plant Encyclopedia Promo */}
      <Link 
        href="/plants"
        className="block card bg-gradient-to-r from-garden-50 to-emerald-50 border-garden-200 hover:shadow-lg transition-shadow group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-garden-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-garden-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-garden-900 group-hover:text-garden-700">
                Plant Encyclopedia
              </h2>
              <p className="text-sm text-garden-700">
                Explore detailed guides with growing tips, recipes, medicinal uses, and more for 50+ plants
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-garden-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moon Phase */}
        <div className="card text-center">
          <Moon className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
          <h2 className="font-semibold text-gray-900">Today&apos;s Moon</h2>
          <div className="mt-4">
            <span className="text-5xl">{moonPhase.emoji}</span>
            <p className="font-medium text-gray-900 mt-2">{moonPhase.phase}</p>
            <p className="text-sm text-gray-500">{Math.round(moonPhase.illumination)}% illuminated</p>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
            {moonPhase.plantingAdvice}
          </div>
        </div>

        {/* Season */}
        <div className="card text-center">
          <Sun className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <h2 className="font-semibold text-gray-900">Current Season</h2>
          <div className="mt-4">
            <span className="text-5xl">
              {currentSeason === 'spring' ? '🌸' : 
               currentSeason === 'summer' ? '☀️' : 
               currentSeason === 'fall' ? '🍂' : '❄️'}
            </span>
            <p className="font-medium text-gray-900 mt-2 capitalize">{currentSeason}</p>
            <p className="text-sm text-gray-500">{format(today, 'MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Zone Info */}
        <div className="card text-center">
          <Thermometer className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <h2 className="font-semibold text-gray-900">Growing Zone {zone}</h2>
          {zoneInfo && (
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Last Spring Frost</p>
                <p className="font-medium">{zoneInfo.lastFrostSpring}</p>
              </div>
              <div>
                <p className="text-gray-500">First Fall Frost</p>
                <p className="font-medium">{zoneInfo.firstFrostFall}</p>
              </div>
              <div>
                <p className="text-gray-500">Min Winter Temp</p>
                <p className="font-medium">{zoneInfo.minTemp}°F to {zoneInfo.maxTemp}°F</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moon Calendar */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Moon className="w-6 h-6" />
          Moon Calendar - {format(today, 'MMMM yyyy')}
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                className={`text-center p-2 rounded-lg ${isToday ? 'bg-garden-100 ring-2 ring-garden-500' : 'hover:bg-gray-50'}`}
              >
                <p className="text-sm text-gray-600">{format(day.date, 'd')}</p>
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
              <p className="font-medium">New Moon</p>
              <p className="text-gray-500">Plant leafy crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌓</span>
            <div>
              <p className="font-medium">First Quarter</p>
              <p className="text-gray-500">Plant fruiting crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌕</span>
            <div>
              <p className="font-medium">Full Moon</p>
              <p className="text-gray-500">Plant root crops</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">🌗</span>
            <div>
              <p className="font-medium">Last Quarter</p>
              <p className="text-gray-500">Rest, weed, harvest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Tips */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Garden Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasonalTips[currentSeason].map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-garden-100 text-garden-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Companion Planting Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Companion Planting Guide
        </h2>
        <p className="text-gray-600 mb-4">
          Growing certain plants together can improve growth, deter pests, and increase yields.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Crop</th>
                <th className="text-left py-3 px-4 font-semibold text-green-700">Good Companions ✓</th>
                <th className="text-left py-3 px-4 font-semibold text-red-700">Avoid ✗</th>
              </tr>
            </thead>
            <tbody>
              {companionChart.map((row, index) => (
                <tr key={row.crop} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-3 px-4 font-medium text-gray-900">{row.crop}</td>
                  <td className="py-3 px-4 text-gray-600">{row.goodCompanions}</td>
                  <td className="py-3 px-4 text-gray-600">{row.badCompanions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pest Control */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bug className="w-6 h-6" />
          Organic Pest Control Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pestControlTips.map((pest) => (
            <div key={pest.pest} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{pest.pest}</h3>
              <p className="text-sm text-gray-600 mb-3">{pest.description}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-green-700">Control: </span>
                  <span className="text-gray-600">{pest.organicControl}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Prevention: </span>
                  <span className="text-gray-600">{pest.prevention}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Watering Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Droplets className="w-6 h-6" />
          Watering Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Low Water Needs</h3>
            <p className="text-sm text-blue-700 mb-2">Water deeply once per week</p>
            <p className="text-sm text-gray-600">
              Tomatoes (established), Peppers, Herbs, Succulents, Native plants
            </p>
          </div>
          <div className="p-4 bg-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Moderate Water Needs</h3>
            <p className="text-sm text-blue-700 mb-2">Water 2-3 times per week</p>
            <p className="text-sm text-gray-600">
              Beans, Peas, Carrots, Beets, Cabbage, Most vegetables
            </p>
          </div>
          <div className="p-4 bg-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">High Water Needs</h3>
            <p className="text-sm text-blue-700 mb-2">Keep soil consistently moist</p>
            <p className="text-sm text-gray-600">
              Lettuce, Spinach, Celery, Cucumbers, Melons, Seedlings
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">💡 Watering Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
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
