import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/admin/impersonate/status - Check current impersonation status
// Note: This endpoint is accessible to check if we're in an impersonation session
// even when viewing as a non-admin user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ impersonating: false })
    }

    const cookieStore = await cookies()
    const impersonationData = cookieStore.get('impersonation')
    const adminSession = cookieStore.get('admin_session')
    
    if (impersonationData) {
      try {
        const data = JSON.parse(impersonationData.value)
        // Verify that the current session user matches either the admin or the impersonated user
        // This allows checking status while impersonating
        if (data.adminId === session.user.id || data.user?.id === session.user.id || adminSession) {
          return NextResponse.json({
            impersonating: true,
            user: data.user,
            adminId: data.adminId
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
