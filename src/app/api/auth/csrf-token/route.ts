import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateCsrfToken } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

// GET /api/auth/csrf-token - Get a CSRF token for the current session
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the user's active session from the database
    const dbSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
        expires: { gt: new Date() },
      },
      orderBy: { expires: 'desc' },
    })
    
    if (!dbSession) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }
    
    // Get or create CSRF token for this session
    const csrfToken = await getOrCreateCsrfToken(dbSession.id)
    
    return NextResponse.json({
      csrfToken,
      expiresIn: '24h',
    })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
