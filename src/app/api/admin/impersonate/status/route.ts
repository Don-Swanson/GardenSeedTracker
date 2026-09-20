import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { readImpersonationCookie } from '@/lib/impersonation'

// GET /api/admin/impersonate/status - Check current impersonation status
// Note: This endpoint is accessible to check if we're in an impersonation session
// even when viewing as a non-admin user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ impersonating: false })
    }

    const cookieStore = await cookies()
    const impersonationData = cookieStore.get('impersonation')
    
    if (impersonationData) {
      try {
        const userId = readImpersonationCookie(impersonationData.value, session.user.id)
        const user = userId ? await prisma.user.findUnique({
          where: { id: userId }, select: { id: true, name: true, email: true, role: true },
        }) : null
        if (user && user.role !== 'admin') {
          return NextResponse.json({
            impersonating: true,
            user,
            adminId: session.user.id
          })
        }
      } catch {
        return NextResponse.json({ impersonating: false })
      }
    }

    return NextResponse.json({ impersonating: false })
  } catch (error) {
    console.error('Error checking impersonation status:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
