import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// DELETE /api/swap/blocks/[userId] - unblock a user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId: blockedId } = await params

    await prisma.userBlock.deleteMany({
      where: { blockerId: session.user.id, blockedId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing block:', error)
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 })
  }
}
