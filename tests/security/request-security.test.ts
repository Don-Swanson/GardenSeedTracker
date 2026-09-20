import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { isTrustedMutation } from '../../src/lib/request-origin'
import { createImpersonationCookie, readImpersonationCookie } from '../../src/lib/impersonation'
import { validateApiKey } from '../../src/lib/api-auth'
import { generatePlantingReminderEmailHtml } from '../../src/lib/planting-reminder-email'
import proxy from '../../src/proxy'
import type { NextFetchEvent } from 'next/server'
import { safeCallbackPath } from '../../src/lib/redirects'

test('authentication redirects reject script schemes and external destinations', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//evil.example', '/\\evil.example', 'https://evil.example', '/\n/evil.example', '/a/..//evil.example', '/%2e//evil.example', null]) {
    assert.equal(safeCallbackPath(value), '/dashboard')
  }
  assert.equal(safeCallbackPath('/seeds?sort=name#saved'), '/seeds?sort=name#saved')
})

test('proxy guards custom auth routes before NextAuth middleware bypasses them', async () => {
  for (const path of ['/api/auth/change-email', '/api/admin/impersonate/start', '/api/settings']) {
    const response = await proxy(new NextRequest(`https://garden.example${path}`, {
      method: 'POST', headers: { origin: 'https://evil.example', cookie: 'session=test', 'sec-fetch-site': 'cross-site' },
    }), {} as NextFetchEvent)
    assert.equal(response?.status, 403, path)
  }
})

test('cookie mutations reject hostile origins, same-site subdomains and missing browser origin', () => {
  const url = 'https://garden.example/api/auth/change-email'
  const request = (headers: Record<string, string>, method = 'POST') => new Request(url, { method, headers })
  for (const origin of ['https://evil.example', 'https://other.garden.example', 'null', 'invalid']) {
    assert.equal(isTrustedMutation(request({ origin, cookie: 'session=test' }), url), false)
  }
  assert.equal(isTrustedMutation(request({ cookie: 'session=test' }), url), false)
  assert.equal(isTrustedMutation(request({ origin: 'https://garden.example', cookie: 'session=test' }), url), true)
  assert.equal(isTrustedMutation(request({ cookie: 'session=test', 'sec-fetch-site': 'same-origin' }), url), true)
  assert.equal(isTrustedMutation(request({ origin: 'https://garden.example', 'sec-fetch-site': 'cross-site' }), url), false)
  assert.equal(isTrustedMutation(request({ authorization: 'Bearer test' }), url), true)
  assert.equal(isTrustedMutation(request({}, 'GET'), url), true)
  // Deployment URL, not an attacker-supplied Host, defines the trusted origin.
  assert.equal(isTrustedMutation(new Request('https://evil.example/api/settings', {
    method: 'PUT', headers: { origin: 'https://evil.example' },
  }), url), false)
})

test('impersonation cookies enforce signature, admin identity and server-side expiry', t => {
  const secret = 'isolated-test-secret'
  const cookie = createImpersonationCookie('admin', 'gardener', secret)
  assert.equal(readImpersonationCookie(cookie, 'admin', secret), 'gardener')
  assert.equal(readImpersonationCookie(cookie, 'other-admin', secret), null)
  assert.equal(readImpersonationCookie(cookie, 'admin', 'wrong-secret'), null)
  const [payload, signature] = cookie.split('.')
  const modified = Buffer.from(JSON.stringify({ adminId: 'admin', userId: 'other', expiresAt: Date.now() + 10000 })).toString('base64url')
  assert.equal(readImpersonationCookie(`${modified}.${signature}`, 'admin', secret), null)
  assert.equal(readImpersonationCookie(`${payload}.invalid`, 'admin', secret), null)
  assert.equal(readImpersonationCookie(JSON.stringify({ adminId: 'admin', user: { id: 'other' } }), 'admin', secret), null)
  t.mock.method(Date, 'now', () => Number.MAX_SAFE_INTEGER)
  assert.equal(readImpersonationCookie(cookie, 'admin', secret), null)
})

test('admin API accepts header credentials and rejects credentials in URLs', t => {
  const previous = process.env.ADMIN_API_KEY
  process.env.ADMIN_API_KEY = 'isolated-api-key'
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_API_KEY; else process.env.ADMIN_API_KEY = previous })
  assert.equal(validateApiKey(new NextRequest('https://garden.example/api/v1/admin/plants?api_key=isolated-api-key')).valid, false)
  assert.equal(validateApiKey(new NextRequest('https://garden.example/api/v1/admin/plants', {
    headers: { authorization: 'Bearer isolated-api-key' },
  })).valid, true)
  assert.equal(validateApiKey(new NextRequest('https://garden.example/api/v1/admin/plants', {
    headers: { authorization: 'Bearer wrong-key' },
  })).valid, false)
})

test('planting reminder HTML encodes names, varieties and link attributes', () => {
  const attack = '<img src=x onerror="alert(1)"> & \'quoted\''
  const reminder = { plantName: attack, variety: attack, category: 'other', plantingDate: new Date('2026-09-20'), type: 'indoor_start' as const, source: 'seed' as const }
  const html = generatePlantingReminderEmailHtml({ name: attack, indoorReminders: [reminder], directSowReminders: [], transplantReminders: [], settingsUrl: attack, calendarUrl: attack })
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('&lt;img'))
  assert.ok(html.includes('&quot;'))
})
