import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateEmailContent, type AdminNotificationType } from '../../src/lib/admin-notifications'
import { generateSupportEmailHtml, generateConfirmationEmailHtml } from '../../src/lib/support-email'
import { sanitizeEmail, sanitizeText, sanitizeUrl } from '../../src/lib/validation'

const attack = '<img src=x onerror="alert(1)"> & \'quoted\''

test('every admin notification encodes untrusted HTML while keeping plain text readable', () => {
  const types: AdminNotificationType[] = ['newUserSignup', 'userDeleted', 'newPlantSubmission', 'newPlantSuggestion', 'newPlantRequest', 'errorAlerts']
  for (const type of types) {
    const result = generateEmailContent(type, {
      userEmail: attack, userName: attack, plantName: attack,
      errorMessage: attack, additionalInfo: { section: attack },
    })
    assert.ok(!result.html.includes(attack), type)
    assert.ok(!result.html.includes('<img'), type)
    assert.ok(result.html.includes('&lt;img'), type)
    assert.ok(result.text.includes(attack), type)
  }
})

test('support and confirmation emails encode messages, names and quoted attributes', () => {
  const data = { category: attack, subject: attack, message: attack, userName: attack, userEmail: attack, userId: attack }
  for (const html of [generateSupportEmailHtml(data), generateConfirmationEmailHtml(data)]) {
    assert.ok(!html.includes('<img'))
    assert.ok(html.includes('&lt;img'))
    assert.ok(html.includes('&quot;'))
  }
  const html = generateConfirmationEmailHtml({ ...data, message: 'a'.repeat(199) + '<script>bad</script>' })
  assert.ok(html.includes('a'.repeat(199) + '&lt;...'))
})

test('email validation rejects oversized and malformed input, and normalizes valid addresses', () => {
  assert.equal(sanitizeEmail(' Gardener+Seeds@Example.COM '), 'gardener+seeds@example.com')
  for (const value of ['a@b', 'a@b..com', 'a@@b.com', 'a b@example.com', 'a'.repeat(100000) + '@example.com']) {
    assert.equal(sanitizeEmail(value), null)
  }
  assert.equal(sanitizeEmail(123 as unknown as string), null)
})

test('plain-text normalization preserves literal content; URL validation rejects script schemes', () => {
  assert.equal(sanitizeText('  ' + attack + '\nline\tvalue\u0000  '), attack + '\nline\tvalue')
  assert.equal(sanitizeUrl('javascript:alert(1)'), null)
  assert.equal(sanitizeUrl('JavaScript:alert(1)'), null)
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com/')
})
