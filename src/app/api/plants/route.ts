import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/plants - List all plants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()
    
    const where: any = {
      isApproved: true,
    }
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      // Use case-insensitive search with mode for SQLite compatibility
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { scientificName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const plants = await prisma.plantingGuide.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
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
    
    return NextResponse.json(plants)
  } catch (error) {
    console.error('Error fetching plants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    )
  }
}
