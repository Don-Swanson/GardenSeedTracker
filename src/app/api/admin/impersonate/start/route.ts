import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// POST /api/admin/impersonate/start - Start impersonating a user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot impersonate other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 400 })
    }

    // Generate impersonation token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Store impersonation data in a secure cookie
    const impersonationData = {
      adminId: session.user.id,
      adminEmail: session.user.email,
      user: targetUser,
      token,
      startedAt: new Date().toISOString()
    }

    const cookieStore = await cookies()
    
    // Save the admin's original session info
    cookieStore.set('admin_session', JSON.stringify({
      adminId: session.user.id,
      adminEmail: session.user.email
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour max impersonation
    })
    
    cookieStore.set('impersonation', JSON.stringify(impersonationData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour max impersonation
    })

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: 'impersonate_start',
      targetType: 'user',
      targetId: userId,
      targetEmail: targetUser.email,
      details: { 
        action: 'impersonation_started',
        token: token.substring(0, 8) + '...'
      }
    })

    return NextResponse.json({ 
      success: true, 
      token,
      user: targetUser
    })
  } catch (error) {
    console.error('Error starting impersonation:', error)
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 })
  }
}
