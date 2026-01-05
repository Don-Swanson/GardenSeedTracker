import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog, AuditAction } from '@/lib/audit'

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        username: true,
        _count: {
          select: {
            seeds: true,
            plantings: true,
            wishlistItems: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, ...data } = body

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, name: true, username: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updateData: any = {}
    let actionType = ''

    switch (action) {
      case 'makeAdmin':
        updateData = { role: 'admin' }
        actionType = 'update_user_role'
        break
      case 'removeAdmin':
        if (user.id === session.user.id) {
          return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 })
        }
        updateData = { role: 'user' }
        actionType = 'update_user_role'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: actionType as AuditAction,
      targetType: 'user',
      targetId: id,
      targetEmail: user.email,
      details: { action, role: updateData.role }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account from admin' }, { status: 400 })
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete another admin account' }, { status: 400 })
    }

    // Delete all user data
    await prisma.$transaction([
      prisma.planting.deleteMany({ where: { userId: id } }),
      prisma.seed.deleteMany({ where: { userId: id } }),
      prisma.wishlistItem.deleteMany({ where: { userId: id } }),
      prisma.plantRequest.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ])

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: 'delete_user',
      targetType: 'user',
      targetId: id,
      targetEmail: user.email,
      details: { deletedEmail: user.email }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
