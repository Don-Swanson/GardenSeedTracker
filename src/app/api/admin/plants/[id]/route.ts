import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// GET /api/admin/plants/[id] - Get single plant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const plant = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    return NextResponse.json({ plant })
  } catch (error) {
    console.error('Error fetching plant:', error)
    return NextResponse.json({ error: 'Failed to fetch plant' }, { status: 500 })
  }
}

// PUT /api/admin/plants/[id] - Update plant
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Extract all fields from body
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

    const plant = await prisma.plantingGuide.update({
      where: { id },
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
        isApproved: isApproved ?? existing.isApproved,
      }
    })

    // Log if approval status changed
    const action = existing.isApproved !== plant.isApproved 
      ? (plant.isApproved ? 'approve_plant_request' : 'reject_plant_request')
      : 'edit_plant_request'

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action,
      targetType: 'plant',
      targetId: id,
      details: { 
        name, 
        category, 
        action: 'update',
        approvalChanged: existing.isApproved !== plant.isApproved,
        newApprovalStatus: plant.isApproved
      },
      previousState: existing as any,
      newState: plant as any
    })

    return NextResponse.json({ plant })
  } catch (error) {
    console.error('Error updating plant:', error)
    return NextResponse.json({ error: 'Failed to update plant' }, { status: 500 })
  }
}

// DELETE /api/admin/plants/[id] - Delete plant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const plant = await prisma.plantingGuide.findUnique({
      where: { id }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    await prisma.plantingGuide.delete({
      where: { id }
    })

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: 'reject_plant_request',
      targetType: 'plant',
      targetId: id,
      details: { name: plant.name, action: 'delete' },
      previousState: plant as any
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plant:', error)
    return NextResponse.json({ error: 'Failed to delete plant' }, { status: 500 })
  }
}
