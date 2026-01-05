import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-auth'
import { createAuditLog } from '@/lib/audit'

/**
 * Admin API for Plant Database Management
 * 
 * Authentication: API Key via Authorization header
 *   Authorization: Bearer YOUR_ADMIN_API_KEY
 * 
 * Endpoints:
 *   GET    /api/v1/admin/plants         - List all plants (with pagination)
 *   POST   /api/v1/admin/plants         - Create a new plant
 *   GET    /api/v1/admin/plants/:id     - Get a single plant
 *   PUT    /api/v1/admin/plants/:id     - Update a plant
 *   DELETE /api/v1/admin/plants/:id     - Delete a plant
 *   POST   /api/v1/admin/plants/bulk    - Bulk create/update plants
 */

// GET /api/v1/admin/plants - List plants with filtering and pagination
export async function GET(req: NextRequest) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const skip = (page - 1) * limit
    const includeUnapproved = searchParams.get('include_unapproved') === 'true'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { scientificName: { contains: search } },
        { category: { contains: search } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (!includeUnapproved) {
      where.isApproved = true
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
      success: true,
      data: plants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        categories: categories.map((c: { category: string | null }) => c.category).filter(Boolean)
      }
    })
  } catch (error) {
    console.error('API Error - GET /api/v1/admin/plants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plants' },
      { status: 500 }
    )
  }
}

// POST /api/v1/admin/plants - Create a new plant
export async function POST(req: NextRequest) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const body = await req.json()
    
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

    // Check for duplicate name
    const existing = await prisma.plantingGuide.findFirst({
      where: { name: { equals: body.name } }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A plant with this name already exists', existingId: existing.id },
        { status: 409 }
      )
    }

    const plant = await prisma.plantingGuide.create({
      data: buildPlantData(body)
    })

    await createAuditLog({
      adminId: 'api',
      adminEmail: 'api@system',
      action: 'create_plant_via_api',
      targetType: 'plant',
      targetId: plant.id,
      details: { name: body.name, category: body.category }
    })

    return NextResponse.json({
      success: true,
      data: plant
    }, { status: 201 })
  } catch (error) {
    console.error('API Error - POST /api/v1/admin/plants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create plant' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/admin/plants - Bulk operations
export async function PATCH(req: NextRequest) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const { operation, plants } = body

    if (!operation || !plants || !Array.isArray(plants)) {
      return NextResponse.json(
        { success: false, error: 'operation and plants array are required' },
        { status: 400 }
      )
    }

    const results: { success: string[]; failed: { name: string; error: string }[] } = {
      success: [],
      failed: []
    }

    if (operation === 'upsert') {
      // Bulk upsert - create or update plants
      for (const plantData of plants) {
        try {
          if (!plantData.name || !plantData.category) {
            results.failed.push({ name: plantData.name || 'unknown', error: 'name and category are required' })
            continue
          }

          const existing = await prisma.plantingGuide.findFirst({
            where: { name: { equals: plantData.name } }
          })

          if (existing) {
            await prisma.plantingGuide.update({
              where: { id: existing.id },
              data: buildPlantData(plantData)
            })
            results.success.push(`Updated: ${plantData.name}`)
          } else {
            await prisma.plantingGuide.create({
              data: buildPlantData(plantData)
            })
            results.success.push(`Created: ${plantData.name}`)
          }
        } catch (err: any) {
          results.failed.push({ name: plantData.name || 'unknown', error: err.message })
        }
      }

      await createAuditLog({
        adminId: 'api',
        adminEmail: 'api@system',
        action: 'bulk_upsert_plants_via_api',
        targetType: 'plant',
        targetId: 'bulk',
        details: { 
          successCount: results.success.length, 
          failedCount: results.failed.length 
        }
      })
    } else if (operation === 'delete') {
      // Bulk delete by IDs
      for (const item of plants) {
        try {
          const id = typeof item === 'string' ? item : item.id
          if (!id) {
            results.failed.push({ name: 'unknown', error: 'id is required for delete' })
            continue
          }

          await prisma.plantingGuide.delete({
            where: { id }
          })
          results.success.push(`Deleted: ${id}`)
        } catch (err: any) {
          results.failed.push({ name: typeof item === 'string' ? item : item.id || 'unknown', error: err.message })
        }
      }

      await createAuditLog({
        adminId: 'api',
        adminEmail: 'api@system',
        action: 'bulk_delete_plants_via_api',
        targetType: 'plant',
        targetId: 'bulk',
        details: { 
          successCount: results.success.length, 
          failedCount: results.failed.length 
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown operation: ${operation}. Supported: upsert, delete` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('API Error - PATCH /api/v1/admin/plants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
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
