import { Client, Environment } from 'square'

// SECURITY: Validate Square credentials - but allow build without them
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build'

if (!SQUARE_ACCESS_TOKEN && IS_PRODUCTION && !IS_BUILD) {
  console.error('Warning: SQUARE_ACCESS_TOKEN is not set - payment features will not work')
}

// Lazily create Square client to avoid build-time errors
let _squareClient: Client | null = null

function getSquareClient(): Client {
  if (!_squareClient) {
    _squareClient = new Client({
      accessToken: SQUARE_ACCESS_TOKEN || 'sandbox-placeholder-token',
      environment: IS_PRODUCTION
        ? Environment.Production 
        : Environment.Sandbox,
    })
  }
  return _squareClient
}

export const squareClient = {
  get paymentsApi() { return getSquareClient().paymentsApi },
  get checkoutApi() { return getSquareClient().checkoutApi },
  get customersApi() { return getSquareClient().customersApi },
  get subscriptionsApi() { return getSquareClient().subscriptionsApi },
  get catalogApi() { return getSquareClient().catalogApi },
}

export const paymentsApi = { get api() { return getSquareClient().paymentsApi } }
export const checkoutApi = { get api() { return getSquareClient().checkoutApi } }
export const customersApi = { get api() { return getSquareClient().customersApi } }
export const subscriptionsApi = { get api() { return getSquareClient().subscriptionsApi } }
export const catalogApi = { get api() { return getSquareClient().catalogApi } }

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || ''
export const SQUARE_APP_ID = process.env.SQUARE_APP_ID || ''

// Subscription tiers (amounts in cents)
export const SUBSCRIPTION_TIERS = [
  { id: 'tier-5', amount: 500, label: '$5/year', popular: false },
  { id: 'tier-10', amount: 1000, label: '$10/year', popular: true },
  { id: 'tier-15', amount: 1500, label: '$15/year', popular: false },
  { id: 'tier-20', amount: 2000, label: '$20/year', popular: false },
  { id: 'tier-25', amount: 2500, label: '$25/year', popular: false },
  { id: 'tier-50', amount: 5000, label: '$50/year', popular: false },
] as const

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 7,
  autoConvertTier: 'tier-5', // Auto-converts to $5/year after trial
  autoConvertAmount: 500,
}

// Minimum subscription amount in cents
export const MIN_SUBSCRIPTION_AMOUNT = 500 // $5.00
