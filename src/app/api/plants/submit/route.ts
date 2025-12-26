import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  sanitizeText, 
  sanitizeUrl, 
  sanitizeStringArray, 
  validateEnum,
  checkRateLimit,
  MAX_LENGTHS 
} from '@/lib/validation'

const VALID_CATEGORIES = ['vegetable', 'herb', 'flower', 'fruit', 'tree', 'shrub', 'vine', 'grass'] as const
const VALID_SUN = ['full sun', 'partial shade', 'full shade', 'partial sun'] as const
const VALID_WATER = ['low', 'moderate', 'high'] as const

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 5 plant submissions per hour per user
    const rateLimit = checkRateLimit(`plant-submit:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate and sanitize required fields
    const name = sanitizeText(body.name, MAX_LENGTHS.name)
    if (!name) {
      return NextResponse.json({ error: 'Plant name is required' }, { status: 400 })
    }

    const description = sanitizeText(body.description, MAX_LENGTHS.mediumText)
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Sanitize and validate all optional fields
    const scientificName = sanitizeText(body.scientificName, MAX_LENGTHS.name)
    const category = validateEnum(body.category, VALID_CATEGORIES, 'vegetable')
    const generalInfo = sanitizeText(body.generalInfo, MAX_LENGTHS.longText)
    const funFacts = sanitizeStringArray(body.funFacts, 20, MAX_LENGTHS.mediumText)
    const variations = sanitizeStringArray(body.variations, 50, MAX_LENGTHS.shortText)
    const hardinessZones = sanitizeStringArray(body.hardinessZones, 30, 10)
    const culinaryUses = sanitizeText(body.culinaryUses, MAX_LENGTHS.longText)
    const medicinalUses = sanitizeText(body.medicinalUses, MAX_LENGTHS.longText)
    const holisticUses = sanitizeText(body.holisticUses, MAX_LENGTHS.longText)
    const craftIdeas = sanitizeText(body.craftIdeas, MAX_LENGTHS.longText)
    const history = sanitizeText(body.history, MAX_LENGTHS.longText)
    const culturalSignificance = sanitizeText(body.culturalSignificance, MAX_LENGTHS.longText)
    const sunRequirement = body.sunRequirement ? validateEnum(body.sunRequirement, VALID_SUN, 'full sun') : null
    const waterNeeds = body.waterNeeds ? validateEnum(body.waterNeeds, VALID_WATER, 'moderate') : null
    const daysToMaturity = sanitizeText(body.daysToMaturity, MAX_LENGTHS.shortText)
    const spacing = sanitizeText(body.spacing, MAX_LENGTHS.shortText)
    const plantingDepth = sanitizeText(body.plantingDepth, MAX_LENGTHS.shortText)
    const companionPlants = sanitizeText(body.companionPlants, MAX_LENGTHS.mediumText)
    const avoidPlants = sanitizeText(body.avoidPlants, MAX_LENGTHS.mediumText)
    const notes = sanitizeText(body.notes, MAX_LENGTHS.notes)
    const sourceUrl = sanitizeUrl(body.sourceUrl)

    // Generate a URL-friendly slug from the sanitized name
    const baseSlug = name
      .toLowerCase()
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // Check if slug already exists and make it unique if needed
    let slug = baseSlug
    let counter = 1
    while (await prisma.plantingGuide.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create the plant submission (pending approval)
    const plant = await prisma.plantingGuide.create({
      data: {
        slug,
        name,
        scientificName,
        category,
        description,
        generalInfo,
        funFacts,
        variations,
        hardinessZones,
        culinaryUses,
        medicinalUses,
        holisticUses,
        craftIdeas,
        history,
        culturalSignificance,
        sunRequirement,
        waterNeeds,
        daysToMaturity,
        spacing,
        plantingDepth,
        companionPlants,
        avoidPlants,
        notes,
        // Mark as user-submitted and pending approval
        isUserSubmitted: true,
        isApproved: false,
        submittedById: session.user.id,
      },
    })

    // Also create a record in PlantRequest for tracking
    await prisma.plantRequest.create({
      data: {
        plantName: name,
        reason: description ? `User submission: ${description.substring(0, 200)}` : 'User submission',
        sourceUrl,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Plant submitted for review',
      plantId: plant.id,
    })
  } catch (error) {
    console.error('Error submitting plant:', error)
    return NextResponse.json(
      { error: 'Failed to submit plant' },
      { status: 500 }
    )
  }
}
