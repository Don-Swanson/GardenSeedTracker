import { format, addWeeks, startOfYear, endOfYear, eachMonthOfInterval, getMonth } from 'date-fns'

// Moon phase calculation using accurate reference point
// Reference: New Moon on January 6, 2000, 18:14 UTC
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0))
const SYNODIC_MONTH = 29.53058867

export function getMoonPhase(date: Date): {
  phase: string
  illumination: number
  emoji: string
  plantingAdvice: string
} {
  const daysSinceNewMoon = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)
  const lunarCycles = daysSinceNewMoon / SYNODIC_MONTH
  const cyclePosition = lunarCycles - Math.floor(lunarCycles)
  
  // Calculate illumination using cosine for smooth/accurate transition
  const illumination = Math.round((1 - Math.cos(cyclePosition * 2 * Math.PI)) / 2 * 100)
  
  // Determine phase based on cycle position
  let phase: string
  let emoji: string
  let plantingAdvice: string
  
  if (cyclePosition < 0.0625) {
    phase = 'New Moon'
    emoji = '🌑'
    plantingAdvice = 'Best for planting leafy crops that produce seeds outside the fruit'
  } else if (cyclePosition < 0.1875) {
    phase = 'Waxing Crescent'
    emoji = '🌒'
    plantingAdvice = 'Good for leafy annuals with external seeds'
  } else if (cyclePosition < 0.3125) {
    phase = 'First Quarter'
    emoji = '🌓'
    plantingAdvice = 'Best for fruiting annuals with internal seeds (tomatoes, peppers)'
  } else if (cyclePosition < 0.4375) {
    phase = 'Waxing Gibbous'
    emoji = '🌔'
    plantingAdvice = 'Good for transplanting and grafting'
  } else if (cyclePosition < 0.5625) {
    phase = 'Full Moon'
    emoji = '🌕'
    plantingAdvice = 'Best for planting root crops and perennials'
  } else if (cyclePosition < 0.6875) {
    phase = 'Waning Gibbous'
    emoji = '🌖'
    plantingAdvice = 'Good for root vegetables and bulbs'
  } else if (cyclePosition < 0.8125) {
    phase = 'Last Quarter'
    emoji = '🌗'
    plantingAdvice = 'Best for weeding, harvesting, and pest control'
  } else if (cyclePosition < 0.9375) {
    phase = 'Waning Crescent'
    emoji = '🌘'
    plantingAdvice = 'Rest period - avoid planting. Good for soil work'
  } else {
    phase = 'New Moon'
    emoji = '🌑'
    plantingAdvice = 'Best for planting leafy crops that produce seeds outside the fruit'
  }
  
  return {
    phase,
    illumination,
    emoji,
    plantingAdvice,
  }
}

