import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { sanitizeText, checkRateLimit } from '@/lib/validation'
import { SWAP_MESSAGE_MAX_LENGTH } from '@/lib/swap'
import { notifyThreadParticipant } from '@/lib/swap-notifications'

// POST /api/swap/threads/[id]/messages - reply in an existing conversation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { id: threadId } = await params

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
    if (!sender?.username) {
      return NextResponse.json({ error: 'Set a username in Settings before messaging on the swap board' }, { status: 400 })
    }

    const rateLimit = checkRateLimit(`swap-message-send:${userId}`, 30, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many messages sent. Please try again later.' }, { status: 429 })
    }

    const thread = await prisma.swapThread.findUnique({
      where: { id: threadId },
      include: { listing: { select: { customPlantName: true, plantType: { select: { name: true } } } } },
    })
    if (!thread || (thread.initiatorId !== userId && thread.ownerId !== userId)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const data = await req.json()
    const body = sanitizeText(data.message, SWAP_MESSAGE_MAX_LENGTH)
    if (!body) {
      return NextResponse.json({ error: 'A message is required' }, { status: 400 })
    }

    const isInitiator = thread.initiatorId === userId
    const recipientId = isInitiator ? thread.ownerId : thread.initiatorId

    // One shared timestamp - see the note in /api/swap/threads about why
    // this shouldn't be two separate `new Date()` calls.
    const now = new Date()
    const [message] = await prisma.$transaction([
      prisma.swapMessage.create({ data: { threadId, senderId: userId, body } }),
      prisma.swapThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: now,
          ...(isInitiator ? { initiatorLastReadAt: now } : { ownerLastReadAt: now }),
        },
      }),
    ])

    await notifyThreadParticipant({
      threadId,
      recipientId,
      senderUsername: sender?.username || 'a gardener',
      plantName: thread.listing.plantType?.name || thread.listing.customPlantName || 'plant',
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending swap reply:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
