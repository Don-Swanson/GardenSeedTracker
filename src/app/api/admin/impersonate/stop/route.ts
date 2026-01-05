import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { cookies } from 'next/headers'

// POST /api/admin/impersonate/stop - Stop impersonating a user
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    const cookieStore = await cookies()
    const impersonationData = cookieStore.get('impersonation')
    const adminSession = cookieStore.get('admin_session')
    
    if (!impersonationData) {
      return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 })
    }

    let impersonation
    try {
      impersonation = JSON.parse(impersonationData.value)
    } catch {
      cookieStore.delete('impersonation')
      return NextResponse.json({ error: 'Invalid impersonation data' }, { status: 400 })
    }

    // Log the end of impersonation
    await createAuditLog({
      adminId: impersonation.adminId,
      adminEmail: impersonation.adminEmail || '',
      action: 'impersonate_end',
      targetType: 'user',
      targetId: impersonation.user.id,
      targetEmail: impersonation.user.email,
      details: { 
        action: 'impersonation_ended',
        duration: Math.round((Date.now() - new Date(impersonation.startedAt).getTime()) / 1000) + ' seconds'
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