// USDA Hardiness Zones with frost dates
export const hardinessZones: Record<string, {
  minTemp: number
  maxTemp: number
  lastFrostSpring: string
  firstFrostFall: string
  description: string
}> = {
  '1a': { minTemp: -60, maxTemp: -55, lastFrostSpring: 'Jun 15', firstFrostFall: 'Jul 15', description: 'Extreme cold' },
  '1b': { minTemp: -55, maxTemp: -50, lastFrostSpring: 'Jun 10', firstFrostFall: 'Jul 20', description: 'Extreme cold' },
  '2a': { minTemp: -50, maxTemp: -45, lastFrostSpring: 'Jun 1', firstFrostFall: 'Aug 1', description: 'Very cold' },
  '2b': { minTemp: -45, maxTemp: -40, lastFrostSpring: 'May 25', firstFrostFall: 'Aug 10', description: 'Very cold' },
  '3a': { minTemp: -40, maxTemp: -35, lastFrostSpring: 'May 20', firstFrostFall: 'Aug 20', description: 'Cold' },
  '3b': { minTemp: -35, maxTemp: -30, lastFrostSpring: 'May 15', firstFrostFall: 'Sep 1', description: 'Cold' },
  '4a': { minTemp: -30, maxTemp: -25, lastFrostSpring: 'May 10', firstFrostFall: 'Sep 10', description: 'Cold' },
  '4b': { minTemp: -25, maxTemp: -20, lastFrostSpring: 'May 5', firstFrostFall: 'Sep 20', description: 'Cold' },
  '5a': { minTemp: -20, maxTemp: -15, lastFrostSpring: 'May 1', firstFrostFall: 'Oct 1', description: 'Moderate' },
  '5b': { minTemp: -15, maxTemp: -10, lastFrostSpring: 'Apr 25', firstFrostFall: 'Oct 10', description: 'Moderate' },
  '6a': { minTemp: -10, maxTemp: -5, lastFrostSpring: 'Apr 20', firstFrostFall: 'Oct 15', description: 'Moderate' },
  '6b': { minTemp: -5, maxTemp: 0, lastFrostSpring: 'Apr 15', firstFrostFall: 'Oct 20', description: 'Moderate' },
  '7a': { minTemp: 0, maxTemp: 5, lastFrostSpring: 'Apr 10', firstFrostFall: 'Oct 25', description: 'Mild' },
  '7b': { minTemp: 5, maxTemp: 10, lastFrostSpring: 'Apr 1', firstFrostFall: 'Nov 1', description: 'Mild' },
  '8a': { minTemp: 10, maxTemp: 15, lastFrostSpring: 'Mar 25', firstFrostFall: 'Nov 10', description: 'Warm' },
  '8b': { minTemp: 15, maxTemp: 20, lastFrostSpring: 'Mar 15', firstFrostFall: 'Nov 15', description: 'Warm' },
  '9a': { minTemp: 20, maxTemp: 25, lastFrostSpring: 'Mar 1', firstFrostFall: 'Nov 25', description: 'Very warm' },
  '9b': { minTemp: 25, maxTemp: 30, lastFrostSpring: 'Feb 15', firstFrostFall: 'Dec 1', description: 'Very warm' },
  '10a': { minTemp: 30, maxTemp: 35, lastFrostSpring: 'Jan 31', firstFrostFall: 'Dec 15', description: 'Hot' },
  '10b': { minTemp: 35, maxTemp: 40, lastFrostSpring: 'Jan 15', firstFrostFall: 'Dec 25', description: 'Hot' },
  '11a': { minTemp: 40, maxTemp: 45, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
  '11b': { minTemp: 45, maxTemp: 50, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
  '12a': { minTemp: 50, maxTemp: 55, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
  '12b': { minTemp: 55, maxTemp: 60, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
  '13a': { minTemp: 60, maxTemp: 65, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
  '13b': { minTemp: 65, maxTemp: 70, lastFrostSpring: 'Frost-free', firstFrostFall: 'Frost-free', description: 'Tropical' },
}

// Calculate planting dates based on last frost date
export function calculatePlantingDates(
  lastFrostDate: Date,
  indoorStartWeeks: number | null,
  outdoorStartWeeks: number | null,
  transplantWeeks: number | null
): {
  indoorStart: Date | null
  outdoorStart: Date | null
  transplant: Date | null
} {
  return {
    indoorStart: indoorStartWeeks ? addWeeks(lastFrostDate, -indoorStartWeeks) : null,
    outdoorStart: outdoorStartWeeks !== null ? addWeeks(lastFrostDate, outdoorStartWeeks) : null,
    transplant: transplantWeeks !== null ? addWeeks(lastFrostDate, transplantWeeks) : null,
  }
}

// Parse frost date string to Date
export function parseFrostDate(frostDateStr: string, year: number): Date | null {
  if (frostDateStr === 'Frost-free') return null
  
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  }
  
  const parts = frostDateStr.split(' ')
  const month = months[parts[0]]
  const day = parseInt(parts[1])
  
  return new Date(year, month, day)
}

// Seasonal gardening tips
export const seasonalTips: Record<string, string[]> = {
  spring: [
    'Start warm-season seeds indoors 6-8 weeks before last frost',
    'Direct sow cool-season crops like peas, lettuce, and spinach',
    'Prepare garden beds by adding compost and organic matter',
    'Test soil pH and amend as needed',
    'Start hardening off seedlings before transplanting',
    'Apply mulch to retain moisture and suppress weeds',
    'Clean and sharpen garden tools',
  ],
  summer: [
    'Water deeply and less frequently to encourage deep root growth',
    'Mulch heavily to conserve moisture and keep roots cool',
    'Succession plant quick-growing crops every 2-3 weeks',
    'Monitor for pests and diseases regularly',
    'Harvest vegetables at peak ripeness for best flavor',
    'Provide shade for cool-season crops',
    'Start fall crop seeds indoors in late summer',
  ],
  fall: [
    'Plant garlic and perennial onions for next year',
    'Direct sow cool-season crops for fall harvest',
    'Collect seeds from heirloom varieties',
    'Add fallen leaves to compost pile',
    'Clean up spent plants to prevent disease',
    'Cover cold-hardy crops with row covers to extend harvest',
    'Plant cover crops in empty beds',
  ],
  winter: [
    'Plan next year\'s garden layout',
    'Order seeds early for best selection',
    'Clean and organize seed storage',
    'Start paperwork for planting calendar',
    'Maintain tools and equipment',
    'Build or repair garden structures',
    'Research new varieties and techniques',
  ],
}

// Get current season
export function getCurrentSeason(date: Date = new Date()): string {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

// Format date for display
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

// Seed categories
export const seedCategories = [
  { value: 'vegetable', label: 'Vegetable', emoji: '🥬' },
  { value: 'fruit', label: 'Fruit', emoji: '🍅' },
  { value: 'herb', label: 'Herb', emoji: '🌿' },
  { value: 'flower', label: 'Flower', emoji: '🌸' },
]

// Sun requirements
export const sunRequirements = [
  { value: 'full sun', label: 'Full Sun (6+ hours)', icon: '☀️' },
  { value: 'partial shade', label: 'Partial Shade (3-6 hours)', icon: '⛅' },
  { value: 'full shade', label: 'Full Shade (<3 hours)', icon: '🌥️' },
]

// Water needs
export const waterNeeds = [
  { value: 'low', label: 'Low', description: 'Drought tolerant' },
  { value: 'moderate', label: 'Moderate', description: 'Regular watering' },
  { value: 'high', label: 'High', description: 'Keep consistently moist' },
]

// Planting status options
export const plantingStatuses = [
  { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white' },
  { value: 'planted', label: 'Planted', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'germinated', label: 'Germinated', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'growing', label: 'Growing', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { value: 'harvested', label: 'Harvested', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
]
