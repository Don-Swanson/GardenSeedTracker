import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { 
  sanitizeText, 
  sanitizeUrl, 
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

    // Only fetch seeds belonging to the authenticated user
    const seeds = await prisma.seed.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        plantings: true,
        plantType: true,
      },
    })
    return NextResponse.json(seeds)
  } catch (error) {
    console.error('Error fetching seeds:', error)
    return NextResponse.json({ error: 'Failed to fetch seeds' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 50 seeds created per hour
    const rateLimit = checkRateLimit(`seed-create:${session.user.id}`, 50, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const data = await request.json()

    // Validate and sanitize all input fields
    const nickname = sanitizeText(data.nickname, MAX_LENGTHS.name)
    const variety = sanitizeText(data.variety, MAX_LENGTHS.name)
    const brand = sanitizeText(data.brand, MAX_LENGTHS.name)
    const quantity = sanitizeInteger(data.quantity, 0, 1000000) ?? 1
    const quantityUnit = sanitizeText(data.quantityUnit, 50) || 'seeds'
    const daysToGerminate = sanitizeInteger(data.daysToGerminate, 0, 365)
    const daysToMaturity = sanitizeInteger(data.daysToMaturity, 0, 730)
    const sunRequirement = sanitizeText(data.sunRequirement, MAX_LENGTHS.shortText)
    const waterNeeds = sanitizeText(data.waterNeeds, MAX_LENGTHS.shortText)
    const spacing = sanitizeText(data.spacing, MAX_LENGTHS.shortText)
    const plantingDepth = sanitizeText(data.plantingDepth, MAX_LENGTHS.shortText)
    const customPlantName = sanitizeText(data.customPlantName, MAX_LENGTHS.name)
    const customCategory = sanitizeText(data.customCategory, MAX_LENGTHS.name)
    const notes = sanitizeText(data.notes, MAX_LENGTHS.notes)
    const imageUrl = sanitizeUrl(data.imageUrl)
    const lotNumber = sanitizeText(data.lotNumber, MAX_LENGTHS.shortText)
    const source = sanitizeText(data.source, MAX_LENGTHS.name)

    // Validate dates
    let purchaseDate = null
    let expirationDate = null
    if (data.purchaseDate) {
      const parsed = new Date(data.purchaseDate)
      if (!isNaN(parsed.getTime())) purchaseDate = parsed
    }
    if (data.expirationDate) {
      const parsed = new Date(data.expirationDate)
      if (!isNaN(parsed.getTime())) expirationDate = parsed
    }

    // Validate plantTypeId if provided
    let plantTypeId = null
    if (data.plantTypeId) {
      const plantType = await prisma.plantingGuide.findUnique({
        where: { id: data.plantTypeId },
        select: { id: true }
      })
      if (plantType) plantTypeId = plantType.id
    }
    
    // Create seed with authenticated user's ID and sanitized data
    const seed = await prisma.seed.create({
      data: {
        userId: session.user.id, // Secure: use authenticated user ID
        nickname,
        variety,
        brand,
        quantity,
        quantityUnit,
        purchaseDate,
        expirationDate,
        daysToGerminate,
        daysToMaturity,
        sunRequirement,
        waterNeeds,
        spacing,
        plantingDepth,
        plantTypeId,
        customPlantName,
        customCategory,
        notes,
        imageUrl,
        lotNumber,
        source,
      },
      include: {
        plantType: true,
      },
    })

    return NextResponse.json(seed, { status: 201 })
  } catch (error) {
    console.error('Error creating seed:', error)
    return NextResponse.json({ error: 'Failed to create seed' }, { status: 500 })
  }
}
