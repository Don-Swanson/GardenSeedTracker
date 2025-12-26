/**
 * CSRF Token Management
 * 
 * Provides CSRF protection for state-changing API endpoints
 */

import crypto from 'crypto'
import { prisma } from './prisma'

const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a new CSRF token for a session
 */
export async function generateCsrfToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + CSRF_TOKEN_EXPIRY)
  
  // Store token in database
  await prisma.csrfToken.create({
    data: {
      token,
      sessionId,
      expiresAt,
    },
  })
  
  // Clean up expired tokens periodically (1% chance per request)
  if (Math.random() < 0.01) {
    await prisma.csrfToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {}) // Ignore errors during cleanup
  }
  
  return token
}

/**
 * Validate a CSRF token from request headers
 */
export async function validateCsrfToken(
  request: Request,
  sessionId: string
): Promise<{ valid: boolean; error?: string }> {
  const token = request.headers.get(CSRF_HEADER_NAME)
  
  if (!token) {
    return { valid: false, error: 'CSRF token missing' }
  }
  
  // Find the token in database
  const storedToken = await prisma.csrfToken.findFirst({
    where: {
      token,
      sessionId,
      expiresAt: { gt: new Date() },
    },
  })
  
  if (!storedToken) {
    return { valid: false, error: 'Invalid or expired CSRF token' }
  }
  
  return { valid: true }
}

/**
 * Get or create CSRF token for current session
 * Call this from a GET endpoint to provide the token to the client
 */
export async function getOrCreateCsrfToken(sessionId: string): Promise<string> {
  // Check for existing valid token
  const existing = await prisma.csrfToken.findFirst({
    where: {
      sessionId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  if (existing) {
    return existing.token
  }
  
  // Generate new token
  return generateCsrfToken(sessionId)
}

/**
 * Middleware helper to validate CSRF for sensitive operations
 */
export async function requireCsrfToken(
  request: Request,
  sessionId: string
): Promise<Response | null> {
  const { valid, error } = await validateCsrfToken(request, sessionId)
  
  if (!valid) {
    return new Response(
      JSON.stringify({ error: error || 'CSRF validation failed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  return null // null means validation passed
}

/**
 * Delete all CSRF tokens for a session (call on logout)
 */
export async function invalidateSessionCsrfTokens(sessionId: string): Promise<void> {
  await prisma.csrfToken.deleteMany({
    where: { sessionId },
  })
}
