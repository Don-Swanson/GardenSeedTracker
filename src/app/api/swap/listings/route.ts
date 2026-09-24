import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { boundingBox, haversineMiles, roundCoordinateForPrivacy } from '@/lib/geo'
import { SWAP_LISTING_EXPIRY_DAYS, SWAP_QUANTITY_MAX_LENGTH } from '@/lib/swap'
import { sanitizeText, sanitizeInteger, checkRateLimit, MAX_LENGTHS } from '@/lib/validation'
import { Prisma } from '@prisma/client'

const MAX_CANDIDATES_FOR_DISTANCE_SORT = 500

// GET /api/swap/listings - browse the swap board, or ?mine=true for your own listings
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const mine = searchParams.get('mine') === 'true'
    const type = searchParams.get('type')
    const q = (searchParams.get('q') || '').trim().slice(0, 100)
    const shippingOk = searchParams.get('shippingOk') === 'true'
    const localPickupOk = searchParams.get('localPickupOk') === 'true'
    const sort = searchParams.get('sort') === 'distance' ? 'distance' : 'newest'
    const maxDistanceMiles = sanitizeInteger(searchParams.get('maxDistanceMiles'), 1, 500)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))

    const conditions: Prisma.SwapListingWhereInput[] = []
    if (mine) {
      conditions.push({ userId: session.user.id })
    } else {
      conditions.push({ status: 'active' })
      conditions.push({ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] })

      // Blocking is mutual for browsing: hide listings from anyone the
      // viewer blocked, and from anyone who blocked the viewer.
      const blocks = await prisma.userBlock.findMany({
        where: { OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }] },
        select: { blockerId: true, blockedId: true },
      })
      const hiddenUserIds = new Set(blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== session.user.id))
      if (hiddenUserIds.size > 0) {
        conditions.push({ userId: { notIn: Array.from(hiddenUserIds) } })
      }
    }
    if (type === 'offer' || type === 'want') conditions.push({ type })
    if (shippingOk) conditions.push({ shippingOk: true })
    if (localPickupOk) conditions.push({ localPickupOk: true })
    if (q) {
      conditions.push({
        OR: [
          { customPlantName: { contains: q } },
          { variety: { contains: q } },
          { description: { contains: q } },
          { plantType: { name: { contains: q } } },
        ],
      })
    }

    // Distance filter/sort needs a center point: an explicit lat/lon (e.g.
    // "search near this ZIP") or, by default, the viewer's own saved location.
    let center: { latitude: number; longitude: number } | null = null
    const queryLat = parseFloat(searchParams.get('lat') || '')
    const queryLon = parseFloat(searchParams.get('lon') || '')
    if (Number.isFinite(queryLat) && Number.isFinite(queryLon)) {
      center = { latitude: queryLat, longitude: queryLon }
    } else if (maxDistanceMiles || sort === 'distance') {
      const viewerSettings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { latitude: true, longitude: true },
      })
      if (viewerSettings?.latitude != null && viewerSettings?.longitude != null) {
        center = { latitude: viewerSettings.latitude, longitude: viewerSettings.longitude }
      }
    }

    const needsDistance = center && (maxDistanceMiles || sort === 'distance')
    if (needsDistance && center) {
      const box = boundingBox(center.latitude, center.longitude, maxDistanceMiles || 500)
      conditions.push({ latitude: { gte: box.minLat, lte: box.maxLat } })
      conditions.push({ longitude: { gte: box.minLon, lte: box.maxLon } })
    }

    const where: Prisma.SwapListingWhereInput = { AND: conditions }
    const includeForDisplay = {
      user: { select: { id: true, username: true, name: true, lastActiveAt: true } },
      plantType: { select: { id: true, name: true, category: true } },
    } satisfies Prisma.SwapListingInclude

    if (needsDistance && center) {
      // Bounding box is a square, not a circle, and we need exact distances
      // to sort/filter/paginate correctly - so fetch a bounded candidate
      // set and finish the work in JS rather than in SQL.
      const candidates = await prisma.swapListing.findMany({
        where,
        include: includeForDisplay,
        orderBy: { createdAt: 'desc' },
        take: MAX_CANDIDATES_FOR_DISTANCE_SORT,
      })

      const withDistance = candidates
        .map(listing => ({
          listing,
          distanceMiles: haversineMiles(center!.latitude, center!.longitude, listing.latitude!, listing.longitude!),
        }))
        .filter(({ distanceMiles }) => !maxDistanceMiles || distanceMiles <= maxDistanceMiles)

      if (sort === 'distance') {
        withDistance.sort((a, b) => a.distanceMiles - b.distanceMiles)
      }

      const total = withDistance.length
      const paged = withDistance.slice((page - 1) * limit, page * limit)

      return NextResponse.json({
        listings: paged.map(({ listing, distanceMiles }) => ({ ...listing, distanceMiles: Math.round(distanceMiles) })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    const [listings, total] = await Promise.all([
      prisma.swapListing.findMany({
        where,
        include: includeForDisplay,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.swapListing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching swap listings:', error)
    return NextResponse.json({ error: 'Failed to fetch swap listings' }, { status: 500 })
  }
}

// POST /api/swap/listings - create a listing
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    if (!user?.username) {
      return NextResponse.json({ error: 'Set a username in Settings before posting to the swap board' }, { status: 400 })
    }

    // Rate limit posting, same pattern as wishlist creation.
    const rateLimit = checkRateLimit(`swap-listing-create:${session.user.id}`, 20, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many listings created. Please try again later.' }, { status: 429 })
    }

    const data = await req.json()

    const type = data.type === 'want' ? 'want' : data.type === 'offer' ? 'offer' : null
    if (!type) {
      return NextResponse.json({ error: 'Type must be "offer" or "want"' }, { status: 400 })
    }

    const customPlantName = sanitizeText(data.customPlantName, MAX_LENGTHS.name)
    const plantTypeId = sanitizeText(data.plantTypeId, MAX_LENGTHS.name)
    if (!customPlantName && !plantTypeId) {
      return NextResponse.json({ error: 'A plant name or encyclopedia link is required' }, { status: 400 })
    }

    let seedId: string | null = sanitizeText(data.seedId, MAX_LENGTHS.name)
    if (seedId) {
      if (type !== 'offer') {
        return NextResponse.json({ error: 'Only offers can be linked to a seed in your inventory' }, { status: 400 })
      }
      const seed = await prisma.seed.findFirst({ where: { id: seedId, userId: session.user.id }, select: { id: true } })
      if (!seed) {
        return NextResponse.json({ error: 'Seed not found in your inventory' }, { status: 404 })
      }
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { latitude: true, longitude: true },
    })

    const listing = await prisma.swapListing.create({
      data: {
        userId: session.user.id,
        type,
        seedId,
        plantTypeId,
        customPlantName,
        variety: sanitizeText(data.variety, MAX_LENGTHS.name),
        quantity: sanitizeText(data.quantity, SWAP_QUANTITY_MAX_LENGTH),
        description: sanitizeText(data.description, MAX_LENGTHS.mediumText),
        shippingOk: data.shippingOk === true,
        localPickupOk: data.localPickupOk !== false,
        latitude: settings?.latitude != null ? roundCoordinateForPrivacy(settings.latitude) : null,
        longitude: settings?.longitude != null ? roundCoordinateForPrivacy(settings.longitude) : null,
        expiresAt: new Date(Date.now() + SWAP_LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating swap listing:', error)
    return NextResponse.json({ error: 'Failed to create swap listing' }, { status: 500 })
  }
}
