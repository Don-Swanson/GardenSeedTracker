import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

const directory = mkdtempSync(join(tmpdir(), 'gst-api-test-'))
const url = `file:${directory}/garden.db`
let prisma: PrismaClient
let route: typeof import('../../src/app/api/v1/admin/plants/import/route')
const data = { name: 'Shared', scientificName: 'Example alpha', category: 'other', generalInfo: 'Source information [12].',
  sourceName: 'Perenual', sourceId: '101', sourceUrl: 'https://perenual.com/plant-species-database-search-finder/species/101',
  sourceLicense: 'Permission required before production use', sourceRetrievedAt: '2026-09-13T00:00:00Z', sourceData: '{"sample":true}',
}
const req = (body?: unknown, authenticated = true) => new NextRequest('http://localhost/api/v1/admin/plants/import', {
  method: body === undefined ? 'GET' : 'POST', headers: { ...(authenticated ? { Authorization: 'Bearer isolated-api-test' } : {}), 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

before(async () => {
  writeFileSync(join(directory, 'garden.db'), '')
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' })
  prisma = new PrismaClient({ datasources: { db: { url } } })
  ;(globalThis as unknown as { prisma: PrismaClient }).prisma = prisma
  process.env.ADMIN_API_KEY = 'isolated-api-test'
  route = await import('../../src/app/api/v1/admin/plants/import/route')
})
after(async () => { await prisma.$disconnect(); rmSync(directory, { recursive: true, force: true }) })

test('API requires authentication and advertises supported batch capabilities', async () => {
  assert.equal((await route.GET(req(undefined, false))).status, 401)
  assert.equal((await route.POST(req({}, false))).status, 401)
  const response = await route.GET(req())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).maxBatchSize, 50)
})

test('API dry run is read-only; apply preserves generic plants and creates a distinct source species', async () => {
  const generic = await prisma.plantingGuide.create({ data: { name: 'Shared', category: 'herb', notes: 'My growing notes' } })
  const preview = await route.POST(req({ schemaVersion: 1, records: [data], requestId: 'preview' }))
  assert.equal(preview.status, 200)
  assert.equal((await preview.json()).created, 1)
  assert.equal(await prisma.plantingGuide.count(), 1)
  assert.equal(await prisma.adminAuditLog.count(), 0)
  const applied = await route.POST(req({ schemaVersion: 1, records: [data], requestId: 'batch-1', dryRun: false }))
  assert.equal(applied.status, 200)
  assert.equal((await applied.json()).created, 1)
  assert.deepEqual(await prisma.plantingGuide.findUnique({ where: { id: generic.id } }), generic)
  assert.ok(await prisma.plantingGuide.findUnique({ where: { name: 'Shared (Example alpha)' } }))
})

test('replaying a committed batch returns its receipt and cannot repeat writes', async () => {
  const before = await prisma.plantingGuide.findMany()
  const replay = await route.POST(req({ schemaVersion: 1, records: [data], requestId: 'batch-1', dryRun: false }))
  assert.equal(replay.status, 200)
  assert.equal((await replay.json()).replayed, true)
  assert.equal(await prisma.adminAuditLog.count(), 1)
  assert.deepEqual(await prisma.plantingGuide.findMany(), before)
  const conflict = await route.POST(req({ schemaVersion: 1, records: [{ ...data, name: 'Changed' }], requestId: 'batch-1', dryRun: false }))
  assert.equal(conflict.status, 409)
  assert.deepEqual(await prisma.plantingGuide.findMany(), before)
})

test('invalid batches and oversized payloads are rejected without partial writes', async () => {
  const before = await prisma.plantingGuide.count()
  const invalid = await route.POST(req({ schemaVersion: 1, records: [data, { ...data }], requestId: 'invalid', dryRun: false }))
  assert.equal(invalid.status, 400)
  const large = await route.POST(req({ padding: 'a'.repeat(4 * 1024 * 1024 + 1) }))
  assert.equal(large.status, 413)
  assert.equal(await prisma.plantingGuide.count(), before)
})

test('failed audit receipt rolls back the plant mutation', async () => {
  // Reject the receipt at SQLite level to exercise a failure after plant creation.
  await prisma.$executeRawUnsafe(`CREATE TRIGGER reject_test_receipt BEFORE INSERT ON AdminAuditLog WHEN NEW.id = 'catalog:rollback' BEGIN SELECT RAISE(ABORT, 'test receipt failure'); END`)
  const before = await prisma.plantingGuide.count()
  const response = await route.POST(req({ schemaVersion: 1, requestId: 'rollback', dryRun: false, records: [{ ...data, name: 'Beta', scientificName: 'Example beta', sourceId: '102', sourceUrl: 'https://perenual.com/plant-species-database-search-finder/species/102' }] }))
  assert.equal(response.status, 500)
  assert.equal(await prisma.plantingGuide.count(), before)
})
