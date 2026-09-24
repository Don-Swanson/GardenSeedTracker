import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog, AuditAction } from '@/lib/audit'
import { checkUsernameAvailability } from '@/lib/username'
import { sanitizeEmail, MAX_LENGTHS } from '@/lib/validation'

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
    let actionType: AuditAction = 'update_user_role'
    let auditDetails: Record<string, unknown> = { action }
    let responseUser: { id: string; name: string | null; username: string | null; email: string } | undefined

    switch (action) {
      case 'makeAdmin':
        updateData = { role: 'admin' }
        auditDetails.role = updateData.role
        break
      case 'removeAdmin':
        if (user.id === session.user.id) {
          return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 })
        }
        updateData = { role: 'user' }
        auditDetails.role = updateData.role
        break
      case 'updateDetails': {
        // Plain trim (not sanitizeString's HTML-entity encoding) - names are
        // rendered through React elsewhere, which already escapes them.
        const rawName = typeof data.name === 'string' ? data.name.trim() : ''
        if (rawName.length > MAX_LENGTHS.name) {
          return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
        }
        const name = rawName || null

        let normalizedUsername: string | null = null
        if (data.username) {
          const result = await checkUsernameAvailability(prisma, data.username, { excludeUserId: id })
          if (!result.available) {
            return NextResponse.json({ error: result.error }, { status: 400 })
          }
          normalizedUsername = result.normalized
        }

        const email = sanitizeEmail(data.email)
        if (!email) {
          return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
        }
        if (email !== user.email) {
          const existingEmail = await prisma.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } })
          if (existingEmail) {
            return NextResponse.json({ error: 'Another account already uses this email' }, { status: 400 })
          }
        }

        updateData = { name, username: normalizedUsername, email }
        actionType = 'update_user_details'
        auditDetails = {
          action,
          previousName: user.name,
          previousUsername: user.username,
          previousEmail: user.email,
          name,
          username: normalizedUsername,
          email,
        }
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    try {
      responseUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, username: true, email: true },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'That username or email is already in use' }, { status: 409 })
      }
      throw error
    }

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: actionType,
      targetType: 'user',
      targetId: id,
      targetEmail: responseUser.email,
      details: auditDetails
    })

    return NextResponse.json({ success: true, user: responseUser })
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
