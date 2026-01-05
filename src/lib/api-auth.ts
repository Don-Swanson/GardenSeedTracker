import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates API key authentication for admin endpoints
 * 
 * Usage in API routes:
 *   const authResult = validateApiKey(req)
 *   if (!authResult.valid) {
 *     return authResult.response
 *   }
 * 
 * The API key should be sent in the Authorization header:
 *   Authorization: Bearer YOUR_API_KEY
 * 
 * Or as a query parameter (not recommended for production):
 *   ?api_key=YOUR_API_KEY
 */
export function validateApiKey(req: NextRequest): { valid: true } | { valid: false; response: NextResponse } {
  const apiKey = process.env.ADMIN_API_KEY

  if (!apiKey) {
    console.error('ADMIN_API_KEY environment variable is not set')
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'API key authentication is not configured' },
        { status: 500 }
      )
    }
  }

  // Check Authorization header first
  const authHeader = req.headers.get('authorization')
  let providedKey: string | null = null

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.slice(7)
    } else if (authHeader.startsWith('ApiKey ')) {
      providedKey = authHeader.slice(7)
    } else {
      providedKey = authHeader
    }
  }

  // Fallback to query parameter (less secure, but useful for testing)
  if (!providedKey) {
    const { searchParams } = new URL(req.url)
    providedKey = searchParams.get('api_key')
  }

  if (!providedKey) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Missing API key. Provide it in the Authorization header (Bearer YOUR_KEY) or as api_key query parameter.' },
        { status: 401 }
      )
    }
  }

  // Constant-time comparison to prevent timing attacks
  if (!secureCompare(providedKey, apiKey)) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
  }

  return { valid: true }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate a secure API key
 * Run this in Node.js to generate a key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateApiKey(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}
