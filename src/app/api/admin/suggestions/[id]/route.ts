import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// GET /api/admin/suggestions/[id] - Get a single suggestion
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const suggestion = await prisma.plantSuggestion.findUnique({
      where: { id },
      include: {
        plant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Error fetching suggestion:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestion' }, { status: 500 })
  }
}

// PATCH /api/admin/suggestions/[id] - Update suggestion status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, adminNotes } = body

    const suggestion = await prisma.plantSuggestion.findUnique({
      where: { id },
      include: {
        plant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    let newStatus: string
    let auditAction: 'approve_suggestion' | 'reject_suggestion'

    switch (action) {
      case 'approve':
        newStatus = 'approved'
        auditAction = 'approve_suggestion'
        break
      case 'reject':
        newStatus = 'rejected'
        auditAction = 'reject_suggestion'
        break
      case 'review':
        newStatus = 'reviewing'
        // No audit log for just marking as reviewing
        await prisma.plantSuggestion.update({
          where: { id },
          data: { status: 'reviewing' }
        })
        return NextResponse.json({ success: true })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await prisma.plantSuggestion.update({
      where: { id },
      data: {
        status: newStatus,
        adminNotes: adminNotes || null,
        reviewedById: session.user.id,
        reviewedAt: new Date()
      }
    })

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: auditAction,
      targetType: 'suggestion',
      targetId: id,
      targetEmail: suggestion.userEmail,
      details: {
        plantId: suggestion.plantId,
        plantName: suggestion.plant.name,
        section: suggestion.section,
        suggestionType: suggestion.suggestionType,
        adminNotes: adminNotes || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating suggestion:', error)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
  }
}

// DELETE /api/admin/suggestions/[id] - Delete a suggestion
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const suggestion = await prisma.plantSuggestion.findUnique({
      where: { id }
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    await prisma.plantSuggestion.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting suggestion:', error)
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 })
  }
}
