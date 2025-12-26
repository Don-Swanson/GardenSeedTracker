import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Types of data that can be removed
type DataType = 'plantings' | 'seeds' | 'wishlist' | 'images' | 'locations' | 'pro-data' | 'all'

// Admin-only endpoint to remove user data
// POST /api/admin/remove-user-data
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
    const { userEmail, userId, dataTypes, reason } = body as {
      userEmail?: string
      userId?: string
      dataTypes: DataType[]
      reason: string
    }

    if (!userEmail && !userId) {
      return NextResponse.json(
        { error: 'Either userEmail or userId is required' },
        { status: 400 }
      )
    }

    if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
      return NextResponse.json(
        { error: 'dataTypes array is required' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required for audit purposes' },
        { status: 400 }
      )
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail },
      select: { id: true, email: true, name: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Track what was deleted
    const deletedCounts: Record<string, number> = {}

    // Helper to check if a type should be deleted
    const shouldDelete = (type: DataType) => 
      dataTypes.includes(type) || dataTypes.includes('all') || dataTypes.includes('pro-data')

    // Delete plantings and their events
    if (shouldDelete('plantings') || dataTypes.includes('all')) {
      // First delete planting events
      const plantingEvents = await prisma.plantingEvent.deleteMany({
        where: {
          planting: {
            userId: targetUser.id,
          },
        },
      })
      deletedCounts['plantingEvents'] = plantingEvents.count

      // Then delete plantings
      const plantings = await prisma.planting.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['plantings'] = plantings.count
    }

    // Delete garden locations
    if (shouldDelete('locations') || dataTypes.includes('all')) {
      const locations = await prisma.gardenLocation.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['gardenLocations'] = locations.count
    }

    // Delete seeds (only if explicitly requested or 'all')
    if (dataTypes.includes('seeds') || dataTypes.includes('all')) {
      const seeds = await prisma.seed.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['seeds'] = seeds.count
    }

    // Delete wishlist items (only if explicitly requested or 'all')
    if (dataTypes.includes('wishlist') || dataTypes.includes('all')) {
      const wishlist = await prisma.wishlistItem.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['wishlistItems'] = wishlist.count
    }

    // Delete user settings
    if (dataTypes.includes('all')) {
      const settings = await prisma.userSettings.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['settings'] = settings.count
    }

    // Delete plant requests
    if (shouldDelete('pro-data') || dataTypes.includes('all')) {
      const requests = await prisma.plantRequest.deleteMany({
        where: { userId: targetUser.id },
      })
      deletedCounts['plantRequests'] = requests.count
    }

    // Log the action
    console.log(
      `[ADMIN ACTION] Data removed for user ${targetUser.email} by ${adminUser.email}. ` +
      `Types: ${dataTypes.join(', ')}. Reason: ${reason}. ` +
      `Counts: ${JSON.stringify(deletedCounts)}`
    )

    return NextResponse.json({
      message: `Successfully removed data for ${targetUser.email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
      deletedCounts,
      removedBy: adminUser.email,
      reason,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to remove user data:', error)
    return NextResponse.json(
      { error: 'Failed to remove user data' },
      { status: 500 }
    )
  }
}

// GET - List users with expired subscriptions (for admin review)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const expiredMonths = parseInt(url.searchParams.get('expiredMonths') || '12')

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - expiredMonths)

    // Find users with expired subscriptions older than cutoff
    const expiredUsers = await prisma.user.findMany({
      where: {
        isPaid: false,
        isLifetimeMember: false,
        subscriptionStatus: { in: ['expired', 'cancelled', 'canceling'] },
        subscriptionEndDate: {
          lt: cutoffDate,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionEndDate: true,
        subscriptionStatus: true,
        lastPaymentDate: true,
        _count: {
          select: {
            seeds: true,
            plantings: true,
            wishlistItems: true,
            gardenLocations: true,
          },
        },
      },
      orderBy: {
        subscriptionEndDate: 'asc',
      },
    })

    return NextResponse.json({
      cutoffDate: cutoffDate.toISOString(),
      expiredMonths,
      count: expiredUsers.length,
      users: expiredUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionEndDate: user.subscriptionEndDate,
        subscriptionStatus: user.subscriptionStatus,
        lastPaymentDate: user.lastPaymentDate,
        dataCounts: user._count,
        daysSinceExpiry: user.subscriptionEndDate 
          ? Math.floor((Date.now() - new Date(user.subscriptionEndDate).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    })
  } catch (error) {
    console.error('Failed to list expired users:', error)
    return NextResponse.json(
      { error: 'Failed to list expired users' },
      { status: 500 }
    )
  }
}
