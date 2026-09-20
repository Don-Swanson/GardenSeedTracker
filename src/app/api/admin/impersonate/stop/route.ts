import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { cookies } from 'next/headers'
import { readImpersonationCookie } from '@/lib/impersonation'

// POST /api/admin/impersonate/stop - Stop impersonating a user
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const cookieStore = await cookies()
    const impersonationData = cookieStore.get('impersonation')
    
    if (!impersonationData) {
      return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 })
    }

    const targetId = readImpersonationCookie(impersonationData.value, session.user.id)
    if (!targetId) {
      cookieStore.delete('impersonation')
      cookieStore.delete('admin_session')
      return NextResponse.json({ success: true })
    }

    // Log the end of impersonation
    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: 'impersonate_end',
      targetType: 'user',
      targetId,
      details: { 
        action: 'impersonation_ended',
      }
    })

    // Clear impersonation cookies
    cookieStore.delete('impersonation')
    cookieStore.delete('admin_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 })
  }
}
