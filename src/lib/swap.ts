// Shared constants/helpers for the seed swap board.

export const SWAP_LISTING_EXPIRY_DAYS = 90
export const SWAP_QUANTITY_MAX_LENGTH = 60
export const SWAP_MESSAGE_MAX_LENGTH = 2000
// At most one "you have a new message" email per thread in this window,
// no matter how many messages arrive - an active back-and-forth shouldn't
// turn into an email per reply.
export const SWAP_MESSAGE_NOTIFY_THROTTLE_MS = 60 * 60 * 1000

/**
 * Coarse, human "how recently active" label for a poster on the swap board.
 * Deliberately imprecise (unlike the admin user list's exact relative time)
 * - a stranger on a public board shouldn't be able to tell "this person was
 * online 4 minutes ago", just a rough sense of whether the account is alive.
 */
export interface ThreadReadState {
  initiatorId: string
  ownerId: string
  lastMessageAt: Date | string
  initiatorLastReadAt: Date | string | null
  ownerLastReadAt: Date | string | null
}

/**
 * Whether `userId` (a participant in the thread) has unread messages.
 * Prisma can't compare two columns of the same row in a WHERE clause, so
 * this is computed in application code against a small fetched set instead
 * of in SQL - fine at this scale (a user's own swap-board threads).
 */
export function isThreadUnread(thread: ThreadReadState, userId: string): boolean {
  const lastMessageAt = new Date(thread.lastMessageAt).getTime()
  if (thread.initiatorId === userId) {
    return !thread.initiatorLastReadAt || new Date(thread.initiatorLastReadAt).getTime() < lastMessageAt
  }
  if (thread.ownerId === userId) {
    return !thread.ownerLastReadAt || new Date(thread.ownerLastReadAt).getTime() < lastMessageAt
  }
  return false
}

/** Whether a new-message email should be sent, given when the thread was last notified. */
export function shouldSendThreadNotification(lastNotifiedAt: Date | string | null): boolean {
  if (!lastNotifiedAt) return true
  return Date.now() - new Date(lastNotifiedAt).getTime() > SWAP_MESSAGE_NOTIFY_THROTTLE_MS
}

export function coarseActivityLabel(lastActiveAt: Date | string | null): string | null {
  if (!lastActiveAt) return null
  const then = new Date(lastActiveAt).getTime()
  const days = (Date.now() - then) / (1000 * 60 * 60 * 24)

  if (days < 1) return 'Active today'
  if (days < 7) return 'Active this week'
  if (days < 30) return 'Active this month'
  return 'Active a while ago'
}
