import { NextResponse } from 'next/server'

// Moon phase API endpoint
// Uses ipgeolocation.io for accurate astronomical data
// Falls back to local calculation if API unavailable

interface MoonApiResponse {
  moon_phase: string
  moon_illumination: string
  source: 'ipgeolocation' | 'calculated'
  date: string
}

// Cache moon data for 6 hours
const cache = new Map<string, { data: MoonApiResponse; timestamp: number }>()
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  // Check cache first
  const cached = cache.get(dateParam)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  }
  
  // Try ipgeolocation.io API v2
  const IPGEO_API_KEY = process.env.IPGEO_API_KEY
  
  if (IPGEO_API_KEY) {
    try {
      // Use v2 endpoint with default location (New York)
      const response = await fetch(
        `https://api.ipgeolocation.io/v2/astronomy?apiKey=${IPGEO_API_KEY}&lat=40.7128&long=-74.0060&date=${dateParam}`,
        { 
          signal: AbortSignal.timeout(5000),
          cache: 'no-store' 
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        
        // v2 API nests data under "astronomy" object
        const astronomy = data.astronomy || data
        
        // moon_illumination_percentage is a string, can be negative for waning phases
        const rawIllumination = astronomy.moon_illumination_percentage
        const illumination = typeof rawIllumination === 'string'
          ? Math.abs(parseFloat(rawIllumination))
          : typeof rawIllumination === 'number'
            ? Math.abs(rawIllumination)
            : 0
        
        const result: MoonApiResponse = {
          moon_phase: astronomy.moon_phase || 'Unknown',
          moon_illumination: String(Math.round(illumination)),
          source: 'ipgeolocation',
          date: dateParam
        }
        
        // Cache the result
        cache.set(dateParam, { data: result, timestamp: Date.now() })
        
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
          }
        })
      }
    } catch (error) {
      console.error('ipgeolocation.io API error:', error)
    }
  }
  
  // Fallback to calculation
  const calculatedData = calculateMoonPhase(new Date(dateParam))
  
  const result: MoonApiResponse = {
    moon_phase: calculatedData.phase,
    moon_illumination: String(calculatedData.illumination),
    source: 'calculated',
    date: dateParam
  }
  
  // Cache the result
  cache.set(dateParam, { data: result, timestamp: Date.now() })
  
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
    }
  })
}

// Accurate calculation using known new moon reference
function calculateMoonPhase(date: Date): { phase: string; illumination: number } {
  // Reference: New Moon on January 6, 2000, 18:14 UTC
  const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0))
  const SYNODIC_MONTH = 29.53058867
  
  const daysSinceNewMoon = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)
  const lunarCycles = daysSinceNewMoon / SYNODIC_MONTH
  const cyclePosition = lunarCycles - Math.floor(lunarCycles)
  
  // Illumination using cosine for smoother accuracy
  const illumination = Math.round((1 - Math.cos(cyclePosition * 2 * Math.PI)) / 2 * 100)
  
  // Phase name based on cycle position
  let phase: string
  if (cyclePosition < 0.0625) phase = 'New Moon'
  else if (cyclePosition < 0.1875) phase = 'Waxing Crescent'
  else if (cyclePosition < 0.3125) phase = 'First Quarter'
  else if (cyclePosition < 0.4375) phase = 'Waxing Gibbous'
  else if (cyclePosition < 0.5625) phase = 'Full Moon'
  else if (cyclePosition < 0.6875) phase = 'Waning Gibbous'
  else if (cyclePosition < 0.8125) phase = 'Last Quarter'
  else if (cyclePosition < 0.9375) phase = 'Waning Crescent'
  else phase = 'New Moon'
  
  return { phase, illumination }
}
