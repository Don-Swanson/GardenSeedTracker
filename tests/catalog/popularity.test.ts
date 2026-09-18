import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { popularPlantIds } from '../../src/lib/plant-popularity'
import { calculatePlantingDates } from '../../src/lib/garden-utils'

test('popularity counts distinct gardeners, excludes inactive interest, filters and paginates consistently', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gst-popularity-'))
  const url = `file:${dir}/garden.db`
  writeFileSync(join(dir, 'garden.db'), '')
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' })
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
    const a = await db.plantingGuide.create({ data: { name: 'Alpha', category: 'herb' } })
    const b = await db.plantingGuide.create({ data: { name: 'Beta', category: 'vegetable' } })
    const c = await db.plantingGuide.create({ data: { name: '100% plant', category: 'other' } })
    const hidden = await db.plantingGuide.create({ data: { name: 'Hidden', category: 'other', isApproved: false } })
    const u = await db.user.create({ data: { email: 'one@example.test' } })
    const v = await db.user.create({ data: { email: 'two@example.test' } })
    await db.seed.createMany({ data: [
      { userId: u.id, plantTypeId: a.id }, { userId: u.id, plantTypeId: a.id },
      { userId: u.id, plantTypeId: b.id }, { userId: v.id, plantTypeId: b.id },
      { userId: v.id, plantTypeId: c.id, isArchived: true }, { userId: u.id, plantTypeId: hidden.id },
    ] })
    await db.wishlistItem.createMany({ data: [
      { userId: u.id, plantTypeId: a.id }, { userId: v.id, plantTypeId: c.id, purchased: true },
    ] })
    const ids = async (extra = {}) => (await popularPlantIds(db, { limit: 10, offset: 0, ...extra })).map(row => row.id)
    assert.deepEqual(await ids(), [b.id, a.id, c.id])
    assert.deepEqual(await ids({ limit: 1, offset: 1 }), [a.id])
    assert.deepEqual(await ids({ category: 'herb' }), [a.id])
    assert.deepEqual(await ids({ search: '100%' }), [c.id])
    assert.deepEqual(await ids({ search: "' OR 1=1 --" }), [])
  } finally { await db.$disconnect(); rmSync(dir, { recursive: true, force: true }) }
})

test('zero-week timing is a real date while missing guidance stays unknown', () => {
  const frost = new Date(2026, 3, 15)
  const dates = calculatePlantingDates(frost, 0, 0, null)
  assert.equal(dates.indoorStart?.getTime(), frost.getTime())
  assert.equal(dates.outdoorStart?.getTime(), frost.getTime())
  assert.equal(dates.transplant, null)
})
