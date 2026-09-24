import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { sanitizeText, validateEnum, MAX_LENGTHS } from '@/lib/validation'
import { SWAP_QUANTITY_MAX_LENGTH } from '@/lib/swap'

const EDITABLE_STATUSES = ['active', 'completed', 'closed'] as const

// GET /api/swap/listings/[id] - listing detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const listing = await prisma.swapListing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, name: true, lastActiveAt: true } },
        plantType: { select: { id: true, name: true, category: true } },
      },
    })

    // Hidden (moderated) or missing listings look the same to non-owners,
    // so a reporter can't use 404-vs-200 to confirm a takedown happened.
    const isOwner = listing?.userId === session.user.id
    if (!listing || (listing.status === 'hidden' && !isOwner)) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching swap listing:', error)
    return NextResponse.json({ error: 'Failed to fetch swap listing' }, { status: 500 })
  }
}

// PATCH /api/swap/listings/[id] - owner-only edit or status change
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.swapListing.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const data = await req.json()
    const update: Record<string, unknown> = {}

    if (data.status !== undefined) {
      update.status = validateEnum(data.status, EDITABLE_STATUSES, existing.status as typeof EDITABLE_STATUSES[number])
    }
    if (data.description !== undefined) update.description = sanitizeText(data.description, MAX_LENGTHS.mediumText)
    if (data.variety !== undefined) update.variety = sanitizeText(data.variety, MAX_LENGTHS.name)
    if (data.quantity !== undefined) update.quantity = sanitizeText(data.quantity, SWAP_QUANTITY_MAX_LENGTH)
    if (data.shippingOk !== undefined) update.shippingOk = data.shippingOk === true
    if (data.localPickupOk !== undefined) update.localPickupOk = data.localPickupOk !== false

    const listing = await prisma.swapListing.update({ where: { id }, data: update })
    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating swap listing:', error)
    return NextResponse.json({ error: 'Failed to update swap listing' }, { status: 500 })
  }
}

// DELETE /api/swap/listings/[id] - owner-only removal
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.swapListing.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    await prisma.swapListing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting swap listing:', error)
    return NextResponse.json({ error: 'Failed to delete swap listing' }, { status: 500 })
  }
}
