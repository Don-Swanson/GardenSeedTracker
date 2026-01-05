import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/submissions - List plant submissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const [submissions, total] = await Promise.all([
      prisma.plantRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.plantRequest.count({ where })
    ])

    // For each submission, try to find the associated PlantingGuide with full data
    const submissionsWithPlantData = await Promise.all(
      submissions.map(async (submission: typeof submissions[0]) => {
        const plantingGuide = await prisma.plantingGuide.findFirst({
          where: {
            name: submission.plantName,
            isUserSubmitted: true
          }
        })
        return {
          ...submission,
          plantingGuide
        }
      })
    )

    return NextResponse.json({
      submissions: submissionsWithPlantData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
