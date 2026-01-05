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
import { notifyAdmins } from '@/lib/admin-notifications'

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
    const subcategory = sanitizeText(body.subcategory, MAX_LENGTHS.shortText)
    const generalInfo = sanitizeText(body.generalInfo, MAX_LENGTHS.longText)
    const funFacts = sanitizeStringArray(body.funFacts, 20, MAX_LENGTHS.mediumText)
    const variations = sanitizeStringArray(body.variations, 50, MAX_LENGTHS.shortText)
    const hardinessZones = sanitizeStringArray(body.hardinessZones, 30, 10)
    const optimalZones = sanitizeStringArray(body.optimalZones, 30, 10)
    const zoneNotes = sanitizeText(body.zoneNotes, MAX_LENGTHS.mediumText)
    const culinaryUses = sanitizeText(body.culinaryUses, MAX_LENGTHS.longText)
    const medicinalUses = sanitizeText(body.medicinalUses, MAX_LENGTHS.longText)
    const holisticUses = sanitizeText(body.holisticUses, MAX_LENGTHS.longText)
    const craftIdeas = sanitizeText(body.craftIdeas, MAX_LENGTHS.longText)
    const flavorProfile = sanitizeText(body.flavorProfile, MAX_LENGTHS.mediumText)
    const nutritionalInfo = sanitizeText(body.nutritionalInfo, MAX_LENGTHS.mediumText)
    const cautions = sanitizeText(body.cautions, MAX_LENGTHS.mediumText)
    const history = sanitizeText(body.history, MAX_LENGTHS.longText)
    const culturalSignificance = sanitizeText(body.culturalSignificance, MAX_LENGTHS.longText)
    const sunRequirement = body.sunRequirement ? validateEnum(body.sunRequirement, VALID_SUN, 'full sun') : null
    const waterNeeds = body.waterNeeds ? validateEnum(body.waterNeeds, VALID_WATER, 'moderate') : null
    const soilPH = sanitizeText(body.soilPH, MAX_LENGTHS.shortText)
    
    // Timing fields
    const indoorStartWeeks = body.indoorStartWeeks ? parseInt(body.indoorStartWeeks, 10) : null
    const outdoorStartWeeks = body.outdoorStartWeeks ? parseInt(body.outdoorStartWeeks, 10) : null
    const transplantWeeks = body.transplantWeeks ? parseInt(body.transplantWeeks, 10) : null
    const harvestWeeks = body.harvestWeeks ? parseInt(body.harvestWeeks, 10) : null
    
    // Germination and maturity
    const daysToGerminate = body.daysToGerminate ? parseInt(body.daysToGerminate, 10) : null
    const daysToMaturityStr = sanitizeText(body.daysToMaturity, MAX_LENGTHS.shortText)
    const daysToMaturity = daysToMaturityStr ? parseInt(daysToMaturityStr, 10) || null : null
    
    // Temperature fields
    const minGerminationTemp = body.minGerminationTemp ? parseInt(body.minGerminationTemp, 10) : null
    const optGerminationTemp = body.optGerminationTemp ? parseInt(body.optGerminationTemp, 10) : null
    const minGrowingTemp = body.minGrowingTemp ? parseInt(body.minGrowingTemp, 10) : null
    const maxGrowingTemp = body.maxGrowingTemp ? parseInt(body.maxGrowingTemp, 10) : null
    
    // Spacing fields
    const spacing = sanitizeText(body.spacing, MAX_LENGTHS.shortText)
    const rowSpacing = sanitizeText(body.rowSpacing, MAX_LENGTHS.shortText)
    const plantingDepth = sanitizeText(body.plantingDepth, MAX_LENGTHS.shortText)
    const plantsPerSquareFoot = body.plantsPerSquareFoot ? parseFloat(body.plantsPerSquareFoot) : null
    
    const companionPlants = sanitizeText(body.companionPlants, MAX_LENGTHS.mediumText)
    const avoidPlants = sanitizeText(body.avoidPlants, MAX_LENGTHS.mediumText)
    
    // Pests and diseases
    const commonPests = sanitizeText(body.commonPests, MAX_LENGTHS.mediumText)
    const commonDiseases = sanitizeText(body.commonDiseases, MAX_LENGTHS.mediumText)
    const organicPestControl = sanitizeText(body.organicPestControl, MAX_LENGTHS.longText)
    
    // Harvest and storage
    const harvestTips = sanitizeText(body.harvestTips, MAX_LENGTHS.longText)
    const storageTips = sanitizeText(body.storageTips, MAX_LENGTHS.longText)
    const preservationMethods = sanitizeText(body.preservationMethods, MAX_LENGTHS.longText)
    
    const notes = sanitizeText(body.notes, MAX_LENGTHS.notes)
    const sourceUrl = sanitizeUrl(body.sourceUrl)

    // Check if a plant with this name already exists
    const existingPlant = await prisma.plantingGuide.findUnique({ where: { name } })
    if (existingPlant) {
      return NextResponse.json({ error: 'A plant with this name already exists' }, { status: 400 })
    }

    // Create the plant submission (pending approval)
    const plant = await prisma.plantingGuide.create({
      data: {
        name,
        scientificName,
        category,
        subcategory,
        description,
        generalInfo,
        funFacts: funFacts ? JSON.stringify(funFacts) : null,
        variations: variations ? JSON.stringify(variations) : null,
        hardinessZones: hardinessZones ? JSON.stringify(hardinessZones) : null,
        optimalZones: optimalZones ? JSON.stringify(optimalZones) : null,
        zoneNotes,
        culinaryUses,
        medicinalUses,
        holisticUses,
        craftIdeas,
        flavorProfile,
        nutritionalInfo,
        cautions,
        history,
        culturalSignificance,
        sunRequirement,
        waterNeeds,
        soilPH,
        indoorStartWeeks: !isNaN(indoorStartWeeks as number) ? indoorStartWeeks : null,
        outdoorStartWeeks: !isNaN(outdoorStartWeeks as number) ? outdoorStartWeeks : null,
        transplantWeeks: !isNaN(transplantWeeks as number) ? transplantWeeks : null,
        harvestWeeks: !isNaN(harvestWeeks as number) ? harvestWeeks : null,
        daysToGerminate: !isNaN(daysToGerminate as number) ? daysToGerminate : null,
        daysToMaturity,
        minGerminationTemp: !isNaN(minGerminationTemp as number) ? minGerminationTemp : null,
        optGerminationTemp: !isNaN(optGerminationTemp as number) ? optGerminationTemp : null,
        minGrowingTemp: !isNaN(minGrowingTemp as number) ? minGrowingTemp : null,
        maxGrowingTemp: !isNaN(maxGrowingTemp as number) ? maxGrowingTemp : null,
        spacing,
        rowSpacing,
        plantingDepth,
        plantsPerSquareFoot: !isNaN(plantsPerSquareFoot as number) ? plantsPerSquareFoot : null,
        companionPlants,
        avoidPlants,
        commonPests,
        commonDiseases,
        organicPestControl,
        harvestTips,
        storageTips,
        preservationMethods,
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
        category,
        scientificName,
        description,
        reason: `User submission: ${name}`,
        additionalInfo: generalInfo || null,
        sourceUrl,
        userId: session.user.id,
      },
    })

    // Notify admins of new plant submission
    notifyAdmins('newPlantSubmission', {
      plantName: name,
      userEmail: session.user.email || undefined,
    }).catch(err => console.error('Failed to notify admins of plant submission:', err))

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
