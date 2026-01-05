import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

// Add a new planting event to an existing planting
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: plantingId } = await params
    const data = await request.json()

    // Verify planting exists and belongs to the authenticated user
    const planting = await prisma.planting.findFirst({
      where: { 
        id: plantingId,
        userId: session.user.id, // Security: scope to user
      },
    })

    if (!planting) {
      return NextResponse.json({ error: 'Planting not found' }, { status: 404 })
    }

    const event = await prisma.plantingEvent.create({
      data: {
        plantingId,
        date: new Date(data.date),
        quantity: data.quantity,
        method: data.method,
        notes: data.notes,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating planting event:', error)
    return NextResponse.json({ error: 'Failed to create planting event' }, { status: 500 })
  }
}

// Get all events for a planting
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

    const { id: plantingId } = await params

    // Verify planting belongs to user before fetching events
    const planting = await prisma.planting.findFirst({
      where: { 
        id: plantingId,
        userId: session.user.id, // Security: scope to user
      },
    })

    if (!planting) {
      return NextResponse.json({ error: 'Planting not found' }, { status: 404 })
    }

    const events = await prisma.plantingEvent.findMany({
      where: { plantingId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching planting events:', error)
    return NextResponse.json({ error: 'Failed to fetch planting events' }, { status: 500 })
  }
}
