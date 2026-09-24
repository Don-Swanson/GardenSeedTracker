import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { isThreadUnread } from '@/lib/swap'

// GET /api/swap/threads/unread-count - powers the nav bar's inbox badge
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const threads = await prisma.swapThread.findMany({
      where: { OR: [{ initiatorId: userId }, { ownerId: userId }] },
      select: { initiatorId: true, ownerId: true, lastMessageAt: true, initiatorLastReadAt: true, ownerLastReadAt: true },
    })

    const count = threads.filter(thread => isThreadUnread(thread, userId)).length
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread swap thread count:', error)
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })
  }
}
