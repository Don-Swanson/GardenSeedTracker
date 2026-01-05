import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// GET /api/admin/submissions/[id] - Get single submission
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

    const submission = await prisma.plantRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// PATCH /api/admin/submissions/[id] - Update submission (approve/reject)
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

    const submission = await prisma.plantRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // First, check if there's an unapproved plant submission with this name
      const unapprovedPlant = await prisma.plantingGuide.findFirst({
        where: { 
          name: submission.plantName,
          isApproved: false,
          isUserSubmitted: true
        }
      })

      let plant

      if (unapprovedPlant) {
        // Approve the existing unapproved plant
        plant = await prisma.plantingGuide.update({
          where: { id: unapprovedPlant.id },
          data: { isApproved: true }
        })
      } else {
        // Check if an approved plant with this name already exists
        const existingApproved = await prisma.plantingGuide.findFirst({
          where: { name: submission.plantName, isApproved: true }
        })

        if (existingApproved) {
          return NextResponse.json({ 
            error: `A plant named "${submission.plantName}" already exists in the encyclopedia. You can reject this submission or edit the name first.` 
          }, { status: 409 })
        }

        // Create a new plant from the submission (fallback)
        plant = await prisma.plantingGuide.create({
          data: {
            name: submission.plantName,
            description: submission.description || 'No description provided',
            category: submission.category || 'Other',
            isUserSubmitted: true,
            isApproved: true,
            submittedById: submission.userId
          }
        })
      }

      // Update the submission
      await prisma.plantRequest.update({
        where: { id },
        data: {
          status: 'approved',
          adminNotes
        }
      })

      await createAuditLog({
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        action: 'approve_plant_request',
        targetType: 'plant_request',
        targetId: id,
        targetEmail: submission.user?.email,
        details: { plantName: submission.plantName, plantId: plant.id, adminNotes }
      })

      return NextResponse.json({ success: true, plant })
    } else if (action === 'reject') {
      // Delete the associated unapproved PlantingGuide if it exists
      const unapprovedPlant = await prisma.plantingGuide.findFirst({
        where: { 
          name: submission.plantName,
          isApproved: false,
          isUserSubmitted: true
        }
      })

      if (unapprovedPlant) {
        await prisma.plantingGuide.delete({
          where: { id: unapprovedPlant.id }
        })
      }

      // Update the PlantRequest status
      await prisma.plantRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNotes
        }
      })

      await createAuditLog({
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        action: 'reject_plant_request',
        targetType: 'plant_request',
        targetId: id,
        targetEmail: submission.user?.email,
        details: { plantName: submission.plantName, adminNotes }
      })

      return NextResponse.json({ success: true })
    } else if (action === 'update') {
      // Admin editing the submission before approval
      const { 
        name, plantName, category, scientificName, description, reason, additionalInfo, sourceUrl,
        generalInfo, funFacts, variations, hardinessZones,
        culinaryUses, medicinalUses, holisticUses, craftIdeas,
        history, culturalSignificance,
        sunRequirement, waterNeeds, daysToMaturity, spacing, plantingDepth,
        companionPlants, avoidPlants, notes,
        plantingGuideId
      } = body
      
      // Use 'name' if provided, otherwise 'plantName'
      const newName = name || plantName
      const oldPlantName = submission.plantName
      
      // Update the PlantRequest
      await prisma.plantRequest.update({
        where: { id },
        data: {
          ...(newName !== undefined && { plantName: newName }),
          ...(category !== undefined && { category }),
          ...(scientificName !== undefined && { scientificName }),
          ...(description !== undefined && { description }),
          ...(reason !== undefined && { reason }),
          ...(additionalInfo !== undefined && { additionalInfo }),
          ...(sourceUrl !== undefined && { sourceUrl }),
          ...(adminNotes !== undefined && { adminNotes })
        }
      })

      // Also update the associated PlantingGuide if it exists
      // First try by ID if provided, then by name
      let unapprovedPlant = null
      if (plantingGuideId) {
        unapprovedPlant = await prisma.plantingGuide.findFirst({
          where: { 
            id: plantingGuideId,
            isApproved: false,
            isUserSubmitted: true
          }
        })
      }
      if (!unapprovedPlant) {
        unapprovedPlant = await prisma.plantingGuide.findFirst({
          where: { 
            name: oldPlantName,
            isApproved: false,
            isUserSubmitted: true
          }
        })
      }

      if (unapprovedPlant) {
        // Convert comma-separated strings to JSON arrays for storage
        const toJsonArray = (val: string | undefined | null): string | undefined => {
          if (val === undefined) return undefined
          if (!val || val.trim() === '') return null as unknown as string
          const items = val.split(',').map(s => s.trim()).filter(s => s)
          return JSON.stringify(items)
        }

        await prisma.plantingGuide.update({
          where: { id: unapprovedPlant.id },
          data: {
            ...(newName !== undefined && { name: newName }),
            ...(category !== undefined && { category }),
            ...(scientificName !== undefined && { scientificName }),
            ...(description !== undefined && { description }),
            ...(generalInfo !== undefined && { generalInfo }),
            ...(funFacts !== undefined && { funFacts: toJsonArray(funFacts) }),
            ...(variations !== undefined && { variations: toJsonArray(variations) }),
            ...(hardinessZones !== undefined && { hardinessZones: toJsonArray(hardinessZones) }),
            ...(culinaryUses !== undefined && { culinaryUses }),
            ...(medicinalUses !== undefined && { medicinalUses }),
            ...(holisticUses !== undefined && { holisticUses }),
            ...(craftIdeas !== undefined && { craftIdeas }),
            ...(history !== undefined && { history }),
            ...(culturalSignificance !== undefined && { culturalSignificance }),
            ...(sunRequirement !== undefined && { sunRequirement }),
            ...(waterNeeds !== undefined && { waterNeeds }),
            ...(daysToMaturity !== undefined && { daysToMaturity: daysToMaturity ? parseInt(daysToMaturity) : null }),
            ...(spacing !== undefined && { spacing }),
            ...(plantingDepth !== undefined && { plantingDepth }),
            ...(companionPlants !== undefined && { companionPlants }),
            ...(avoidPlants !== undefined && { avoidPlants }),
            ...(notes !== undefined && { notes })
          }
        })
      }

      await createAuditLog({
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        action: 'edit_plant_request',
        targetType: 'plant_request',
        targetId: id,
        targetEmail: submission.user?.email,
        details: { plantName: plantName || submission.plantName }
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
