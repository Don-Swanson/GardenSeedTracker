import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-auth'
import { createAuditLog } from '@/lib/audit'

// GET /api/v1/admin/plants/[id] - Get a single plant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params

    const plant = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!plant) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: plant
    })
  } catch (error) {
    console.error('API Error - GET /api/v1/admin/plants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plant' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/admin/plants/[id] - Update a plant (full replacement)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    if (!body.category) {
      return NextResponse.json(
        { success: false, error: 'category is required' },
        { status: 400 }
      )
    }

    // Check if new name conflicts with existing plant (excluding current)
    if (body.name !== existing.name) {
      const nameConflict = await prisma.plantingGuide.findFirst({
        where: { 
          name: { equals: body.name },
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'A plant with this name already exists' },
          { status: 409 }
        )
      }
    }

    const plant = await prisma.plantingGuide.update({
      where: { id },
      data: buildPlantData(body)
    })

    await createAuditLog({
      adminId: 'api',
      adminEmail: 'api@system',
      action: 'update_plant_via_api',
      targetType: 'plant',
      targetId: id,
      details: { name: body.name, category: body.category }
    })

    return NextResponse.json({
      success: true,
      data: plant
    })
  } catch (error) {
    console.error('API Error - PUT /api/v1/admin/plants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/admin/plants/[id] - Partial update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing plant (excluding current)
    if (body.name && body.name !== existing.name) {
      const nameConflict = await prisma.plantingGuide.findFirst({
        where: { 
          name: { equals: body.name },
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'A plant with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Only update provided fields
    const updateData: any = {}
    const allowedFields = [
      'name', 'scientificName', 'description', 'category', 'subcategory', 'imageUrl',
      'generalInfo', 'funFacts', 'variations',
      'hardinessZones', 'optimalZones', 'zoneNotes',
      'culinaryUses', 'recipes', 'flavorProfile', 'nutritionalInfo',
      'medicinalUses', 'holisticUses', 'cautions',
      'craftIdeas', 'history', 'culturalSignificance',
      'indoorStartWeeks', 'outdoorStartWeeks', 'transplantWeeks', 'harvestWeeks',
      'daysToGerminate', 'daysToMaturity',
      'minGerminationTemp', 'optGerminationTemp', 'minGrowingTemp', 'maxGrowingTemp',
      'sunRequirement', 'waterNeeds', 'soilPH',
      'spacing', 'plantingDepth', 'rowSpacing', 'plantsPerSquareFoot',
      'companionPlants', 'avoidPlants',
      'commonPests', 'commonDiseases', 'organicPestControl',
      'harvestTips', 'storageTips', 'preservationMethods',
      'notes', 'isApproved', 'isUserSubmitted'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const plant = await prisma.plantingGuide.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      adminId: 'api',
      adminEmail: 'api@system',
      action: 'patch_plant_via_api',
      targetType: 'plant',
      targetId: id,
      details: { updatedFields: Object.keys(updateData) }
    })

    return NextResponse.json({
      success: true,
      data: plant
    })
  } catch (error) {
    console.error('API Error - PATCH /api/v1/admin/plants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/admin/plants/[id] - Delete a plant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params

    const existing = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      )
    }

    await prisma.plantingGuide.delete({
      where: { id }
    })

    await createAuditLog({
      adminId: 'api',
      adminEmail: 'api@system',
      action: 'delete_plant_via_api',
      targetType: 'plant',
      targetId: id,
      details: { name: existing.name, category: existing.category }
    })

    return NextResponse.json({
      success: true,
      message: 'Plant deleted successfully'
    })
  } catch (error) {
    console.error('API Error - DELETE /api/v1/admin/plants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete plant' },
      { status: 500 }
    )
  }
}

/**
 * Helper to build plant data object from request body
 */
function buildPlantData(body: any) {
  return {
    name: body.name,
    scientificName: body.scientificName || null,
    description: body.description || null,
    category: body.category,
    subcategory: body.subcategory || null,
    imageUrl: body.imageUrl || null,
    // Detailed info
    generalInfo: body.generalInfo || null,
    funFacts: body.funFacts || null,
    variations: body.variations || null,
    // Zones
    hardinessZones: body.hardinessZones || null,
    optimalZones: body.optimalZones || null,
    zoneNotes: body.zoneNotes || null,
    // Culinary
    culinaryUses: body.culinaryUses || null,
    recipes: body.recipes || null,
    flavorProfile: body.flavorProfile || null,
    nutritionalInfo: body.nutritionalInfo || null,
    // Medicinal/holistic
    medicinalUses: body.medicinalUses || null,
    holisticUses: body.holisticUses || null,
    cautions: body.cautions || null,
    // Craft
    craftIdeas: body.craftIdeas || null,
    // Historical
    history: body.history || null,
    culturalSignificance: body.culturalSignificance || null,
    // Timing
    indoorStartWeeks: body.indoorStartWeeks ?? null,
    outdoorStartWeeks: body.outdoorStartWeeks ?? null,
    transplantWeeks: body.transplantWeeks ?? null,
    harvestWeeks: body.harvestWeeks ?? null,
    daysToGerminate: body.daysToGerminate ?? null,
    daysToMaturity: body.daysToMaturity ?? null,
    // Growing conditions
    minGerminationTemp: body.minGerminationTemp ?? null,
    optGerminationTemp: body.optGerminationTemp ?? null,
    minGrowingTemp: body.minGrowingTemp ?? null,
    maxGrowingTemp: body.maxGrowingTemp ?? null,
    sunRequirement: body.sunRequirement || null,
    waterNeeds: body.waterNeeds || null,
    soilPH: body.soilPH || null,
    // Planting info
    spacing: body.spacing || null,
    plantingDepth: body.plantingDepth || null,
    rowSpacing: body.rowSpacing || null,
    plantsPerSquareFoot: body.plantsPerSquareFoot ?? null,
    // Companion planting
    companionPlants: body.companionPlants || null,
    avoidPlants: body.avoidPlants || null,
    // Pests/diseases
    commonPests: body.commonPests || null,
    commonDiseases: body.commonDiseases || null,
    organicPestControl: body.organicPestControl || null,
    // Harvest/storage
    harvestTips: body.harvestTips || null,
    storageTips: body.storageTips || null,
    preservationMethods: body.preservationMethods || null,
    notes: body.notes || null,
    // Admin
    isApproved: body.isApproved ?? true,
    isUserSubmitted: body.isUserSubmitted ?? false,
  }
}
