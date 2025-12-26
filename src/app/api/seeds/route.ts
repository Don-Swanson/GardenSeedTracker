import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only fetch seeds belonging to the authenticated user
    const seeds = await prisma.seed.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        plantings: true,
        plantType: true,
      },
    })
    return NextResponse.json(seeds)
  } catch (error) {
    console.error('Error fetching seeds:', error)
    return NextResponse.json({ error: 'Failed to fetch seeds' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Create seed with authenticated user's ID
    const seed = await prisma.seed.create({
      data: {
        userId: session.user.id, // Secure: use authenticated user ID
        nickname: data.nickname,
        variety: data.variety,
        brand: data.brand,
        quantity: data.quantity || 1,
        quantityUnit: data.quantityUnit || 'seeds',
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        daysToGerminate: data.daysToGerminate,
        daysToMaturity: data.daysToMaturity,
        sunRequirement: data.sunRequirement,
        waterNeeds: data.waterNeeds,
        spacing: data.spacing,
        plantingDepth: data.plantingDepth,
        plantTypeId: data.plantTypeId,
        customPlantName: data.customPlantName,
        customCategory: data.customCategory,
        notes: data.notes,
        imageUrl: data.imageUrl,
        lotNumber: data.lotNumber,
        source: data.source,
      },
      include: {
        plantType: true,
      },
    })

    return NextResponse.json(seed, { status: 201 })
  } catch (error) {
    console.error('Error creating seed:', error)
    return NextResponse.json({ error: 'Failed to create seed' }, { status: 500 })
  }
}
