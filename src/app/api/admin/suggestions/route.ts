import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/suggestions - List all suggestions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const plantId = searchParams.get('plantId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (plantId) {
      where.plantId = plantId
    }

    const [suggestions, total, pendingCount, reviewingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.plantSuggestion.findMany({
        where,
        include: {
          plant: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.plantSuggestion.count({ where }),
      prisma.plantSuggestion.count({ where: { status: 'pending' } }),
      prisma.plantSuggestion.count({ where: { status: 'reviewing' } }),
      prisma.plantSuggestion.count({ where: { status: 'approved' } }),
      prisma.plantSuggestion.count({ where: { status: 'rejected' } })
    ])

    return NextResponse.json({
      suggestions,
      counts: {
        pending: pendingCount,
        reviewing: reviewingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
