/**
 * Security validation utilities for input sanitization
 */

// Maximum lengths for various field types
export const MAX_LENGTHS = {
  name: 200,
  shortText: 500,
  mediumText: 2000,
  longText: 10000,
  url: 2048,
  email: 254,
  notes: 5000,
}

/**
 * Sanitize a string by removing potentially dangerous HTML/script content
 * while preserving safe characters
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = MAX_LENGTHS.mediumText): string | null {
  if (!input || typeof input !== 'string') return null
  
  // Trim whitespace
  let sanitized = input.trim()
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Encode HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  return sanitized || null
}

/**
 * Sanitize a string but preserve some formatting (for display fields)
 * Only encodes dangerous characters, not all HTML
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = MAX_LENGTHS.mediumText): string | null {
  if (!input || typeof input !== 'string') return null
  
  let sanitized = input.trim()
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  return sanitized || null
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  
  const trimmed = input.trim()
  
  if (trimmed.length > MAX_LENGTHS.url) return null
  
  // Only allow http and https protocols
  try {
    const url = new URL(trimmed)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  
  const trimmed = input.trim().toLowerCase()
  
  if (trimmed.length > MAX_LENGTHS.email) return null
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Sanitize a number within bounds
 */
export function sanitizeNumber(
  input: number | string | null | undefined,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (input === null || input === undefined) return null
  
  const num = typeof input === 'string' ? parseFloat(input) : input
  
  if (isNaN(num) || !isFinite(num)) return null
  
  return Math.max(min, Math.min(max, num))
}

/**
 * Sanitize an integer within bounds
 */
export function sanitizeInteger(
  input: number | string | null | undefined,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = sanitizeNumber(input, min, max)
  return num !== null ? Math.floor(num) : null
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(
  input: string[] | null | undefined,
  maxItems: number = 100,
  maxItemLength: number = MAX_LENGTHS.shortText
): string[] {
  if (!Array.isArray(input)) return []
  
  return input
    .slice(0, maxItems)
    .map(item => sanitizeString(item, maxItemLength))
    .filter((item): item is string => item !== null && item.length > 0)
}

/**
 * Validate that a value is one of allowed options
 */
export function validateEnum<T extends string>(
  input: string | null | undefined,
  allowedValues: readonly T[],
  defaultValue: T
): T {
  if (!input || typeof input !== 'string') return defaultValue
  
  const trimmed = input.trim() as T
  return allowedValues.includes(trimmed) ? trimmed : defaultValue
}

/**
 * Rate limiting helper - checks if too many requests from same source
 * Simple in-memory implementation (use Redis for production at scale)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    const keysToDelete: string[] = []
    rateLimitMap.forEach((v, k) => {
      if (v.resetTime < now) keysToDelete.push(k)
    })
    keysToDelete.forEach(k => rateLimitMap.delete(k))
  }
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}
