import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkUsernameAvailability } from '@/lib/username'

// Store signup data (name, username) temporarily for a new user
// This data will be applied when the user clicks the magic link
export async function POST(req: NextRequest) {
  try {
    const { email, name, username } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Opportunistic cleanup: expired signup attempts should never block a
    // later signup (including one reusing the same username or email).
    await prisma.signupData.deleteMany({ where: { expiresAt: { lt: new Date() } } })

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

    let normalizedUsername: string | null = null
    if (username) {
      // Exclude our own pending row so re-submitting the form (e.g. changing
      // your name) doesn't get rejected for "taking" the username you already reserved.
      const result = await checkUsernameAvailability(prisma, username, { excludeSignupEmail: normalizedEmail })
      if (!result.available) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      normalizedUsername = result.normalized
    }

    try {
      // Store the signup data temporarily; applied when the magic link is clicked.
      await prisma.signupData.upsert({
        where: { email: normalizedEmail },
        update: {
          name: name.trim(),
          username: normalizedUsername,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        create: {
          email: normalizedEmail,
          name: name.trim(),
          username: normalizedUsername,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
    } catch (error) {
      // Someone else reserved the same username in the race window between
      // our availability check above and this write.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'This username was just taken. Please choose another.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing signup data:', error)
    return NextResponse.json({ error: 'Failed to process signup' }, { status: 500 })
  }
}
