import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getRequestMetadata } from '@/lib/audit'

// GET /api/admin/plants - List plants with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { scientificName: { contains: search } }
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    const [plants, total, categories] = await Promise.all([
      prisma.plantingGuide.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.plantingGuide.count({ where }),
      prisma.plantingGuide.findMany({
        select: { category: true },
        distinct: ['category']
      })
    ])

    return NextResponse.json({
      plants,
      categories: categories.map((c: { category: string | null }) => c.category).filter(Boolean),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching plants:', error)
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 })
  }
}

// POST /api/admin/plants - Create new plant
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      scientificName,
      description,
      category,
      subcategory,
      imageUrl,
      // Detailed info
      generalInfo,
      funFacts,
      variations,
      // Zones
      hardinessZones,
      optimalZones,
      zoneNotes,
      // Culinary
      culinaryUses,
      recipes,
      flavorProfile,
      nutritionalInfo,
      // Medicinal/holistic
      medicinalUses,
      holisticUses,
      cautions,
      // Craft
      craftIdeas,
      // Historical
      history,
      culturalSignificance,
      // Timing
      indoorStartWeeks,
      outdoorStartWeeks,
      transplantWeeks,
      harvestWeeks,
      daysToGerminate,
      daysToMaturity,
      // Growing conditions
      minGerminationTemp,
      optGerminationTemp,
      minGrowingTemp,
      maxGrowingTemp,
      sunRequirement,
      waterNeeds,
      soilPH,
      // Planting info
      spacing,
      plantingDepth,
      rowSpacing,
      plantsPerSquareFoot,
      // Companion planting
      companionPlants,
      avoidPlants,
      // Pests/diseases
      commonPests,
      commonDiseases,
      organicPestControl,
      // Harvest/storage
      harvestTips,
      storageTips,
      preservationMethods,
      notes,
      // Admin
      isApproved,
    } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await prisma.plantingGuide.findFirst({
      where: { name: { equals: name } }
    })

    if (existing) {
      return NextResponse.json({ error: 'A plant with this name already exists' }, { status: 400 })
    }

    const plant = await prisma.plantingGuide.create({
      data: {
        name,
        scientificName,
        description,
        category,
        subcategory,
        imageUrl,
        generalInfo,
        funFacts,
        variations,
        hardinessZones,
        optimalZones,
        zoneNotes,
        culinaryUses,
        recipes,
        flavorProfile,
        nutritionalInfo,
        medicinalUses,
        holisticUses,
        cautions,
        craftIdeas,
        history,
        culturalSignificance,
        indoorStartWeeks,
        outdoorStartWeeks,
        transplantWeeks,
        harvestWeeks,
        daysToGerminate,
        daysToMaturity,
        minGerminationTemp,
        optGerminationTemp,
        minGrowingTemp,
        maxGrowingTemp,
        sunRequirement,
        waterNeeds,
        soilPH,
        spacing,
        plantingDepth,
        rowSpacing,
        plantsPerSquareFoot,
        companionPlants,
        avoidPlants,
        commonPests,
        commonDiseases,
        organicPestControl,
        harvestTips,
        storageTips,
        preservationMethods,
        notes,
        isApproved: isApproved ?? true,
      }
    })

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: 'approve_plant_request',
      targetType: 'plant',
      targetId: plant.id,
      details: { name, category }
    })

    return NextResponse.json({ plant })
  } catch (error) {
    console.error('Error creating plant:', error)
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 })
  }
}
