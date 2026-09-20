import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import type { JWT } from 'next-auth/jwt'

const directory = mkdtempSync(join(tmpdir(), 'gst-security-test-'))
const url = `file:${directory}/garden.db`
let prisma: PrismaClient
let auth: typeof import('../../src/lib/auth')

before(async () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' })
  prisma = new PrismaClient({ datasources: { db: { url } } })
  ;(globalThis as unknown as { prisma: PrismaClient }).prisma = prisma
  auth = await import('../../src/lib/auth')
})
after(async () => { await prisma?.$disconnect(); rmSync(directory, { recursive: true, force: true }) })

test('existing login tokens lose admin privileges immediately after demotion', async () => {
  const user = await prisma.user.create({ data: { email: 'admin@example.test', role: 'admin' } })
  const jwt = auth.authOptions.callbacks!.jwt!
  const refresh = (token: JWT) => jwt({ token } as Parameters<typeof jwt>[0])
  const token = { id: user.id, role: 'admin' } as JWT
  assert.equal((await refresh(token)).role, 'admin')
  await prisma.user.update({ where: { id: user.id }, data: { role: 'user' } })
  assert.equal((await refresh(token)).role, 'user')
  await prisma.user.delete({ where: { id: user.id } })
  await assert.rejects(async () => refresh(token), /Session account no longer exists/)
})

test('record routes enforce ownership and reject another gardener’s location', async t => {
  const owner = await prisma.user.create({ data: { email: 'owner@example.test' } })
  const other = await prisma.user.create({ data: { email: 'other@example.test' } })
  const seed = await prisma.seed.create({ data: { userId: owner.id } })
  const foreignSeed = await prisma.seed.create({ data: { userId: other.id } })
  const ownLocation = await prisma.gardenLocation.create({ data: { userId: owner.id, name: 'Own garden' } })
  const foreignLocation = await prisma.gardenLocation.create({ data: { userId: other.id, name: 'Private garden' } })
  const nextAuth = require('next-auth/next')
  t.mock.method(nextAuth, 'getServerSession', async () => ({ user: { id: owner.id, role: 'user', email: owner.email }, expires: '' }))
  const seedRoute = await import('../../src/app/api/seeds/[id]/route')
  const seeds = { params: Promise.resolve({ id: foreignSeed.id }) }
  assert.equal((await seedRoute.GET(new Request('http://localhost/api/seeds/test'), seeds)).status, 404)
  assert.equal((await seedRoute.DELETE(new Request('http://localhost/api/seeds/test', { method: 'DELETE' }), seeds)).status, 404)
  assert.ok(await prisma.seed.findUnique({ where: { id: foreignSeed.id } }))

  const plantings = await import('../../src/app/api/plantings/route')
  const request = (locationId: string) => new Request('http://localhost/api/plantings', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ seedId: seed.id, locationId, locationName: 'Garden', plantingDate: '2026-09-20' }),
  })
  assert.equal((await plantings.POST(request(foreignLocation.id))).status, 404)
  assert.equal(await prisma.planting.count(), 0)
  const created = await plantings.POST(request(ownLocation.id))
  assert.equal(created.status, 201)
  const planting = await created.json()
  const plantingRoute = await import('../../src/app/api/plantings/[id]/route')
  assert.equal((await plantingRoute.PUT(request(foreignLocation.id), { params: Promise.resolve({ id: planting.id }) })).status, 404)
  assert.equal((await prisma.planting.findUniqueOrThrow({ where: { id: planting.id } })).locationId, ownLocation.id)

  const wishlist = await prisma.wishlistItem.create({ data: { userId: owner.id, customPlantName: 'Tomato', sourceUrl: 'https://example.test/' } })
  const wishlistRoute = await import('../../src/app/api/wishlist/[id]/route')
  const update = await wishlistRoute.PUT(new Request('http://localhost/api/wishlist/test', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceUrl: 'javascript:alert(1)' }),
  }), { params: Promise.resolve({ id: wishlist.id }) })
  assert.equal(update.status, 200)
  assert.equal((await update.json()).sourceUrl, null)
})
