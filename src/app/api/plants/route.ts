import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { popularPlantIds } from '@/lib/plant-popularity'
import { parsePlantFilters, plantFilterSql } from '@/lib/plant-filters'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// GET /api/plants - List all plants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()
    const filters = parsePlantFilters(searchParams)
    const paginated = searchParams.has('page')
    const sort = searchParams.get('sort') || (paginated ? 'popular' : 'name')
    if (!['popular', 'name'].includes(sort)) return NextResponse.json({ error: 'Invalid sort' }, { status: 400 })
    const page = Math.max(1, Math.floor(Number(searchParams.get('page')) || 1))
    const limit = Math.min(100, Math.max(1, Math.floor(Number(searchParams.get('limit')) || 48)))
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || !Number.isSafeInteger((page - 1) * limit)) {
      return NextResponse.json({ error: 'Invalid pagination' }, { status: 400 })
    }
    
    const options = { ...filters, search, category: category || undefined, limit, offset: (page - 1) * limit, sort }
    const ranked = await popularPlantIds(prisma, options)
    const rows = await prisma.plantingGuide.findMany({
      where: { id: { in: ranked.map(row => row.id) } },
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
    const plants = ranked.map(row => byId.get(row.id)!)
    
    if (!paginated) return NextResponse.json(plants)
    const [counts, categories] = await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT COUNT(*) AS total FROM PlantingGuide p WHERE ${plantFilterSql(options)}`),
      prisma.plantingGuide.findMany({ where: { isApproved: true }, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    ])
    const total = Number(counts[0].total)
    return NextResponse.json({ plants, total, page, totalPages: Math.ceil(total / limit), categories: categories.map(item => item.category) })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid plant filters' }, { status: 400 })
    console.error('Error fetching plants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    )
  }
}
