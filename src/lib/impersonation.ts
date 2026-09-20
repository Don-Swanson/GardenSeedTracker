import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_AGE = 60 * 60 * 1000

export function createImpersonationCookie(adminId: string, userId: string, secret = process.env.NEXTAUTH_SECRET): string {
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for impersonation')
  const payload = Buffer.from(JSON.stringify({ adminId, userId, expiresAt: Date.now() + MAX_AGE })).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function readImpersonationCookie(value: string, adminId: string, secret = process.env.NEXTAUTH_SECRET): string | null {
  if (!secret || value.length > 4096) return null
  try {
    const [payload, signature, extra] = value.split('.')
    if (!payload || !signature || extra !== undefined) return null
    const expected = createHmac('sha256', secret).update(payload).digest()
    const supplied = Buffer.from(signature, 'base64url')
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (data.adminId !== adminId || typeof data.userId !== 'string' || !data.userId ||
        typeof data.expiresAt !== 'number' || data.expiresAt <= Date.now() || data.expiresAt > Date.now() + MAX_AGE) return null
    return data.userId
  } catch {
    return null
  }
}
