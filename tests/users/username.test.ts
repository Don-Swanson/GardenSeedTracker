import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import {
  checkUsernameAvailability,
  normalizeUsername,
  usernameFormatError,
  USERNAME_REGEX,
} from '../../src/lib/username'

test('normalizeUsername trims and lowercases', () => {
  assert.equal(normalizeUsername('  GardenGnome_42 '), 'gardengnome_42')
})

test('usernameFormatError rejects bad formats and reserved words, accepts good ones', () => {
  assert.ok(usernameFormatError('ab')) // too short
  assert.ok(usernameFormatError('a'.repeat(21))) // too long
  assert.ok(usernameFormatError('has space'))
  assert.ok(usernameFormatError('has-dash'))
  assert.ok(usernameFormatError('admin')) // reserved
  // usernameFormatError expects an already-normalized (lowercase) string,
  // as checkUsernameAvailability provides - callers must normalize first.
  assert.ok(usernameFormatError(normalizeUsername('SUPPORT')))
  assert.equal(usernameFormatError('tomato_grower99'), null)
})

test('USERNAME_REGEX matches usernameFormatError behavior for the format check', () => {
  assert.equal(USERNAME_REGEX.test('tomato_grower99'), true)
  assert.equal(USERNAME_REGEX.test('ab'), false)
})

const directory = mkdtempSync(join(tmpdir(), 'gst-username-test-'))
const url = `file:${directory}/garden.db`
let prisma: PrismaClient

before(() => {
  writeFileSync(join(directory, 'garden.db'), '')
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], {
    env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
  })
  prisma = new PrismaClient({ datasources: { db: { url } } })
})
after(async () => { await prisma?.$disconnect(); rmSync(directory, { recursive: true, force: true }) })

test('checkUsernameAvailability blocks names taken by an existing account', async () => {
  await prisma.user.create({ data: { email: 'taken@example.test', username: 'gardener_jane' } })
  const result = await checkUsernameAvailability(prisma, 'Gardener_Jane')
  assert.equal(result.available, false)
  assert.match(result.error!, /already taken/)
})

test('checkUsernameAvailability blocks names reserved by an unexpired pending signup, but not an expired one', async () => {
  await prisma.signupData.create({
    data: { email: 'pending@example.test', name: 'Pending Person', username: 'seedling_sam', expiresAt: new Date(Date.now() + 60_000) },
  })
  const blocked = await checkUsernameAvailability(prisma, 'seedling_sam')
  assert.equal(blocked.available, false)
  assert.match(blocked.error!, /pending signup/)

  await prisma.signupData.create({
    data: { email: 'expired@example.test', name: 'Expired Person', username: 'wilted_walt', expiresAt: new Date(Date.now() - 60_000) },
  })
  const expired = await checkUsernameAvailability(prisma, 'wilted_walt')
  assert.equal(expired.available, true)
})

test('checkUsernameAvailability excludes the current user/signup so re-saving your own username succeeds', async () => {
  const user = await prisma.user.create({ data: { email: 'self@example.test', username: 'my_own_name' } })
  const selfCheck = await checkUsernameAvailability(prisma, 'my_own_name', { excludeUserId: user.id })
  assert.equal(selfCheck.available, true)

  await prisma.signupData.create({
    data: { email: 'self-signup@example.test', name: 'Self Signup', username: 'reserved_for_me', expiresAt: new Date(Date.now() + 60_000) },
  })
  const selfSignupCheck = await checkUsernameAvailability(prisma, 'reserved_for_me', { excludeSignupEmail: 'self-signup@example.test' })
  assert.equal(selfSignupCheck.available, true)
})

test('the SignupData.username unique index rejects a second concurrent reservation of the same name', async () => {
  await prisma.signupData.create({
    data: { email: 'first-racer@example.test', name: 'First Racer', username: 'race_winner', expiresAt: new Date(Date.now() + 60_000) },
  })
  await assert.rejects(
    prisma.signupData.create({
      data: { email: 'second-racer@example.test', name: 'Second Racer', username: 'race_winner', expiresAt: new Date(Date.now() + 60_000) },
    }),
    /Unique constraint/,
  )
})
