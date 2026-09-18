import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { popularPlantIds } from '@/lib/plant-popularity'

// GET /api/plants - List all plants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()
    const paginated = searchParams.has('page')
    const sort = searchParams.get('sort') || (paginated ? 'popular' : 'name')
    if (!['popular', 'name'].includes(sort)) return NextResponse.json({ error: 'Invalid sort' }, { status: 400 })
    const page = Math.max(1, Math.floor(Number(searchParams.get('page')) || 1))
    const limit = Math.min(100, Math.max(1, Math.floor(Number(searchParams.get('limit')) || 48)))
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || !Number.isSafeInteger((page - 1) * limit)) {
      return NextResponse.json({ error: 'Invalid pagination' }, { status: 400 })
    }
    
    const where: any = {
      isApproved: true,
    }
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      // SQLite doesn't support mode: 'insensitive', so we use LOWER() via raw contains
      // The search term is already lowercased, and SQLite's LIKE is case-insensitive by default
      where.OR = [
        { name: { contains: search } },
        { scientificName: { contains: search } },
        { commonNames: { contains: search } },
        { description: { contains: search } },
      ]
    }
    
    const ranked = sort === 'popular' ? await popularPlantIds(prisma, { search, category: category || undefined, limit, offset: (page - 1) * limit }) : null
    const rows = await prisma.plantingGuide.findMany({
      where: ranked ? { id: { in: ranked.map(row => row.id) } } : where,
      ...(ranked ? {} : { skip: (page - 1) * limit, take: limit }),
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        subcategory: true,
        scientificName: true,
        description: true,
        sunRequirement: true,
        waterNeeds: true,
        daysToMaturity: true,
        hardinessZones: true,
        optimalZones: true,
        imageUrl: true,
      },
    })
    const byId = new Map(rows.map(row => [row.id, row]))
    const plants = ranked ? ranked.map(row => byId.get(row.id)!) : rows
    
    if (!paginated) return NextResponse.json(plants)
    const [total, categories] = await Promise.all([
      prisma.plantingGuide.count({ where }),
      prisma.plantingGuide.findMany({ where: { isApproved: true }, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    ])
    return NextResponse.json({ plants, total, page, totalPages: Math.ceil(total / limit), categories: categories.map(item => item.category) })
  } catch (error) {
    console.error('Error fetching plants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    )
  }
}
