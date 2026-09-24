import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUsernameAvailability } from '@/lib/username'

// GET /api/auth/check-username - Check if username is available
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const result = await checkUsernameAvailability(prisma, username)
    return NextResponse.json({ available: result.available, error: result.error })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 })
  }
}
