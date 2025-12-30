import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { squareClient, SQUARE_LOCATION_ID, TRIAL_CONFIG } from '@/lib/square'
import { Resend } from 'resend'

// Lazily initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Cron job to handle:
// 1. Trial conversions (charge after 7 days)
// 2. Auto-renewals (charge saved cards when subscription expires)
// 
// Run daily at midnight: 0 0 * * *
//
// POST /api/cron/process-subscriptions
export async function POST(request: Request) {
  try {
    // Verify cron secret - REQUIRED for security
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

    const results = {
      trialsConverted: 0,
      trialsExpired: 0,
      renewalsProcessed: 0,
      renewalsFailed: 0,
      errors: [] as string[],
    }

    // 1. Process expired trials
    await processExpiredTrials(results)

    // 2. Process auto-renewals
    await processAutoRenewals(results)

    console.log('Subscription processing results:', results)

    return NextResponse.json({
      message: 'Subscription processing complete',
      results,
    })
  } catch (error) {
    console.error('Subscription processing failed:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

async function processExpiredTrials(results: any) {
  // Find trials that have ended
  const expiredTrials = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'trial',
      trialEndDate: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      squareCustomerId: true,
      squareCardId: true,
      subscriptionTier: true,
    },
  })

  for (const user of expiredTrials) {
    try {
      // If we have a stored card, charge it
      if (user.squareCustomerId && user.squareCardId) {
        const tierAmount = user.subscriptionTier || (TRIAL_CONFIG.autoConvertAmount / 100)
        
        // Create payment using stored card
        const { result } = await squareClient.paymentsApi.createPayment({
          sourceId: user.squareCardId,
          idempotencyKey: randomUUID(),
          amountMoney: {
            amount: BigInt(tierAmount * 100),
            currency: 'USD',
          },
          customerId: user.squareCustomerId,
          locationId: SQUARE_LOCATION_ID,
          note: `Garden Seed Tracker Pro - $${tierAmount}/year (trial conversion)`,
        })

        if (result.payment?.status === 'COMPLETED') {
          // Update user to active subscription
          const subscriptionEndDate = new Date()
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'active',
              subscriptionEndDate,
              lastPaymentAmount: tierAmount,
              lastPaymentDate: new Date(),
              trialStartDate: null,
              trialEndDate: null,
            },
          })

          // Send confirmation email
          await sendTrialConversionEmail(user, tierAmount)
          results.trialsConverted++
          console.log(`Trial converted for user ${user.email} at $${tierAmount}/year`)
        } else {
          throw new Error('Payment not completed')
        }
      } else {
        // No card on file - expire the trial
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isPaid: false,
            subscriptionStatus: 'expired',
            trialStartDate: null,
            trialEndDate: null,
          },
        })

        await sendTrialExpiredEmail(user)
        results.trialsExpired++
        console.log(`Trial expired for user ${user.email} (no card on file)`)
      }
    } catch (error: any) {
      results.errors.push(`Trial conversion failed for ${user.email}: ${error.message}`)
      console.error(`Trial conversion failed for ${user.email}:`, error)

      // Mark trial as expired on payment failure
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPaid: false,
          subscriptionStatus: 'expired',
          trialStartDate: null,
          trialEndDate: null,
        },
      })
    }
  }
}

