import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/subscription/cancel - Cancel subscription (disable auto-renew)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isLifetimeMember: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't cancel a lifetime membership
    if (user.isLifetimeMember) {
      return NextResponse.json(
        { error: 'Lifetime memberships cannot be cancelled' },
        { status: 400 }
      )
    }

    // Update to disable auto-renew and set status to canceling
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        autoRenew: false,
        subscriptionStatus: 'canceling',
      },
    })

    // Calculate when access ends
    const accessEndsAt = user.subscriptionEndDate
      ? new Date(user.subscriptionEndDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'end of current period'

    return NextResponse.json({
      message: `Your subscription has been cancelled. You will continue to have access to paid features until ${accessEndsAt}.`,
      subscriptionEndDate: user.subscriptionEndDate,
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
