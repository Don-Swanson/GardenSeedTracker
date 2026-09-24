import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { sanitizeText, checkRateLimit, MAX_LENGTHS } from '@/lib/validation'
import { SWAP_MESSAGE_MAX_LENGTH, isBlockedEitherWay, isThreadUnread } from '@/lib/swap'
import { notifyThreadParticipant } from '@/lib/swap-notifications'

const threadInclude = {
  listing: { select: { id: true, customPlantName: true, type: true, status: true, plantType: { select: { name: true } } } },
  initiator: { select: { id: true, username: true, name: true } },
  owner: { select: { id: true, username: true, name: true } },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
}

// GET /api/swap/threads - your inbox (as initiator or listing owner)
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const threads = await prisma.swapThread.findMany({
      where: { OR: [{ initiatorId: userId }, { ownerId: userId }] },
      include: threadInclude,
      orderBy: { lastMessageAt: 'desc' },
    })

    return NextResponse.json({
      threads: threads.map(thread => ({
        id: thread.id,
        listing: thread.listing,
        otherUser: thread.initiatorId === userId ? thread.owner : thread.initiator,
        lastMessage: thread.messages[0] || null,
        lastMessageAt: thread.lastMessageAt,
        unread: isThreadUnread(thread, userId),
      })),
    })
  } catch (error) {
    console.error('Error fetching swap threads:', error)
    return NextResponse.json({ error: 'Failed to fetch swap threads' }, { status: 500 })
  }
}

// POST /api/swap/threads - start (or continue) a conversation about a listing
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
    if (!sender?.username) {
      return NextResponse.json({ error: 'Set a username in Settings before messaging on the swap board' }, { status: 400 })
    }

    const rateLimit = checkRateLimit(`swap-message-send:${userId}`, 30, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many messages sent. Please try again later.' }, { status: 429 })
    }

    const data = await req.json()
    const listingId = sanitizeText(data.listingId, MAX_LENGTHS.name)
    const body = sanitizeText(data.message, SWAP_MESSAGE_MAX_LENGTH)
    if (!listingId || !body) {
      return NextResponse.json({ error: 'A listing and a message are required' }, { status: 400 })
    }

    const listing = await prisma.swapListing.findUnique({
      where: { id: listingId },
      select: { id: true, userId: true, status: true, customPlantName: true, plantType: { select: { name: true } } },
    })
    if (!listing || listing.status === 'hidden') {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.userId === userId) {
      return NextResponse.json({ error: "You can't message yourself about your own listing" }, { status: 400 })
    }
    if (await isBlockedEitherWay(prisma, userId, listing.userId)) {
      return NextResponse.json({ error: 'Unable to message this user' }, { status: 403 })
    }

    // One thread per (listing, initiator) - reuse it if it already exists
    // instead of erroring on the unique constraint.
    let thread = await prisma.swapThread.findUnique({
      where: { listingId_initiatorId: { listingId, initiatorId: userId } },
    })

    if (!thread) {
      if (listing.status !== 'active') {
        return NextResponse.json({ error: 'This listing is no longer active' }, { status: 400 })
      }
      // initiatorLastReadAt is set correctly by the transaction just below,
      // which always runs right after - no need to set it here too.
      thread = await prisma.swapThread.create({
        data: { listingId, initiatorId: userId, ownerId: listing.userId },
      })
    }

    // One shared timestamp for both fields - using two separate `new Date()`
    // calls here could, in rare cases, make a sender's own just-sent message
    // look "unread" to themselves if the two timestamps land a millisecond apart.
    const now = new Date()
    const [, updatedThread] = await prisma.$transaction([
      prisma.swapMessage.create({ data: { threadId: thread.id, senderId: userId, body } }),
      prisma.swapThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: now, initiatorLastReadAt: now },
      }),
    ])

    await notifyThreadParticipant({
      threadId: updatedThread.id,
      recipientId: listing.userId,
      senderUsername: sender?.username || 'a gardener',
      plantName: listing.plantType?.name || listing.customPlantName || 'plant',
    })

    return NextResponse.json({ threadId: thread.id }, { status: 201 })
  } catch (error) {
    console.error('Error sending swap message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