async function processAutoRenewals(results: any) {
  // Find subscriptions that have expired and have auto-renew enabled
  const expiredSubscriptions = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'active',
      autoRenew: true,
      isLifetimeMember: false,
      subscriptionEndDate: {
        lte: new Date(),
      },
      squareCardId: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      squareCustomerId: true,
      squareCardId: true,
      subscriptionTier: true,
    },
  })

  for (const user of expiredSubscriptions) {
    try {
      const tierAmount = user.subscriptionTier || 5

      // Create payment using stored card
      const { result } = await squareClient.paymentsApi.createPayment({
        sourceId: user.squareCardId!,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(tierAmount * 100),
          currency: 'USD',
        },
        customerId: user.squareCustomerId!,
        locationId: SQUARE_LOCATION_ID,
        note: `Garden Seed Tracker Pro - $${tierAmount}/year (auto-renewal)`,
      })

      if (result.payment?.status === 'COMPLETED') {
        // Extend subscription by 1 year
        const subscriptionEndDate = new Date()
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionEndDate,
            lastPaymentAmount: tierAmount,
            lastPaymentDate: new Date(),
            renewalReminderSent: false,
          },
        })

        await sendRenewalSuccessEmail(user, tierAmount)
        results.renewalsProcessed++
        console.log(`Auto-renewal successful for user ${user.email} at $${tierAmount}/year`)
      } else {
        throw new Error('Payment not completed')
      }
    } catch (error: any) {
      results.renewalsFailed++
      results.errors.push(`Renewal failed for ${user.email}: ${error.message}`)
      console.error(`Renewal failed for ${user.email}:`, error)

      // Mark subscription as expired
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPaid: false,
          subscriptionStatus: 'expired',
        },
      })

      await sendRenewalFailedEmail(user)
    }
  }
}

async function sendTrialConversionEmail(user: any, amount: number) {
  if (!user.email) return
  const emailClient = getResendClient()
  if (!emailClient) return

  try {
    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: user.email,
      subject: '🌱 Your Garden Seed Tracker Pro subscription is now active!',
      html: `
        <h1>Welcome to Pro!</h1>
        <p>Hi ${user.name || 'Gardener'},</p>
        <p>Your free trial has ended and your Pro subscription is now active at <strong>$${amount}/year</strong>.</p>
        <p>You now have full access to all Pro features:</p>
        <ul>
          <li>Planting calendar & log</li>
          <li>Garden almanac</li>
          <li>Companion planting guides</li>
          <li>Data export</li>
          <li>And more!</li>
        </ul>
        <p>Thank you for supporting Garden Seed Tracker! 🌻</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send trial conversion email:', error)
  }
}

async function sendTrialExpiredEmail(user: any) {
  if (!user.email) return
  const emailClient = getResendClient()
  if (!emailClient) return

  try {
    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: user.email,
      subject: '🌱 Your Garden Seed Tracker trial has ended',
      html: `
        <h1>Trial Ended</h1>
        <p>Hi ${user.name || 'Gardener'},</p>
        <p>Your 7-day free trial has ended. We couldn't process your payment automatically.</p>
        <p>To continue using Pro features, please subscribe at:</p>
        <p><a href="${process.env.NEXTAUTH_URL}/upgrade">Subscribe Now</a></p>
        <p>Your seed inventory and wishlist are still available with the free plan!</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send trial expired email:', error)
  }
}

async function sendRenewalSuccessEmail(user: any, amount: number) {
  if (!user.email) return
  const emailClient = getResendClient()
  if (!emailClient) return

  try {
    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: user.email,
      subject: '🌱 Your Garden Seed Tracker subscription has been renewed',
      html: `
        <h1>Subscription Renewed!</h1>
        <p>Hi ${user.name || 'Gardener'},</p>
        <p>Your Pro subscription has been automatically renewed for another year at <strong>$${amount}</strong>.</p>
        <p>Thank you for your continued support! 🌻</p>
        <p>Manage your subscription: <a href="${process.env.NEXTAUTH_URL}/settings">Settings</a></p>
      `,
    })
  } catch (error) {
    console.error('Failed to send renewal success email:', error)
  }
}

async function sendRenewalFailedEmail(user: any) {
  if (!user.email) return
  const emailClient = getResendClient()
  if (!emailClient) return

  try {
    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: user.email,
      subject: '⚠️ Garden Seed Tracker renewal failed',
      html: `
        <h1>Renewal Payment Failed</h1>
        <p>Hi ${user.name || 'Gardener'},</p>
        <p>We couldn't process your subscription renewal. Your Pro access has been paused.</p>
        <p>Please update your payment method to continue:</p>
        <p><a href="${process.env.NEXTAUTH_URL}/upgrade">Update Payment</a></p>
        <p>Your data is safe - just renew to regain access to Pro features!</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send renewal failed email:', error)
  }
}
