import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { generateSupportEmailHtml, generateConfirmationEmailHtml } from '@/lib/support-email'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const SUPPORT_EMAIL = 'support@example.com'

/**
 * Send email using nodemailer (standard emailer)
 */
async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!IS_PRODUCTION) {
    console.log('━'.repeat(60))
    console.log('📧 SUPPORT EMAIL (DEV MODE - NOT SENT)')
    console.log('━'.repeat(60))
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Reply-To: ${replyTo || 'N/A'}`)
    console.log('━'.repeat(60))
    return
  }

  try {
    const nodemailer = require('nodemailer')
    
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_PORT === '465',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to,
      replyTo,
      subject,
      html,
    })

    console.log(`✅ Support email sent to ${to}: ${subject}`)
  } catch (error) {
    console.error(`❌ Failed to send support email to ${to}:`, error)
    throw error
  }
}

const categoryLabels: Record<string, string> = {
  bug: '🐛 Bug Report',
  feature: '💡 Feature Request',
  question: '❓ General Question',
  other: '📝 Other',
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { category, subject, message } = data

    // Validate input
    if (typeof category !== 'string' || typeof subject !== 'string' || typeof message !== 'string' || !subject.trim() || !message.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!['bug', 'feature', 'question', 'other'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (subject.length > 100) {
      return NextResponse.json({ error: 'Subject too long' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Send email notification to support
    await sendEmail(
      SUPPORT_EMAIL,
      `[${categoryLabels[category]}] ${subject}`,
      generateSupportEmailHtml({
        category: categoryLabels[category],
        subject,
        message,
        userName: session.user.name || 'Unknown',
        userEmail: session.user.email,
        userId: session.user.id,
      }),
      session.user.email // Reply-To
    )

    // Send confirmation email to user
    await sendEmail(
      session.user.email,
      `We received your support request: ${subject}`,
      generateConfirmationEmailHtml({
        userName: session.user.name || 'Gardener',
        subject,
        message,
        category: categoryLabels[category],
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Support request failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    )
  }
}
