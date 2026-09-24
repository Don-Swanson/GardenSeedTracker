import type { Prisma, PrismaClient } from '@prisma/client'

// Single source of truth for username rules. Previously this regex, the
// reserved list and the lowercasing were each copied into four different
// route handlers (and two client components), and had drifted out of sync.

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

// Union of every reserved-word list that used to live separately in
// check-username, signup-data and setup-profile.
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
  'gardenseed', 'gardenseedtracker', 'system', 'root', 'null', 'undefined',
  'anonymous', 'guest', 'user', 'test', 'demo', 'api', 'www', 'app',
  'staff', 'official', 'team', 'mail', 'email', 'info', 'contact',
])

/** Lowercase + trim. This is the only place a username should be normalized. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

/**
 * Format + reserved-word check only (no database access). Returns an error
 * message, or null when the username is well-formed.
 */
export function usernameFormatError(normalized: string): string | null {
  if (!USERNAME_REGEX.test(normalized)) {
    return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters, letters, numbers, and underscores only`
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return 'This username is reserved'
  }
  return null
}

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Full availability check: format, reserved words, taken by an existing
 * account, and taken by another pending (unexpired) signup. Excludes are
 * for "check availability while editing your own username" cases.
 */
export async function checkUsernameAvailability(
  db: Db,
  username: string,
  options: { excludeUserId?: string; excludeSignupEmail?: string } = {}
): Promise<{ available: boolean; error?: string; normalized: string }> {
  const normalized = normalizeUsername(username)

  const formatError = usernameFormatError(normalized)
  if (formatError) {
    return { available: false, error: formatError, normalized }
  }

  const existingUser = await db.user.findFirst({
    where: {
      username: normalized,
      ...(options.excludeUserId ? { NOT: { id: options.excludeUserId } } : {}),
    },
    select: { id: true },
  })
  if (existingUser) {
    return { available: false, error: 'This username is already taken', normalized }
  }

  const pendingSignup = await db.signupData.findFirst({
    where: {
      username: normalized,
      expiresAt: { gt: new Date() },
      ...(options.excludeSignupEmail ? { NOT: { email: options.excludeSignupEmail } } : {}),
    },
    select: { id: true },
  })
  if (pendingSignup) {
    return { available: false, error: 'This username is already claimed by a pending signup', normalized }
  }

  return { available: true, normalized }
}
