import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

// Helper to verify event ownership through planting
async function verifyEventOwnership(eventId: string, userId: string) {
  const event = await prisma.plantingEvent.findUnique({
    where: { id: eventId },
    include: {
      planting: {
        select: { userId: true },
      },
    },
  })
  
  if (!event || event.planting.userId !== userId) {
    return null
  }
  
  return event
}

// Update a specific planting event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const data = await request.json()

    // Verify event belongs to user's planting
    const existing = await verifyEventOwnership(eventId, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Planting event not found' }, { status: 404 })
    }

    const event = await prisma.plantingEvent.update({
      where: { id: eventId },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        quantity: data.quantity,
        method: data.method,
        notes: data.notes,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating planting event:', error)
    return NextResponse.json({ error: 'Failed to update planting event' }, { status: 500 })
  }
}

// Delete a specific planting event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Verify event belongs to user's planting
    const existing = await verifyEventOwnership(eventId, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Planting event not found' }, { status: 404 })
    }

    await prisma.plantingEvent.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planting event:', error)
    return NextResponse.json({ error: 'Failed to delete planting event' }, { status: 500 })
  }
}

// Get a specific planting event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Verify event belongs to user's planting
    const event = await verifyEventOwnership(eventId, session.user.id)
    if (!event) {
      return NextResponse.json({ error: 'Planting event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching planting event:', error)
    return NextResponse.json({ error: 'Failed to fetch planting event' }, { status: 500 })
  }
}
