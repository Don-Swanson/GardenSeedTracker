import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { 
  sanitizeText, 
  sanitizeUrl, 
  sanitizeNumber,
  sanitizeInteger,
  checkRateLimit,
  MAX_LENGTHS 
} from '@/lib/validation'

export async function GET() {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only fetch wishlist items belonging to the authenticated user
    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 100 wishlist items per hour
    const rateLimit = checkRateLimit(`wishlist-create:${session.user.id}`, 100, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const data = await request.json()

    // Validate required field - either plantTypeId or customPlantName
    const customPlantName = sanitizeText(data.name || data.customPlantName, MAX_LENGTHS.name)
    const plantTypeId = sanitizeText(data.plantTypeId, MAX_LENGTHS.name)
    
    if (!customPlantName && !plantTypeId) {
      return NextResponse.json({ error: 'Plant name or type is required' }, { status: 400 })
    }

    // Sanitize all input fields
    const variety = sanitizeText(data.variety, MAX_LENGTHS.name)
    const brand = sanitizeText(data.brand, MAX_LENGTHS.name)
    const estimatedPrice = sanitizeNumber(data.estimatedPrice, 0, 100000)
    const priority = sanitizeInteger(data.priority, 1, 5) ?? 3
    const sourceUrl = sanitizeUrl(data.sourceUrl) // Properly validate URL
    const notes = sanitizeText(data.notes, MAX_LENGTHS.notes)
    
    // Custom planting dates (for items not linked to encyclopedia)
    const indoorStartWeeks = sanitizeInteger(data.indoorStartWeeks, 0, 20)
    const outdoorStartWeeks = sanitizeInteger(data.outdoorStartWeeks, -10, 20)
    
    // Create wishlist item with authenticated user's ID
    const item = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id, // Secure: use authenticated user ID
        plantTypeId,
        customPlantName,
        variety,
        brand,
        estimatedPrice,
        priority,
        sourceUrl,
        notes,
        indoorStartWeeks,
        outdoorStartWeeks,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating wishlist item:', error)
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 })
  }
}
