import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin-only endpoint to grant lifetime membership
// POST /api/admin/grant-lifetime
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userEmail, userId, reason } = body

    if (!userEmail && !userId) {
      return NextResponse.json(
        { error: 'Either userEmail or userId is required' },
        { status: 400 }
      )
    }

    // Find the user to grant lifetime membership
    const targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail },
      select: { id: true, email: true, name: true, isLifetimeMember: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetUser.isLifetimeMember) {
      return NextResponse.json(
        { error: 'User is already a lifetime member' },
        { status: 400 }
      )
    }

    // Grant lifetime membership
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        isLifetimeMember: true,
        lifetimeGrantedAt: new Date(),
        lifetimeGrantedBy: session.user.id,
        isPaid: true,
        subscriptionStatus: 'lifetime',
        // Clear subscription end date since lifetime never expires
        subscriptionEndDate: null,
        autoRenew: false,
      },
    })

    console.log(
      `Lifetime membership granted to ${targetUser.email} by ${adminUser.email}. Reason: ${reason || 'Not specified'}`
    )

    return NextResponse.json({
      message: `Lifetime membership granted to ${targetUser.email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    })
  } catch (error) {
    console.error('Failed to grant lifetime membership:', error)
    return NextResponse.json(
      { error: 'Failed to grant lifetime membership' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke lifetime membership (admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userEmail, userId, reason } = body

    if (!userEmail && !userId) {
      return NextResponse.json(
        { error: 'Either userEmail or userId is required' },
        { status: 400 }
      )
    }

    // Find the user
    const targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail },
      select: { id: true, email: true, name: true, isLifetimeMember: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!targetUser.isLifetimeMember) {
      return NextResponse.json(
        { error: 'User is not a lifetime member' },
        { status: 400 }
      )
    }

    // Revoke lifetime membership
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        isLifetimeMember: false,
        lifetimeGrantedAt: null,
        lifetimeGrantedBy: null,
        isPaid: false,
        subscriptionStatus: 'expired',
      },
    })

    console.log(
      `Lifetime membership revoked from ${targetUser.email} by ${adminUser.email}. Reason: ${reason || 'Not specified'}`
    )

    return NextResponse.json({
      message: `Lifetime membership revoked from ${targetUser.email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    })
  } catch (error) {
    console.error('Failed to revoke lifetime membership:', error)
    return NextResponse.json(
      { error: 'Failed to revoke lifetime membership' },
      { status: 500 }
    )
  }
}
