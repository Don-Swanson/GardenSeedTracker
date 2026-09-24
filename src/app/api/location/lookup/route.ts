import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import {
  combineLocationLookup,
  isValidUsZip,
  type PhzmapiResponse,
  type ZippopotamResponse,
} from '@/lib/location'

// GET /api/location/lookup?zip=32578
// Turns a US ZIP code into a latitude/longitude, place name and USDA
// hardiness zone, so Settings (and onboarding) can auto-fill them instead of
// making the user look each one up manually. Done server-side (rather than
// the two public APIs being called from the browser) to keep this cacheable
// and to avoid depending on their CORS behavior.
//
// Two independent, free, keyless services - either can be down without
// failing the whole request:
// - zippopotam.us: place name + coordinates
// - phzmapi.org: USDA hardiness zone (+ its own coordinates as a fallback)

interface CachedResult {
  data: ReturnType<typeof combineLocationLookup>
  timestamp: number
}

const cache = new Map<string, CachedResult>()
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (error) {
    console.error(`Location lookup request failed for ${url}:`, error)
    return null
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const zip = (searchParams.get('zip') || '').trim()

  if (!isValidUsZip(zip)) {
    return NextResponse.json({ error: 'Please enter a valid 5-digit US ZIP code' }, { status: 400 })
  }

  const cached = cache.get(zip)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data)
  }

  const [zippopotam, phzmapi] = await Promise.all([
    fetchJson<ZippopotamResponse>(`https://api.zippopotam.us/us/${zip}`),
    fetchJson<PhzmapiResponse>(`https://phzmapi.org/${zip}.json`),
  ])

  const result = combineLocationLookup(zip, zippopotam, phzmapi)

  if (result.latitude === null || result.longitude === null) {
    return NextResponse.json({ error: 'Could not find location for this ZIP code' }, { status: 404 })
  }

  cache.set(zip, { data: result, timestamp: Date.now() })
  return NextResponse.json(result)
}
