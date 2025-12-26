import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { TRIAL_CONFIG } from '@/lib/square'

const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!

function verifySquareSignature(body: string, signature: string): boolean {
  if (!SQUARE_WEBHOOK_SIGNATURE_KEY) {
    console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not set - rejecting webhook for security')
    return false // Never skip verification in production
  }

  try {
    const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY)
    hmac.update(body)
    const expectedSignature = hmac.digest('base64')
    
    // Use constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = headers()
  const signature = headersList.get('x-square-hmacsha256-signature') || ''

  // Verify webhook signature
  if (!verifySquareSignature(body, signature)) {
    console.error('Invalid Square webhook signature')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  let event: any

  try {
    event = JSON.parse(body)
  } catch (err) {
    console.error('Failed to parse webhook body:', err)
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  try {
    const eventType = event.type

    switch (eventType) {
      case 'payment.completed': {
        await handlePaymentCompleted(event.data.object.payment)
        break
      }

      case 'order.completed': {
        await handleOrderCompleted(event.data.object.order)
        break
      }

      case 'order.fulfilled': {
        await handleOrderFulfilled(event.data.object.order_fulfilled)
        break
      }

      case 'payment.updated': {
        await handlePaymentUpdated(event.data.object.payment)
        break
      }

      case 'subscription.created':
      case 'subscription.updated': {
        await handleSubscriptionEvent(event.data.object)
        break
      }

      default:
        console.log(`Unhandled Square event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleOrderCompleted(order: any) {
  const orderId = order.id
  const customerId = order.customer_id
  const metadata = order.metadata || {}

  console.log('Order completed:', orderId, 'Metadata:', metadata)

  // Find user
  let user = await prisma.user.findFirst({
    where: { squareCustomerId: customerId },
  })

  if (!user && metadata.userId) {
    user = await prisma.user.findUnique({
      where: { id: metadata.userId },
    })
  }

  if (!user) {
    console.error('No user found for order:', orderId)
    return
  }

  // Check if this is a trial signup
  if (metadata.subscriptionType === 'trial') {
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_CONFIG.durationDays)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPaid: true,
        subscriptionStatus: 'trial',
        trialStartDate: new Date(),
        trialEndDate,
        trialUsed: true,
        subscriptionTier: TRIAL_CONFIG.autoConvertAmount / 100, // Will convert to $5/year
        autoRenew: true,
        renewalReminderSent: false,
      },
    })

    console.log(`User ${user.id} started ${TRIAL_CONFIG.durationDays}-day trial`)
    return
  }

  // Regular subscription payment
  const tierAmount = metadata.tierAmount ? parseInt(metadata.tierAmount) : 5
  const subscriptionEndDate = new Date()
  subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

  // Get total paid from order
  const totalPaid = order.total_money?.amount ? Number(order.total_money.amount) / 100 : tierAmount

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPaid: true,
      subscriptionStatus: 'active',
      subscriptionEndDate,
      subscriptionTier: tierAmount,
      squareSubscriptionId: orderId,
      lastPaymentAmount: totalPaid,
      lastPaymentDate: new Date(),
      autoRenew: true,
      renewalReminderSent: false,
      // Clear trial fields if converting from trial
      trialStartDate: null,
      trialEndDate: null,
    },
  })

  console.log(`User ${user.id} subscribed at $${tierAmount}/year tier`)
}

async function handlePaymentCompleted(payment: any) {
  const orderId = payment.order_id
  const customerId = payment.customer_id
  const amountPaid = payment.amount_money?.amount // in cents

  if (!orderId) {
    console.error('No order_id in payment')
    return
  }

  // Find user by Square customer ID
  let user = await prisma.user.findFirst({
    where: { squareCustomerId: customerId },
  })

  // If not found by customer ID, try to find by order metadata
  if (!user && payment.note) {
    const userIdMatch = payment.note.match(/userId:(\w+)/)
    if (userIdMatch) {
      user = await prisma.user.findUnique({
        where: { id: userIdMatch[1] },
      })
    }
  }

  if (!user) {
    console.error('No user found for payment:', payment.id)
    return
  }

  // Store card ID if present (for future auto-renewals)
  const cardId = payment.card_details?.card?.id

  // Calculate subscription end date (1 year from now)
  const subscriptionEndDate = new Date()
  subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)

  // Determine tier from payment amount
  const tierAmount = amountPaid ? Math.round(Number(amountPaid) / 100) : 5

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPaid: true,
      subscriptionStatus: 'active',
      squareSubscriptionId: orderId,
      squareCardId: cardId || undefined,
      subscriptionEndDate,
      subscriptionTier: tierAmount,
      lastPaymentAmount: amountPaid ? Number(amountPaid) / 100 : null,
      lastPaymentDate: new Date(),
      renewalReminderSent: false,
      autoRenew: true,
      // Clear trial dates on successful payment
      trialStartDate: null,
      trialEndDate: null,
    },
  })

  console.log(`User ${user.id} upgraded to Pro at $${tierAmount}/year (paid $${amountPaid ? Number(amountPaid) / 100 : 'unknown'})`)
}

async function handleSubscriptionEvent(subscription: any) {
  // Handle Square Subscription API events
  const customerId = subscription.customer_id
  const status = subscription.status // ACTIVE, CANCELED, PAUSED, etc.

  if (!customerId) return

  const user = await prisma.user.findFirst({
    where: { squareCustomerId: customerId },
  })

  if (!user) {
    console.error('No user found for subscription event')
    return
  }

  // Map Square status to our status
  let ourStatus = user.subscriptionStatus
  if (status === 'ACTIVE') ourStatus = 'active'
  else if (status === 'CANCELED') ourStatus = 'cancelled'
  else if (status === 'PAUSED') ourStatus = 'canceling'

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: ourStatus,
      squareSubscriptionId: subscription.id,
    },
  })

  console.log(`Subscription ${subscription.id} status updated to ${ourStatus}`)
}

async function handleOrderFulfilled(orderFulfilled: any) {
  console.log('Order fulfilled:', orderFulfilled?.order_id)
}

async function handlePaymentUpdated(payment: any) {
  // Handle payment updates (refunds, disputes, etc.)
  if (payment.status === 'CANCELED' || payment.status === 'FAILED') {
    const customerId = payment.customer_id

    if (!customerId) return

    const user = await prisma.user.findFirst({
      where: { squareCustomerId: customerId },
    })

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: payment.status.toLowerCase(),
        },
      })
    }
  }
}
