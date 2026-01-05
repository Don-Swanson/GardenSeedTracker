import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/check-username - Check if username is available
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Check username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Username must be 3-20 characters, letters, numbers, and underscores only' 
      })
    }

    // Check reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
      'gardenseed', 'gardenseedtracker', 'system', 'root', 'null', 'undefined',
      'anonymous', 'guest', 'user', 'test', 'demo', 'api', 'www', 'app'
    ]
    
    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({ available: false, error: 'This username is reserved' })
    }

    // Check if username exists
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 })
  }
}
