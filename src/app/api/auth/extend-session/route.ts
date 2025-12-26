import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// Extend session duration when user chooses "remember me"
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { remember } = await request.json()
    
    if (!remember) {
      return NextResponse.json({ 
        success: true, 
        message: 'Session will expire in 1 day',
      })
    }

    // Calculate new session expiry (1 year from now)
    const expiresAt = new Date(Date.now() + ONE_YEAR_MS)

    // Update the session in the database
    const updated = await prisma.session.updateMany({
      where: { userId: session.user.id },
      data: { expires: expiresAt },
    })

    if (updated.count === 0) {
      return NextResponse.json({ 
        error: 'No active session found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      expiresAt: expiresAt.toISOString(),
      duration: '1 year',
      message: 'Session extended to 1 year',
    })
  } catch (error) {
    console.error('Session extension error:', error)
    return NextResponse.json(
      { error: 'Failed to extend session' },
      { status: 500 }
    )
  }
}
