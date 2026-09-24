import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { sanitizeText, MAX_LENGTHS } from '@/lib/validation'

// GET /api/swap/blocks - list who you've blocked
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: session.user.id },
      include: { blocked: { select: { id: true, username: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 })
  }
}

// POST /api/swap/blocks - block a user (body: { userId })
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const blockedId = sanitizeText(data.userId, MAX_LENGTHS.name)
    if (!blockedId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    if (blockedId === session.user.id) {
      return NextResponse.json({ error: "You can't block yourself" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const block = await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
      update: {},
      create: { blockerId: session.user.id, blockedId },
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    console.error('Error creating block:', error)
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
  }
}
