import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasActiveSubscription, getDaysUntilExpiry } from '@/lib/subscription'

// GET /api/subscription - Get current subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isPaid: true,
        isLifetimeMember: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        subscriptionTier: true,
        autoRenew: true,
        lifetimeGrantedAt: true,
        trialStartDate: true,
        trialEndDate: true,
        trialUsed: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isActive = hasActiveSubscription({
      isPaid: user.isPaid,
      isLifetimeMember: user.isLifetimeMember,
      subscriptionStatus: user.subscriptionStatus || '',
      subscriptionEndDate: user.subscriptionEndDate,
      autoRenew: user.autoRenew,
    })

    const daysUntilExpiry = user.isLifetimeMember
      ? null
      : getDaysUntilExpiry(user.subscriptionEndDate)

    // Calculate days left in trial
    const daysLeftInTrial = user.trialEndDate
      ? getDaysUntilExpiry(user.trialEndDate)
      : null

    return NextResponse.json({
      isActive,
      isPaid: user.isPaid,
      isLifetimeMember: user.isLifetimeMember,
      subscriptionStatus: user.isLifetimeMember ? 'lifetime' : user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionTier: user.subscriptionTier,
      autoRenew: user.autoRenew,
      daysUntilExpiry,
      lifetimeGrantedAt: user.lifetimeGrantedAt,
      trialEndDate: user.trialEndDate,
      daysLeftInTrial,
      trialUsed: user.trialUsed,
    })
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

// PATCH /api/subscription - Update subscription settings (renewal reminders toggle)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { autoRenew } = body

    if (typeof autoRenew !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid autoRenew value' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { autoRenew },
      select: {
        autoRenew: true,
      },
    })

    return NextResponse.json({
      message: autoRenew
        ? 'Renewal reminders enabled. We\'ll email you a week before your subscription expires.'
        : 'Renewal reminders disabled. You won\'t receive reminder emails.',
      autoRenew: user.autoRenew,
    })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
