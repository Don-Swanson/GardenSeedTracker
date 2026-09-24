import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUsernameAvailability } from '@/lib/username'

// POST /api/auth/setup-profile - Set up user profile (name and username).
// Also marks the account as onboarded, whether or not a username was chosen,
// so this guided step isn't shown again (see the "Skip for now" button).
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

    let normalizedUsername: string | null = null
    if (username) {
      const result = await checkUsernameAvailability(prisma, username, { excludeUserId: session.user.id })
      if (!result.available) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      normalizedUsername = result.normalized
    }

    try {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: name.trim(),
          username: normalizedUsername,
          onboardedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          username: true,
        }
      })

      return NextResponse.json({ user })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'This username was just taken. Please choose another.' }, { status: 409 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error setting up profile:', error)
    return NextResponse.json({ error: 'Failed to set up profile' }, { status: 500 })
  }
}
