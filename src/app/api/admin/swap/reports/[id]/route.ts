import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { sanitizeText, MAX_LENGTHS } from '@/lib/validation'

// PATCH /api/admin/swap/reports/[id] - resolve or dismiss a report, optionally hiding the listing
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, hideListing, adminNotes } = body

    const report = await prisma.swapReport.findUnique({
      where: { id },
      include: { listing: { select: { id: true, customPlantName: true, status: true } } },
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    let status: string
    switch (action) {
      case 'resolve':
        status = 'resolved'
        break
      case 'dismiss':
        status = 'dismissed'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await prisma.swapReport.update({
      where: { id },
      data: {
        status,
        adminNotes: sanitizeText(adminNotes, MAX_LENGTHS.mediumText),
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    })

    if (hideListing === true && report.listing) {
      await prisma.swapListing.update({ where: { id: report.listing.id }, data: { status: 'hidden' } })
      await createAuditLog({
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        action: 'hide_swap_listing',
        targetType: 'swap_listing',
        targetId: report.listing.id,
        details: { name: report.listing.customPlantName, reportId: id },
      })
    }

    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: action === 'resolve' ? 'resolve_swap_report' : 'dismiss_swap_report',
      targetType: 'swap_report',
      targetId: id,
      details: { hideListing: hideListing === true, adminNotes: adminNotes || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating swap report:', error)
    return NextResponse.json({ error: 'Failed to update swap report' }, { status: 500 })
  }
}
