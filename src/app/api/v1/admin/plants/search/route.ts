import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-auth'

// POST /api/v1/admin/plants/search - Advanced search
export async function POST(req: NextRequest) {
  const authResult = validateApiKey(req)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const {
      name,
      names,        // Array of names to find
      category,
      categories,   // Array of categories to filter
      search,       // Full-text search across multiple fields
      ids,          // Array of IDs to fetch
      page = 1,
      limit = 50,
      includeUnapproved = false,
      sortBy = 'name',
      sortOrder = 'asc'
    } = body

    const where: any = {}

    // ID filter
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids }
    }

    // Name filters
    if (name) {
      where.name = { contains: name }
    } else if (names && Array.isArray(names) && names.length > 0) {
      where.name = { in: names }
    }

    // Category filters
    if (category) {
      where.category = category
    } else if (categories && Array.isArray(categories) && categories.length > 0) {
      where.category = { in: categories }
    }

    // Full-text search
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { scientificName: { contains: search } },
        { description: { contains: search } },
        { generalInfo: { contains: search } }
      ]
    }

    // Approved filter
    if (!includeUnapproved) {
      where.isApproved = true
    }

    // Validate sort field
    const allowedSortFields = ['name', 'category', 'createdAt', 'updatedAt']
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'
    const finalSortOrder = sortOrder === 'desc' ? 'desc' : 'asc'

    const skip = (page - 1) * Math.min(limit, 500)

    const [plants, total] = await Promise.all([
      prisma.plantingGuide.findMany({
        where,
        orderBy: { [finalSortBy]: finalSortOrder },
        skip,
        take: Math.min(limit, 500)
      }),
      prisma.plantingGuide.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: plants,
      meta: {
        page,
        limit: Math.min(limit, 500),
        total,
        totalPages: Math.ceil(total / Math.min(limit, 500))
      }
    })
  } catch (error) {
    console.error('API Error - POST /api/v1/admin/plants/search:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search plants' },
      { status: 500 }
    )
  }
}
