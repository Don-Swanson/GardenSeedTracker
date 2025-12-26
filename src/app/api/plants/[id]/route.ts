import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/plants/[id] - Get plant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const plant = await prisma.plantingGuide.findUnique({
      where: { id },
    })
    
    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(plant)
  } catch (error) {
    console.error('Error fetching plant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    )
  }
}
