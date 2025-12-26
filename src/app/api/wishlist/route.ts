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

    // Only fetch wishlist items belonging to the authenticated user
    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
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
    
    // Create wishlist item with authenticated user's ID
    const item = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id, // Secure: use authenticated user ID
        name: data.name,
        variety: data.variety,
        brand: data.brand,
        estimatedPrice: data.estimatedPrice,
        priority: data.priority || 3,
        sourceUrl: data.sourceUrl,
        notes: data.notes,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating wishlist item:', error)
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 })
  }
}
