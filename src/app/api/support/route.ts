import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

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
    if (!category || !subject?.trim() || !message?.trim()) {
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

function generateSupportEmailHtml(params: {
  category: string
  subject: string
  message: string
  userName: string
  userEmail: string
  userId: string
}): string {
  const { category, subject, message, userName, userEmail, userId } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">${category}</h1>
    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">${subject}</p>
  </div>

  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Message</h2>
    <div style="white-space: pre-wrap; color: #333;">${message}</div>
  </div>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; font-size: 14px;">
    <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">User Details</h2>
    <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
    <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
    <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId}</p>
  </div>

  <p style="color: #888; font-size: 12px; margin-top: 20px; text-align: center;">
    Reply to this email to respond directly to the user.
  </p>
</body>
</html>
`
}

function generateConfirmationEmailHtml(params: {
  userName: string
  subject: string
  message: string
  category: string
}): string {
  const { userName, subject, message, category } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🌱 Garden Seed Tracker</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${userName}!</h2>
    
    <p>Thank you for contacting us. We've received your support request and will get back to you as soon as possible.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a7c23;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${category}</p>
      <h3 style="margin: 0 0 10px 0; color: #333;">${subject}</h3>
      <div style="white-space: pre-wrap; color: #666; font-size: 14px;">${message.length > 200 ? message.substring(0, 200) + '...' : message}</div>
    </div>
    
    <p style="color: #888; font-size: 14px;">
      We typically respond within 1-2 business days. If your request is urgent, please reply to this email with additional details.
    </p>
    
    <p style="color: #888; font-size: 14px; margin-top: 30px;">
      Happy gardening! 🌻
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>This is an automated confirmation email from Garden Seed Tracker.</p>
  </div>
</body>
</html>
`
}
