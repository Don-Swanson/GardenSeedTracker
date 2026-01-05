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
    
    // Only fetch planting if it belongs to the authenticated user
    const planting = await prisma.planting.findFirst({
      where: { 
        id,
        userId: session.user.id, // Security: scope to user
      },
      include: { 
        seed: true,
        plantingEvents: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!planting) {
      return NextResponse.json({ error: 'Planting not found' }, { status: 404 })
    }

    return NextResponse.json(planting)
  } catch (error) {
    console.error('Error fetching planting:', error)
    return NextResponse.json({ error: 'Failed to fetch planting' }, { status: 500 })
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

    // Verify planting belongs to user before updating
    const existing = await prisma.planting.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Planting not found' }, { status: 404 })
    }

    const planting = await prisma.planting.update({
      where: { id },
      data: {
        locationName: data.locationName || data.location,
        locationId: data.locationId,
        quantityPlanted: data.quantityPlanted,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
        actualYield: data.actualYield,
        status: data.status,
        notes: data.notes,
      },
      include: {
        seed: true,
        plantingEvents: {
          orderBy: { date: 'desc' },
        },
      },
    })

    return NextResponse.json(planting)
  } catch (error) {
    console.error('Error updating planting:', error)
    return NextResponse.json({ error: 'Failed to update planting' }, { status: 500 })
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
    
    // Verify planting belongs to user before deleting
    const existing = await prisma.planting.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Planting not found' }, { status: 404 })
    }

    await prisma.planting.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planting:', error)
    return NextResponse.json({ error: 'Failed to delete planting' }, { status: 500 })
  }
}
