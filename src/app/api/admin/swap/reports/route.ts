import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/swap/reports - list swap board reports, optionally filtered by status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const where = status && status !== 'all' ? { status } : {}

    const [reports, counts] = await Promise.all([
      prisma.swapReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          reportedUser: { select: { id: true, username: true, email: true } },
          listing: { select: { id: true, customPlantName: true, status: true, plantType: { select: { name: true } } } },
          message: { select: { id: true, body: true, threadId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.swapReport.groupBy({ by: ['status'], _count: true }),
    ])

    const countsByStatus: Record<string, number> = { pending: 0, resolved: 0, dismissed: 0 }
    for (const c of counts) countsByStatus[c.status] = c._count

    return NextResponse.json({ reports, counts: countsByStatus })
  } catch (error) {
    console.error('Error fetching swap reports:', error)
    return NextResponse.json({ error: 'Failed to fetch swap reports' }, { status: 500 })
  }
}
