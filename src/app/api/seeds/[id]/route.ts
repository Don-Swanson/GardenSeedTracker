import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Only fetch seed if it belongs to the authenticated user
    const seed = await prisma.seed.findFirst({
      where: { 
        id,
        userId: session.user.id, // Security: scope to user
      },
      include: { 
        plantings: true,
        plantType: true,
      },
    })

    if (!seed) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    return NextResponse.json(seed)
  } catch (error) {
    console.error('Error fetching seed:', error)
    return NextResponse.json({ error: 'Failed to fetch seed' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Verify seed belongs to user before updating
    const existing = await prisma.seed.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    const seed = await prisma.seed.update({
      where: { id },
      data: {
        nickname: data.nickname,
        variety: data.variety,
        brand: data.brand,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        daysToGerminate: data.daysToGerminate,
        daysToMaturity: data.daysToMaturity,
        sunRequirement: data.sunRequirement,
        waterNeeds: data.waterNeeds,
        spacing: data.spacing,
        plantingDepth: data.plantingDepth,
        plantTypeId: data.plantTypeId,
        customPlantName: data.customPlantName,
        customCategory: data.customCategory,
        notes: data.notes,
        imageUrl: data.imageUrl,
        lotNumber: data.lotNumber,
        source: data.source,
        isArchived: data.isArchived,
      },
      include: { plantType: true },
    })

    return NextResponse.json(seed)
  } catch (error) {
    console.error('Error updating seed:', error)
    return NextResponse.json({ error: 'Failed to update seed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Verify seed belongs to user before deleting
    const existing = await prisma.seed.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    await prisma.seed.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting seed:', error)
    return NextResponse.json({ error: 'Failed to delete seed' }, { status: 500 })
  }
}
