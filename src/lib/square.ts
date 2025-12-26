import { Client, Environment } from 'square'

// SECURITY: Validate Square credentials are present
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

if (!SQUARE_ACCESS_TOKEN && IS_PRODUCTION) {
  throw new Error('SECURITY ERROR: SQUARE_ACCESS_TOKEN is required in production')
}

if (!SQUARE_ACCESS_TOKEN) {
  console.warn('Warning: SQUARE_ACCESS_TOKEN is not set - payment features will not work')
}

export const squareClient = new Client({
  accessToken: SQUARE_ACCESS_TOKEN || 'sandbox-placeholder-token',
  environment: IS_PRODUCTION
    ? Environment.Production 
    : Environment.Sandbox,
})

export const paymentsApi = squareClient.paymentsApi
export const checkoutApi = squareClient.checkoutApi
export const customersApi = squareClient.customersApi
export const subscriptionsApi = squareClient.subscriptionsApi
export const catalogApi = squareClient.catalogApi

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
