import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// PATCH /api/admin/swap/listings/[id] - admin hide/unhide, independent of any report
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { action } = await req.json()

    const listing = await prisma.swapListing.findUnique({ where: { id }, select: { id: true, customPlantName: true, status: true } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const status = action === 'hide' ? 'hidden' : action === 'unhide' ? 'active' : null
    if (!status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await prisma.swapListing.update({ where: { id }, data: { status } })
    await createAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || '',
      action: action === 'hide' ? 'hide_swap_listing' : 'unhide_swap_listing',
      targetType: 'swap_listing',
      targetId: id,
      details: { name: listing.customPlantName, previousStatus: listing.status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating swap listing:', error)
    return NextResponse.json({ error: 'Failed to update swap listing' }, { status: 500 })
  }
}
