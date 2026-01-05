import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST /api/auth/change-email - Request email change (sends verification to new email)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newEmail } = await req.json()

    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = newEmail.toLowerCase().trim()

    // Check if email is same as current
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    if (currentUser?.email === normalizedEmail) {
      return NextResponse.json({ error: 'This is already your email address' }, { status: 400 })
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 400 })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save pending email change
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: normalizedEmail,
        emailChangeToken: token,
        emailChangeExpires: expires,
      }
    })

    // Send verification email to new address
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email-change?token=${token}`
    
    try {
      const nodemailer = require('nodemailer')
      
      const transport = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST || 'smtp.example.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false,
        ...(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
          ? {
              auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
              },
            }
          : {}),
      })

      await transport.sendMail({
        to: normalizedEmail,
        from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
        subject: 'Verify Your New Email - Garden Seed Tracker',
        text: `Verify Your New Email\n\nYou requested to change your email address for your Garden Seed Tracker account.\n\nClick here to verify: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't request this, you can safely ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">🌱 Garden Seed Tracker</h1>
            <h2>Verify Your New Email</h2>
            <p>You requested to change your email address for your Garden Seed Tracker account.</p>
            <p>Click the button below to verify your new email address:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verify Email
            </a>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">
              This link expires in 24 hours. If you didn't request this change, you can safely ignore this email.
            </p>
          </div>
        `,
      })

      console.log(`✅ Email change verification sent to ${normalizedEmail}`)
    } catch (emailError) {
      console.error('❌ Failed to send email change verification:', emailError)
      // In development, log the verify URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('━'.repeat(60))
        console.log('📧 EMAIL CHANGE VERIFICATION (DEV ONLY)')
        console.log('━'.repeat(60))
        console.log(`New Email: ${normalizedEmail}`)
        console.log(`Verify URL: ${verifyUrl}`)
        console.log('━'.repeat(60))
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent to your new email address. Please check your inbox.'
    })
  } catch (error) {
    console.error('Error requesting email change:', error)
    return NextResponse.json({ error: 'Failed to request email change' }, { status: 500 })
  }
}
// DELETE /api/auth/change-email - Cancel pending email change
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpires: null,
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Email change cancelled.'
    })
  } catch (error) {
    console.error('Error cancelling email change:', error)
    return NextResponse.json({ error: 'Failed to cancel email change' }, { status: 500 })
  }
}