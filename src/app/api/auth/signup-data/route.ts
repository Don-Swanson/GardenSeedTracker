import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Store signup data (name, username) temporarily for a new user
// This data will be applied when the user clicks the magic link
export async function POST(req: NextRequest) {
  try {
    const { email, name, username } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, { status: 400 })
    }

    // If username is provided, validate and check availability
    if (username) {
      const normalizedUsername = username.toLowerCase().trim()
      
      // Validate format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (!usernameRegex.test(normalizedUsername)) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
      }

      // Check reserved usernames
      const reservedUsernames = [
        'admin', 'administrator', 'root', 'system', 'support', 'help',
        'gardenseed', 'gardenseedtracker', 'staff', 'moderator', 'mod',
        'official', 'team', 'api', 'www', 'mail', 'email', 'info',
        'contact', 'null', 'undefined', 'anonymous', 'guest', 'user'
      ]
      
      if (reservedUsernames.includes(normalizedUsername)) {
        return NextResponse.json({ error: 'This username is reserved' }, { status: 400 })
      }

      // Check if username is taken
      const existingUsername = await prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true }
      })

      if (existingUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
    }

    // Store the signup data in a temporary table or use existing approach
    // We'll use the SignupData model to store this temporarily
    await prisma.signupData.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name.trim(),
        username: username?.toLowerCase().trim() || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      create: {
        email: normalizedEmail,
        name: name.trim(),
        username: username?.toLowerCase().trim() || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing signup data:', error)
    return NextResponse.json({ error: 'Failed to process signup' }, { status: 500 })
  }
}
