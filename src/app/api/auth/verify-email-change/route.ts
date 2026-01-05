import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/verify-email-change - Verify and complete email change
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/settings?error=invalid_token', req.url))
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailChangeToken: token,
        emailChangeExpires: { gt: new Date() },
        pendingEmail: { not: null },
      },
      select: {
        id: true,
        email: true,
        pendingEmail: true,
      }
    })

    if (!user || !user.pendingEmail) {
      return NextResponse.redirect(new URL('/settings?error=expired_token', req.url))
    }

    // Check if new email is still available
    const existingUser = await prisma.user.findUnique({
      where: { email: user.pendingEmail },
      select: { id: true }
    })

    if (existingUser) {
      // Clear pending email since it's now taken
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpires: null,
        }
      })
      return NextResponse.redirect(new URL('/settings?error=email_taken', req.url))
    }

    const oldEmail = user.email
    const newEmail = user.pendingEmail

    // Update email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpires: null,
        emailVerified: new Date(), // Mark as verified
      }
    })

    console.log(`✅ Email changed from ${oldEmail} to ${newEmail} for user ${user.id}`)

    // Redirect to settings with success message
    return NextResponse.redirect(new URL('/settings?emailChanged=true', req.url))
  } catch (error) {
    console.error('Error verifying email change:', error)
    return NextResponse.redirect(new URL('/settings?error=verification_failed', req.url))
  }
}
