// Subscription feature definitions
// FREE: Seed inventory + Wishlist
// PAID: All features (Planting log, Calendar, Almanac, Plant requests, etc.)
//
// Payment Model:
// - Fixed tiers ($5, $10, $15, $20, $25, $50/year) via Square
// - Square stores payment info securely - we never see card numbers
// - Subscriptions auto-renew annually via Square stored cards
// - 7-day free trial available, converts to $5/year automatically
//
// Data Retention:
// - Free tier data (seeds, wishlist) retained indefinitely
// - Pro data retained but paywalled for ~1 year after expiry
// - Admins can manually remove expired user data

export interface SubscriptionFeatures {
  // Core features
  canTrackSeeds: boolean
  canUseWishlist: boolean
  
  // Paid features
  canLogPlantings: boolean
  canViewCalendar: boolean
  canViewAlmanac: boolean
  canRequestPlants: boolean
  canExportData: boolean
  canUploadImages: boolean
  canUseGardenLocations: boolean
  canViewCompanionPlanting: boolean
  canViewPestGuide: boolean
}

export const FREE_FEATURES: SubscriptionFeatures = {
  canTrackSeeds: true,
  canUseWishlist: true,
  canLogPlantings: false,
  canViewCalendar: false,
  canViewAlmanac: false,
  canRequestPlants: false,
  canExportData: false,
  canUploadImages: false,
  canUseGardenLocations: false,
  canViewCompanionPlanting: false,
  canViewPestGuide: false,
}

export const PAID_FEATURES: SubscriptionFeatures = {
  canTrackSeeds: true,
  canUseWishlist: true,
  canLogPlantings: true,
  canViewCalendar: true,
  canViewAlmanac: true,
  canRequestPlants: true,
  canExportData: true,
  canUploadImages: true,
  canUseGardenLocations: true,
  canViewCompanionPlanting: true,
  canViewPestGuide: true,
}

// User subscription info type
export interface UserSubscription {
  isPaid: boolean
  isLifetimeMember: boolean
  subscriptionStatus: string
  subscriptionEndDate: Date | null
  autoRenew: boolean
}

export function getFeatures(isPaid: boolean): SubscriptionFeatures {
  return isPaid ? PAID_FEATURES : FREE_FEATURES
}

export function canAccessFeature(
  isPaid: boolean,
  feature: keyof SubscriptionFeatures
): boolean {
  const features = getFeatures(isPaid)
  return features[feature]
}

// Check if user has active paid access (including lifetime or trial)
export function hasActiveSubscription(user: UserSubscription & { trialEndDate?: Date | string | null }): boolean {
  // Lifetime members always have access
  if (user.isLifetimeMember) {
    return true
  }
  
  // Check if user is in an active trial
  if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
    const trialEnd = new Date(user.trialEndDate)
    if (trialEnd > new Date()) {
      return true
    }
  }
  
  // Check if subscription is active and not expired
  if (user.subscriptionStatus === 'active' && user.subscriptionEndDate) {
    return new Date(user.subscriptionEndDate) > new Date()
  }
  
  return user.isPaid && user.subscriptionStatus === 'active'
}

// Get days until subscription expires
export function getDaysUntilExpiry(subscriptionEndDate: Date | null): number | null {
  if (!subscriptionEndDate) return null
  
  const now = new Date()
  const end = new Date(subscriptionEndDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Check if renewal reminder email should be sent (7 days before expiry)
// This sends a reminder email with a renewal link - NOT an automatic charge
// User must manually complete payment via Square
export function shouldSendRenewalReminder(
  subscriptionEndDate: Date | null,
  renewalReminderSent: boolean,
  autoRenew: boolean
): boolean {
  // Only send if user has auto-renew enabled (wants reminders)
  if (!autoRenew) return false
  if (!subscriptionEndDate || renewalReminderSent) return false
  
  const daysUntilExpiry = getDaysUntilExpiry(subscriptionEndDate)
  
  // Send reminder 7 days before expiry
  return daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0
}

// Feature descriptions for marketing/upgrade prompts
export const FEATURE_DESCRIPTIONS = {
  canLogPlantings: {
    name: 'Planting Log',
    description: 'Track when and where you plant your seeds, monitor growth progress, and record harvests.',
    icon: 'MapPin',
  },
  canViewCalendar: {
    name: 'Planting Calendar',
    description: 'Personalized planting schedule based on your hardiness zone and frost dates.',
    icon: 'Calendar',
  },
  canViewAlmanac: {
    name: 'Garden Almanac',
    description: 'Moon phases, seasonal tips, companion planting guides, and pest control advice.',
    icon: 'BookOpen',
  },
  canRequestPlants: {
    name: 'Plant Requests',
    description: 'Request new plants to be added to our database with full planting information.',
    icon: 'Plus',
  },
  canExportData: {
    name: 'Data Export',
    description: 'Export your seed inventory and planting history to CSV or PDF.',
    icon: 'Download',
  },
  canUploadImages: {
    name: 'Image Upload',
    description: 'Add photos to your seeds and plantings to track visual progress.',
    icon: 'Image',
  },
  canUseGardenLocations: {
    name: 'Garden Locations',
    description: 'Organize your garden into beds, rows, and containers for better tracking.',
    icon: 'Layout',
  },
  canViewCompanionPlanting: {
    name: 'Companion Planting',
    description: 'Learn which plants grow well together and which to keep apart.',
    icon: 'Users',
  },
  canViewPestGuide: {
    name: 'Pest Guide',
    description: 'Identify common pests and learn organic control methods.',
    icon: 'Bug',
  },
}

// Pricing configuration - Fixed tiers with auto-renewal via Square Subscriptions
export const PRICING = {
  currency: 'USD',
  interval: 'year',
  tiers: [
    { amount: 5, label: '$5/year', popular: false },
    { amount: 10, label: '$10/year', popular: true },
    { amount: 15, label: '$15/year', popular: false },
    { amount: 20, label: '$20/year', popular: false },
    { amount: 25, label: '$25/year', popular: false },
    { amount: 50, label: '$50/year', popular: false },
  ],
  trial: {
    enabled: true,
    durationDays: 7,
    convertToAmount: 5, // Auto-converts to $5/year after trial
  },
}
