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
    
    // Only fetch item if it belongs to the authenticated user
    const item = await prisma.wishlistItem.findFirst({
      where: { 
        id,
        userId: session.user.id, // Security: scope to user
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
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

    // Verify item belongs to user before updating
    const existing = await prisma.wishlistItem.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const item = await prisma.wishlistItem.update({
      where: { id },
      data: {
        name: data.name,
        variety: data.variety,
        brand: data.brand,
        estimatedPrice: data.estimatedPrice,
        priority: data.priority,
        sourceUrl: data.sourceUrl,
        notes: data.notes,
        purchased: data.purchased,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
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
    
    // Verify item belongs to user before deleting
    const existing = await prisma.wishlistItem.findFirst({
      where: { id, userId: session.user.id },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.wishlistItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
