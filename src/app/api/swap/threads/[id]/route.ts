import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// GET /api/swap/threads/[id] - conversation detail; marks it read for the caller
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { id } = await params

    const thread = await prisma.swapThread.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, customPlantName: true, type: true, status: true, plantType: { select: { name: true } } } },
        initiator: { select: { id: true, username: true, name: true, lastActiveAt: true } },
        owner: { select: { id: true, username: true, name: true, lastActiveAt: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!thread || (thread.initiatorId !== userId && thread.ownerId !== userId)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const isInitiator = thread.initiatorId === userId
    await prisma.swapThread.update({
      where: { id },
      data: isInitiator ? { initiatorLastReadAt: new Date() } : { ownerLastReadAt: new Date() },
    })

    return NextResponse.json({
      id: thread.id,
      listing: thread.listing,
      otherUser: isInitiator ? thread.owner : thread.initiator,
      messages: thread.messages,
    })
  } catch (error) {
    console.error('Error fetching swap thread:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}
