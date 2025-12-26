import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { 
  squareClient, 
  SQUARE_LOCATION_ID, 
  SUBSCRIPTION_TIERS,
  TRIAL_CONFIG 
} from '@/lib/square'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Valid tier amounts
const VALID_AMOUNTS = SUBSCRIPTION_TIERS.map(t => t.amount / 100)

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to upgrade' },
        { status: 401 }
      )
    }

    const { tier, startTrial } = await request.json()

    // Validate tier amount (unless starting trial)
    if (!startTrial && (!tier || !VALID_AMOUNTS.includes(tier))) {
      return NextResponse.json(
        { error: `Invalid subscription tier. Choose from: $${VALID_AMOUNTS.join(', $')}/year` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Handle trial start
    if (startTrial) {
      // Check if user has already used their trial
      if (user.trialUsed) {
        return NextResponse.json(
          { error: 'You have already used your free trial' },
          { status: 400 }
        )
      }

      return await createTrialCheckout(user)
    }

    // Create regular subscription checkout
    return await createSubscriptionCheckout(user, tier)
  } catch (error: any) {
    // SECURITY: Don't expose internal error details to clients
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again later.' },
      { status: 500 }
    )
  }
}

async function getOrCreateCustomer(user: any): Promise<string | null> {
  let customerId = user.squareCustomerId

  if (!customerId) {
    const { result: customerResult } = await squareClient.customersApi.createCustomer({
      emailAddress: user.email!,
      givenName: user.name?.split(' ')[0] || undefined,
      familyName: user.name?.split(' ').slice(1).join(' ') || undefined,
      referenceId: user.id,
      idempotencyKey: randomUUID(),
    })

    customerId = customerResult.customer?.id

    if (customerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { squareCustomerId: customerId },
      })
    }
  }

  return customerId || null
}

async function createTrialCheckout(user: any) {
  const customerId = await getOrCreateCustomer(user)

  // For trial, we collect card info but charge $0 now
  // Card will be charged after trial ends
  const { result } = await squareClient.checkoutApi.createPaymentLink({
    idempotencyKey: randomUUID(),
    order: {
      locationId: SQUARE_LOCATION_ID,
      lineItems: [
        {
          name: `Garden Seed Tracker Pro - ${TRIAL_CONFIG.durationDays}-Day Free Trial`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(0),
            currency: 'USD',
          },
          note: `Free trial - converts to $${TRIAL_CONFIG.autoConvertAmount / 100}/year after ${TRIAL_CONFIG.durationDays} days. Cancel anytime during trial.`,
        },
      ],
      customerId: customerId || undefined,
      metadata: {
        userId: user.id,
        subscriptionType: 'trial',
        trialDays: TRIAL_CONFIG.durationDays.toString(),
        convertAmount: TRIAL_CONFIG.autoConvertAmount.toString(),
      },
    },
    checkoutOptions: {
      redirectUrl: `${process.env.NEXTAUTH_URL}/upgrade/success?trial=true`,
      askForShippingAddress: false,
    },
    prePopulatedData: {
      buyerEmail: user.email || undefined,
    },
  })

  if (!result.paymentLink?.url) {
    throw new Error('Failed to create trial checkout link')
  }

  return NextResponse.json({ 
    url: result.paymentLink.url,
    orderId: result.paymentLink.orderId,
    type: 'trial',
  })
}

async function createSubscriptionCheckout(user: any, tierAmount: number) {
  const amountCents = tierAmount * 100
  const customerId = await getOrCreateCustomer(user)

  // Create checkout for subscription payment
  const { result } = await squareClient.checkoutApi.createPaymentLink({
    idempotencyKey: randomUUID(),
    order: {
      locationId: SQUARE_LOCATION_ID,
      lineItems: [
        {
          name: `Garden Seed Tracker Pro - $${tierAmount}/year`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(amountCents),
            currency: 'USD',
          },
          note: `Annual subscription - Auto-renews at $${tierAmount}/year`,
        },
      ],
      customerId: customerId || undefined,
      metadata: {
        userId: user.id,
        subscriptionType: 'annual',
        tierAmount: tierAmount.toString(),
      },
    },
    checkoutOptions: {
      redirectUrl: `${process.env.NEXTAUTH_URL}/upgrade/success`,
      askForShippingAddress: false,
    },
    prePopulatedData: {
      buyerEmail: user.email || undefined,
    },
  })

  if (!result.paymentLink?.url) {
    throw new Error('Failed to create checkout link')
  }

  return NextResponse.json({ 
    url: result.paymentLink.url,
    orderId: result.paymentLink.orderId,
    type: 'subscription',
    tier: tierAmount,
  })
}
