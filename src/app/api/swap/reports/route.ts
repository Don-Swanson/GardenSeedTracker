import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { sanitizeText, checkRateLimit, MAX_LENGTHS } from '@/lib/validation'
import { notifyAdmins } from '@/lib/admin-notifications'

// POST /api/swap/reports - report a listing and/or a message
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`swap-report-create:${session.user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many reports filed. Please try again later.' }, { status: 429 })
    }

    const data = await req.json()
    const listingId = sanitizeText(data.listingId, MAX_LENGTHS.name)
    const messageId = sanitizeText(data.messageId, MAX_LENGTHS.name)
    const reason = sanitizeText(data.reason, MAX_LENGTHS.mediumText)

    if (!listingId && !messageId) {
      return NextResponse.json({ error: 'A listing or message must be specified' }, { status: 400 })
    }
    if (!reason) {
      return NextResponse.json({ error: 'A reason is required' }, { status: 400 })
    }

    let reportedUserId: string | null = null

    if (listingId) {
      const listing = await prisma.swapListing.findUnique({ where: { id: listingId }, select: { userId: true } })
      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
      reportedUserId = listing.userId
    }

    if (messageId) {
      const message = await prisma.swapMessage.findUnique({
        where: { id: messageId },
        select: { senderId: true, thread: { select: { initiatorId: true, ownerId: true } } },
      })
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }
      // Only a participant in the thread can report one of its messages.
      const isParticipant = message.thread.initiatorId === session.user.id || message.thread.ownerId === session.user.id
      if (!isParticipant) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }
      reportedUserId = message.senderId
    }

    const report = await prisma.swapReport.create({
      data: {
        reporterId: session.user.id,
        listingId,
        messageId,
        reportedUserId,
        reason,
      },
    })

    notifyAdmins('newSwapReport', {
      userEmail: session.user.email || undefined,
      additionalInfo: { reason },
    }).catch(err => console.error('Failed to notify admins of swap report:', err))

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating swap report:', error)
    return NextResponse.json({ error: 'Failed to file report' }, { status: 500 })
  }
}
