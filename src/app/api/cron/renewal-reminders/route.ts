import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDaysUntilExpiry, PRICING } from '@/lib/subscription'
import { Resend } from 'resend'

// Lazily initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Cron job endpoint to send renewal reminder emails
// This should be called daily by your cron service (e.g., Vercel Cron, GitHub Actions, etc.)
// 
// To secure this endpoint, you can:
// 1. Use a CRON_SECRET environment variable
// 2. Use Vercel's built-in cron authentication
// 3. Restrict to specific IP addresses
//
// POST /api/cron/renewal-reminders
export async function POST(request: Request) {
  try {
    // Verify cron secret for security - REQUIRED
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // SECURITY: Cron secret is required - reject if not configured
    if (!cronSecret) {
      console.error('SECURITY ERROR: CRON_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find users who need renewal reminders:
    // - Have active subscription
    // - Not lifetime members
    // - Haven't received a reminder yet
    // - Subscription expires within 7 days
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const usersNeedingReminder = await prisma.user.findMany({
      where: {
        isPaid: true,
        isLifetimeMember: false,
        renewalReminderSent: false,
        subscriptionEndDate: {
          lte: sevenDaysFromNow,
          gt: new Date(), // Not already expired
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionEndDate: true,
        autoRenew: true,
      },
    })

    console.log(`Found ${usersNeedingReminder.length} users needing renewal reminders`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const user of usersNeedingReminder) {
      if (!user.email) continue

      const daysLeft = getDaysUntilExpiry(user.subscriptionEndDate)
      const expiryDate = user.subscriptionEndDate
        ? new Date(user.subscriptionEndDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'soon'

      try {
        // Send the reminder email
        const emailClient = getResendClient()
        if (!emailClient) {
          console.error('Resend API key not configured, skipping email')
          continue
        }
        await emailClient.emails.send({
          from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
          to: user.email,
          subject: `🌱 Your Garden Seed Tracker subscription expires in ${daysLeft} days`,
          html: generateRenewalEmailHtml({
            name: user.name || 'Gardener',
            expiryDate,
            daysLeft: daysLeft || 7,
            autoRenew: user.autoRenew,
            renewUrl: `${process.env.NEXTAUTH_URL}/upgrade`,
            settingsUrl: `${process.env.NEXTAUTH_URL}/settings`,
          }),
        })

        // Mark reminder as sent
        await prisma.user.update({
          where: { id: user.id },
          data: { renewalReminderSent: true },
        })

        results.sent++
        console.log(`Renewal reminder sent to ${user.email}`)
      } catch (emailError) {
        results.failed++
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error'
        results.errors.push(`Failed to send to ${user.email}: ${errorMsg}`)
        console.error(`Failed to send renewal reminder to ${user.email}:`, emailError)
      }
    }

    return NextResponse.json({
      message: `Processed ${usersNeedingReminder.length} users`,
      results,
    })
  } catch (error) {
    console.error('Renewal reminder cron failed:', error)
    return NextResponse.json(
      { error: 'Failed to process renewal reminders' },
      { status: 500 }
    )
  }
}

// Generate the HTML email content
function generateRenewalEmailHtml(params: {
  name: string
  expiryDate: string
  daysLeft: number
  autoRenew: boolean
  renewUrl: string
  settingsUrl: string
}): string {
  const { name, expiryDate, daysLeft, autoRenew, renewUrl, settingsUrl } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Renewal Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌱 Garden Seed Tracker</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${name}!</h2>
    
    <p>Your Garden Seed Tracker subscription will expire on <strong>${expiryDate}</strong> (in ${daysLeft} days).</p>
    
    ${
      autoRenew
        ? `
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #2e7d32;">
        <strong>✓ Auto-renewal is enabled</strong><br>
        Your subscription will automatically renew. No action needed!
      </p>
    </div>
    <p>If you'd like to make changes or cancel, visit your <a href="${settingsUrl}" style="color: #4a7c23;">settings page</a>.</p>
    `
        : `
    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #e65100;">
        <strong>⚠️ Auto-renewal is disabled</strong><br>
        To keep your paid features, please renew your subscription.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${renewUrl}" style="background: #4a7c23; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Renew Now - Starting at $${PRICING.tiers[0].amount}/year
      </a>
    </div>
    `
    }
    
    <h3 style="color: #2d5016;">What you'll lose without a subscription:</h3>
    <ul style="color: #666;">
      <li>Planting calendar with custom dates</li>
      <li>Garden almanac & companion planting guides</li>
      <li>Image uploads for seeds and plantings</li>
      <li>Data export (CSV/PDF)</li>
      <li>Garden location management</li>
    </ul>
    
    <p style="color: #888; font-size: 14px; margin-top: 30px;">
      Thank you for being part of our gardening community! 🌻
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>
      You're receiving this because you have an active subscription to Garden Seed Tracker.<br>
      <a href="${settingsUrl}" style="color: #4a7c23;">Manage your subscription preferences</a>
    </p>
  </div>
</body>
</html>
`
}
