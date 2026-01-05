import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/auth/setup-profile - Set up user profile (name and username)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, username } = await req.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (!usernameRegex.test(username)) {
        return NextResponse.json({ 
          error: 'Username must be 3-20 characters, letters, numbers, and underscores only' 
        }, { status: 400 })
      }

      // Check reserved usernames
      const reservedUsernames = [
        'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
        'gardenseed', 'gardenseedtracker', 'system', 'root', 'null', 'undefined',
        'anonymous', 'guest', 'user', 'test', 'demo', 'api', 'www', 'app'
      ]
      
      if (reservedUsernames.includes(username.toLowerCase())) {
        return NextResponse.json({ error: 'This username is reserved' }, { status: 400 })
      }

      // Check if username is taken (by another user)
      const existing = await prisma.user.findFirst({
        where: { 
          username: username.toLowerCase(),
          NOT: { id: session.user.id }
        },
        select: { id: true }
      })

      if (existing) {
        return NextResponse.json({ error: 'This username is already taken' }, { status: 400 })
      }
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        username: username ? username.toLowerCase().trim() : null,
      },
      select: {
        id: true,
        name: true,
        username: true,
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error setting up profile:', error)
    return NextResponse.json({ error: 'Failed to set up profile' }, { status: 500 })
  }
}
