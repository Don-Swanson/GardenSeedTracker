import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queryAuditLogs, AuditAction } from '@/lib/audit'

// GET /api/admin/audit-logs - Query admin audit logs
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId') || undefined
    const targetId = searchParams.get('targetId') || undefined
    const targetEmail = searchParams.get('targetEmail') || undefined
    const action = searchParams.get('action') as AuditAction | undefined
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit')!) 
      : 50
    const offset = searchParams.get('offset') 
      ? parseInt(searchParams.get('offset')!) 
      : 0

    // Query audit logs
    const result = await queryAuditLogs({
      adminId,
      targetId,
      targetEmail,
      action,
      startDate,
      endDate,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
