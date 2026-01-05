// Moon phase data using external API for accuracy
// Falls back to calculation if API is unavailable

export interface MoonPhaseData {
  phase: string
  illumination: number
  emoji: string
  plantingAdvice: string
  daysUntilFull: number
  daysUntilNew: number
  isGoodForPlanting: boolean
  isGoodForHarvesting: boolean
  isGoodForPruning: boolean
}

/**
 * Get moon phase from our API (which fetches from external sources)
 * Falls back to calculation if API fails
 */
export async function getMoonPhaseFromAPI(date: Date = new Date()): Promise<MoonPhaseData> {
  try {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    const response = await fetch(`/api/moon?date=${dateStr}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.moon_phase && data.moon_phase !== 'calculated') {
        return parseMoonApiResponse(data)
      }
    }
  } catch (error) {
    console.error('Failed to fetch moon data from API:', error)
  }

  // Fallback to calculated data
  return getMoonPhaseCalculated(date)
}

/**
 * Parse response from moon API
 */
function parseMoonApiResponse(data: { moon_illumination?: string; moon_phase?: string }): MoonPhaseData {
  const illumination = parseFloat(data.moon_illumination || '0')
  const phase = data.moon_phase || 'Unknown'
  
  // Map API phase names to our format and emoji
  const { phaseName, emoji } = mapPhaseToEmoji(phase, illumination)
  
  // Calculate approximate days until full/new based on illumination and phase
  const { daysUntilFull, daysUntilNew } = estimateDaysUntilPhases(phase, illumination)
  
  // Get gardening recommendations
  const gardeningInfo = getGardeningRecommendations(phase, illumination)
  
  return {
    phase: phaseName,
    illumination: Math.round(illumination),
    emoji,
    daysUntilFull,
    daysUntilNew,
    ...gardeningInfo
  }
}

function mapPhaseToEmoji(phase: string, illumination: number): { phaseName: string; emoji: string } {
  const phaseLower = phase.toLowerCase()
  
  if (phaseLower.includes('new')) {
    return { phaseName: 'New Moon', emoji: '🌑' }
  } else if (phaseLower.includes('waxing') && phaseLower.includes('crescent')) {
    return { phaseName: 'Waxing Crescent', emoji: '🌒' }
  } else if (phaseLower.includes('first quarter')) {
    return { phaseName: 'First Quarter', emoji: '🌓' }
  } else if (phaseLower.includes('waxing') && phaseLower.includes('gibbous')) {
    return { phaseName: 'Waxing Gibbous', emoji: '🌔' }
  } else if (phaseLower.includes('full')) {
    return { phaseName: 'Full Moon', emoji: '🌕' }
  } else if (phaseLower.includes('waning') && phaseLower.includes('gibbous')) {
    return { phaseName: 'Waning Gibbous', emoji: '🌖' }
  } else if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) {
    return { phaseName: 'Last Quarter', emoji: '🌗' }
  } else if (phaseLower.includes('waning') && phaseLower.includes('crescent')) {
    return { phaseName: 'Waning Crescent', emoji: '🌘' }
  }
  
  // Fallback based on illumination
  if (illumination < 5) return { phaseName: 'New Moon', emoji: '🌑' }
  if (illumination < 45) return { phaseName: 'Crescent', emoji: '🌒' }
  if (illumination >= 45 && illumination <= 55) return { phaseName: 'Quarter', emoji: '🌓' }
  if (illumination > 55 && illumination < 95) return { phaseName: 'Gibbous', emoji: '🌔' }
  if (illumination >= 95) return { phaseName: 'Full Moon', emoji: '🌕' }
  
  return { phaseName: phase, emoji: '🌙' }
}

function estimateDaysUntilPhases(phase: string, illumination: number): { daysUntilFull: number; daysUntilNew: number } {
  const phaseLower = phase.toLowerCase()
  const SYNODIC_MONTH = 29.53
  
  let cyclePosition = 0
  
  if (phaseLower.includes('new')) {
    cyclePosition = 0
  } else if (phaseLower.includes('waxing') && phaseLower.includes('crescent')) {
    cyclePosition = 0.125
  } else if (phaseLower.includes('first quarter')) {
    cyclePosition = 0.25
  } else if (phaseLower.includes('waxing') && phaseLower.includes('gibbous')) {
    // More precise: use illumination to estimate position between 0.25 and 0.5
    cyclePosition = 0.25 + ((illumination - 50) / 50) * 0.25
  } else if (phaseLower.includes('full')) {
    cyclePosition = 0.5
  } else if (phaseLower.includes('waning') && phaseLower.includes('gibbous')) {
    cyclePosition = 0.625
  } else if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) {
    cyclePosition = 0.75
  } else if (phaseLower.includes('waning') && phaseLower.includes('crescent')) {
    cyclePosition = 0.875
  }
  
  const daysUntilFull = cyclePosition < 0.5 
    ? Math.round((0.5 - cyclePosition) * SYNODIC_MONTH)
    : Math.round((1.5 - cyclePosition) * SYNODIC_MONTH)
    
  const daysUntilNew = Math.round((1 - cyclePosition) * SYNODIC_MONTH)
  
  return { daysUntilFull, daysUntilNew }
}

function getGardeningRecommendations(phase: string, illumination: number): {
  plantingAdvice: string
  isGoodForPlanting: boolean
  isGoodForHarvesting: boolean
  isGoodForPruning: boolean
} {
  const phaseLower = phase.toLowerCase()
  
  // Waxing phases (moon growing)
  if (phaseLower.includes('new') || (phaseLower.includes('waxing') && phaseLower.includes('crescent'))) {
    return {
      plantingAdvice: 'Best for planting leafy crops that produce seeds outside the fruit (lettuce, spinach, cabbage)',
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (phaseLower.includes('first quarter') || (phaseLower.includes('waxing') && phaseLower.includes('gibbous'))) {
    return {
      plantingAdvice: 'Ideal for fruiting annuals with internal seeds (tomatoes, peppers, squash, beans)',
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (phaseLower.includes('full') || (phaseLower.includes('waning') && phaseLower.includes('gibbous'))) {
    return {
      plantingAdvice: 'Best for planting root crops, bulbs, and perennials. Good time for harvesting.',
      isGoodForPlanting: true,
      isGoodForHarvesting: true,
      isGoodForPruning: false
    }
  } else {
    // Waning crescent / last quarter
    return {
      plantingAdvice: 'Rest period. Best for pruning, weeding, pest control, and turning compost.',
      isGoodForPlanting: false,
      isGoodForHarvesting: true,
      isGoodForPruning: true
    }
  }
}

// ============================================
// Accurate calculation fallback (if API unavailable)
// Using known new moon reference date
// ============================================

const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0))
const SYNODIC_MONTH = 29.53058867

export function getMoonPhaseCalculated(date: Date): MoonPhaseData {
  const daysSinceNewMoon = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)
  const lunarCycles = daysSinceNewMoon / SYNODIC_MONTH
  const currentCyclePosition = lunarCycles - Math.floor(lunarCycles)
  
  // Calculate illumination using cosine for smooth transition
  const illumination = (1 - Math.cos(currentCyclePosition * 2 * Math.PI)) / 2
  
  let daysUntilFull: number
  if (currentCyclePosition < 0.5) {
    daysUntilFull = (0.5 - currentCyclePosition) * SYNODIC_MONTH
  } else {
    daysUntilFull = (1.5 - currentCyclePosition) * SYNODIC_MONTH
  }
  
  const daysUntilNew = (1 - currentCyclePosition) * SYNODIC_MONTH
  const { phase, emoji } = getPhaseNameAndEmoji(currentCyclePosition)
  const gardeningInfo = getGardeningRecommendationsFromPosition(currentCyclePosition)
  
  return {
    phase,
    illumination: Math.round(illumination * 100),
    emoji,
    daysUntilFull: Math.round(daysUntilFull),
    daysUntilNew: Math.round(daysUntilNew),
    ...gardeningInfo
  }
}

function getPhaseNameAndEmoji(cyclePosition: number): { phase: string; emoji: string } {
  if (cyclePosition < 0.0625) return { phase: 'New Moon', emoji: '🌑' }
  if (cyclePosition < 0.1875) return { phase: 'Waxing Crescent', emoji: '🌒' }
  if (cyclePosition < 0.3125) return { phase: 'First Quarter', emoji: '🌓' }
  if (cyclePosition < 0.4375) return { phase: 'Waxing Gibbous', emoji: '🌔' }
  if (cyclePosition < 0.5625) return { phase: 'Full Moon', emoji: '🌕' }
  if (cyclePosition < 0.6875) return { phase: 'Waning Gibbous', emoji: '🌖' }
  if (cyclePosition < 0.8125) return { phase: 'Last Quarter', emoji: '🌗' }
  if (cyclePosition < 0.9375) return { phase: 'Waning Crescent', emoji: '🌘' }
  return { phase: 'New Moon', emoji: '🌑' }
}

function getGardeningRecommendationsFromPosition(cyclePosition: number): {
  plantingAdvice: string
  isGoodForPlanting: boolean
  isGoodForHarvesting: boolean
  isGoodForPruning: boolean
} {
  if (cyclePosition < 0.25) {
    return {
      plantingAdvice: 'Best for planting leafy crops that produce seeds outside the fruit (lettuce, spinach, cabbage)',
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (cyclePosition < 0.5) {
    return {
      plantingAdvice: 'Ideal for fruiting annuals with internal seeds (tomatoes, peppers, squash, beans)',
      isGoodForPlanting: true,
      isGoodForHarvesting: false,
      isGoodForPruning: false
    }
  } else if (cyclePosition < 0.75) {
    return {
      plantingAdvice: 'Best for planting root crops, bulbs, and perennials. Good time for harvesting.',
      isGoodForPlanting: true,
      isGoodForHarvesting: true,
      isGoodForPruning: false
    }
  } else {
    return {
      plantingAdvice: 'Rest period. Best for pruning, weeding, pest control, and turning compost.',
      isGoodForPlanting: false,
      isGoodForHarvesting: true,
      isGoodForPruning: true
    }
  }
}

// ============================================
// Helper functions for calendars
// ============================================

export function getMoonPhasesForMonth(year: number, month: number): Array<{
  date: Date
  phase: MoonPhaseData
}> {
  const phases: Array<{ date: Date; phase: MoonPhaseData }> = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day, 12, 0, 0)
    phases.push({
      date,
      phase: getMoonPhaseCalculated(date)
    })
  }
  
  return phases
}

export function getUpcomingMoonEvents(startDate: Date = new Date(), count: number = 8): Array<{
  date: Date
  phase: 'New Moon' | 'Full Moon' | 'First Quarter' | 'Last Quarter'
  emoji: string
}> {
  const events: Array<{
    date: Date
    phase: 'New Moon' | 'Full Moon' | 'First Quarter' | 'Last Quarter'
    emoji: string
  }> = []
  
  const daysSinceNewMoon = (startDate.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)
  const lunarCycles = daysSinceNewMoon / SYNODIC_MONTH
  const currentCyclePosition = lunarCycles - Math.floor(lunarCycles)
  
  const quarterPositions = [
    { position: 0, phase: 'New Moon' as const, emoji: '🌑' },
    { position: 0.25, phase: 'First Quarter' as const, emoji: '🌓' },
    { position: 0.5, phase: 'Full Moon' as const, emoji: '🌕' },
    { position: 0.75, phase: 'Last Quarter' as const, emoji: '🌗' }
  ]
  
  let cycleOffset = 0
  while (events.length < count) {
    for (const quarter of quarterPositions) {
      if (cycleOffset === 0 && quarter.position <= currentCyclePosition) {
        continue
      }
      
      const daysUntil = cycleOffset === 0
        ? (quarter.position - currentCyclePosition) * SYNODIC_MONTH
        : (quarter.position + cycleOffset - currentCyclePosition) * SYNODIC_MONTH
      
      const eventDate = new Date(startDate.getTime() + daysUntil * 24 * 60 * 60 * 1000)
      events.push({
        date: eventDate,
        phase: quarter.phase,
        emoji: quarter.emoji
      })
      
      if (events.length >= count) break
    }
    cycleOffset += 1
  }
  
  return events.slice(0, count)
}
