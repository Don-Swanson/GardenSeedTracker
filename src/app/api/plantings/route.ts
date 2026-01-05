import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only fetch plantings belonging to the authenticated user
    const plantings = await prisma.planting.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { 
        seed: true,
        plantingEvents: {
          orderBy: { date: 'desc' },
        },
      },
    })
    return NextResponse.json(plantings)
  } catch (error) {
    console.error('Error fetching plantings:', error)
    return NextResponse.json({ error: 'Failed to fetch plantings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Verify the seed belongs to this user before creating planting
    if (data.seedId) {
      const seed = await prisma.seed.findFirst({
        where: { 
          id: data.seedId,
          userId: session.user.id,
        },
      })
      if (!seed) {
        return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
      }
    }

    const planting = await prisma.planting.create({
      data: {
        seedId: data.seedId,
        userId: session.user.id, // Secure: use authenticated user ID
        locationName: data.location || data.locationName,
        locationId: data.locationId,
        quantityPlanted: data.quantityPlanted || 1,
        status: data.status || 'planted',
        notes: data.notes,
        // Create initial planting event
        plantingEvents: {
          create: {
            date: new Date(data.plantingDate),
            quantity: data.quantityPlanted || 1,
            method: data.method,
            notes: data.initialNotes,
          },
        },
      },
      include: {
        seed: true,
        plantingEvents: true,
      },
    })

    return NextResponse.json(planting, { status: 201 })
  } catch (error) {
    console.error('Error creating planting:', error)
    return NextResponse.json({ error: 'Failed to create planting' }, { status: 500 })
  }
}
