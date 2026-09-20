import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { seedIfEmpty } from '../../scripts/database/seed-if-empty'
import { CatalogRecord, importRecords, readCatalog } from '../../scripts/catalog/importer'
import { deletePlantPreservingReferences } from '../../src/lib/plant-delete'

const directory = mkdtempSync(join(tmpdir(), 'gst-catalog-test-'))
const url = `file:${directory}/garden.db`
let prisma: PrismaClient
const record = (scientificName: string, name = scientificName): CatalogRecord => ({
  name, scientificName, category: 'other', sourceName: 'Perenual', sourceId: scientificName,
  sourceUrl: `https://perenual.com/plant-species-database-search-finder/species/${encodeURIComponent(scientificName)}`,
  sourceLicense: 'Permission required before production use', sourceRetrievedAt: '2026-09-13T00:00:00Z',
  sourceData: '{"sample":true}', generalInfo: 'Imported information.',
})

before(() => {
  writeFileSync(join(directory, 'garden.db'), '')
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], {
    cwd: resolve('.'), env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
  })
  prisma = new PrismaClient({ datasources: { db: { url } } })
})
after(async () => { await prisma?.$disconnect(); rmSync(directory, { recursive: true, force: true }) })

test('failed first seed rolls back, and successful seed runs exactly once', async () => {
  await assert.rejects(seedIfEmpty(prisma, async tx => {
    await tx.plantingGuide.create({ data: { name: 'Rolled back', category: 'other' } })
    throw new Error('simulated import failure')
  }))
  assert.equal(await prisma.plantingGuide.count(), 0)
  assert.equal(await seedIfEmpty(prisma, async tx => {
    await tx.plantingGuide.create({ data: { name: 'Tomato', scientificName: 'Solanum lycopersicum', category: 'vegetable', notes: 'My edited growing notes', daysToMaturity: 81 } })
  }), true)
  const before = await prisma.plantingGuide.findMany()
  assert.equal(await seedIfEmpty(prisma, async () => { throw new Error('must not run') }), false)
  assert.deepEqual(await prisma.plantingGuide.findMany(), before)
})

test('dry run, repeated imports and enrichment preserve inventory, settings, curated fields and IDs', async () => {
  const tomato = await prisma.plantingGuide.findUniqueOrThrow({ where: { name: 'Tomato' } })
  const user = await prisma.user.create({ data: { email: 'preserve@example.test', settings: { create: { zipCode: '55555', reminderLeadDays: 12 } }, seeds: { create: { plantTypeId: tomato.id, nickname: 'Saved seeds' } } } })
  const userBefore = await prisma.user.findUnique({ where: { id: user.id }, include: { settings: true, seeds: true } })
  const records = [record('Solanum lycopersicum', 'Tomato'), record('Example alpha', 'Shared name'), record('Example beta', 'Shared name')]
  const before = await prisma.plantingGuide.findMany()
  const preview = await prisma.$transaction(tx => importRecords(tx, records, false, true))
  assert.equal(preview.created, 2)
  assert.deepEqual(await prisma.plantingGuide.findMany(), before)
  const applied = await prisma.$transaction(tx => importRecords(tx, records, false))
  assert.equal(applied.created, 2)
  assert.equal(applied.skipped, 1)
  assert.ok(await prisma.plantingGuide.findUnique({ where: { name: 'Shared name (Example beta)' } }))
  const repeated = await prisma.$transaction(tx => importRecords(tx, records, false))
  assert.equal(repeated.created, 0)
  assert.equal(repeated.skipped, 3)
  assert.deepEqual(await prisma.plantingGuide.findUnique({ where: { id: tomato.id } }), tomato)
  await prisma.$transaction(tx => importRecords(tx, records, true))
  const enriched = await prisma.plantingGuide.findUniqueOrThrow({ where: { id: tomato.id } })
  assert.equal(enriched.generalInfo, records[0].generalInfo)
  assert.equal(enriched.daysToMaturity, 81)
  assert.equal(enriched.notes, 'My edited growing notes')
  assert.equal(enriched.category, 'vegetable')
  assert.deepEqual(await prisma.user.findUnique({ where: { id: user.id }, include: { settings: true, seeds: true } }), userBefore)
})

test('ambiguous scientific identity is reported, never merged arbitrarily', async () => {
  await prisma.plantingGuide.createMany({ data: [
    { name: 'Cultivar one', scientificName: 'Example ambiguous', category: 'herb' },
    { name: 'Cultivar two', scientificName: 'Example ambiguous', category: 'herb' },
    { name: 'Unclassified common name', category: 'herb' },
  ] })
  const result = await prisma.$transaction(tx => importRecords(tx, [record('Example ambiguous'), record('Example unnamed', 'Unclassified common name')], true))
  assert.equal(result.created, 0)
  assert.equal(result.conflicts.length, 2)
})

test('a database with settings but no plants is not empty', async () => {
  await prisma.seed.deleteMany()
  await prisma.plantingGuide.deleteMany()
  assert.equal(await seedIfEmpty(prisma, async () => { throw new Error('must not seed over existing account') }), false)
  assert.equal(await prisma.plantingGuide.count(), 0)
})

test('deleting a plant preserves linked inventory as custom entries', async () => {
  const user = await prisma.user.upsert({
    where: { email: 'delete-preservation@example.test' },
    update: {},
    create: { email: 'delete-preservation@example.test' },
  })
  const plant = await prisma.plantingGuide.create({
    data: { name: 'Delete preservation plant', category: 'vegetable' },
  })
  const seed = await prisma.seed.create({ data: { userId: user.id, plantTypeId: plant.id } })
  const wishlist = await prisma.wishlistItem.create({ data: { userId: user.id, plantTypeId: plant.id } })
  await prisma.plantSuggestion.create({
    data: { plantId: plant.id, section: 'general', suggestionType: 'addition', suggestedContent: 'Test' },
  })

  const deleted = await prisma.$transaction(tx => deletePlantPreservingReferences(tx, plant.id))
  assert.deepEqual(deleted?.affected, { seeds: 1, wishlistItems: 1, suggestions: 1 })
  assert.equal(await prisma.plantingGuide.findUnique({ where: { id: plant.id } }), null)
  assert.deepEqual(
    await prisma.seed.findUnique({ where: { id: seed.id }, select: { plantTypeId: true, customPlantName: true, customCategory: true } }),
    { plantTypeId: null, customPlantName: plant.name, customCategory: plant.category },
  )
  assert.deepEqual(
    await prisma.wishlistItem.findUnique({ where: { id: wishlist.id }, select: { plantTypeId: true, customPlantName: true } }),
    { plantTypeId: null, customPlantName: plant.name },
  )
  assert.equal(await prisma.plantSuggestion.count({ where: { plantId: plant.id } }), 0)
})

test('input validation rejects malformed and duplicate source identities', () => {
  const file = join(directory, 'catalog.json')
  const check = (records: unknown[]) => {
    writeFileSync(file, JSON.stringify({ schemaVersion: 1, records }))
    return () => readCatalog(file)
  }
  assert.equal(check([record('Example valid')])().length, 1)
  assert.throws(check([record('Example duplicate'), record('Example duplicate')]))
  assert.throws(check([{ ...record('Example invalid'), hardinessZones: '["0a"]' }]))
  assert.throws(check([{ ...record('Example insecure'), sourceUrl: 'http://example.test/plant/1' }]))
  assert.equal(check([{ ...record('Example enriched'), daysToMaturity: 30, spacing: '30 cm', companionPlants: 'Basil' }])()[0].daysToMaturity, 30)
  assert.throws(check([{ ...record('Example unknown'), inventedField: 30 }]))
})

test('the same source ID from different providers is not a duplicate', () => {
  const first = record('Example provider')
  const second = { ...first, sourceName: 'GrowStuff', sourceUrl: 'https://www.growstuff.org/crops/1' }
  const file = join(directory, 'multi-source-catalog.json')
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, records: [first, second] }))
  assert.equal(readCatalog(file).length, 2)
})

test('separate source records sharing a scientific name are not collapsed', async () => {
  const records = [record('Example shared species', 'Provider form one'), { ...record('Example shared species', 'Provider form two'), sourceId: 'second-form' }]
  const result = await prisma.$transaction(tx => importRecords(tx, records, false, false, true))
  assert.equal(result.created, 2)
  assert.ok(await prisma.plantingGuide.findUnique({ where: { name: 'Provider form one' } }))
  assert.ok(await prisma.plantingGuide.findUnique({ where: { name: 'Provider form two' } }))
})

test('adopting a legacy database preserves columns unknown to the current schema', async () => {
  const legacyUrl = `file:${directory}/legacy.db`
  writeFileSync(join(directory, 'legacy.db'), '')
  const legacy = new PrismaClient({ datasources: { db: { url: legacyUrl } } })
  try {
    const sql = readFileSync('prisma/migrations/20260913000000_baseline/migration.sql', 'utf8')
    for (const statement of sql.split(';').map(s => s.replace(/^--.*$/gm, '').trim()).filter(Boolean)) {
      await legacy.$executeRawUnsafe(statement)
    }
    await legacy.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "legacySetting" TEXT')
    await legacy.$executeRawUnsafe(`INSERT INTO "User" (id, email, updatedAt, legacySetting) VALUES ('legacy-user', 'legacy@example.test', CURRENT_TIMESTAMP, 'keep this setting')`)
    const before = await legacy.$queryRawUnsafe('SELECT * FROM "User"')
    await legacy.$disconnect()
    for (let attempt = 0; attempt < 2; attempt++) {
      execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], {
        env: { ...process.env, DATABASE_URL: legacyUrl }, stdio: 'pipe',
      })
    }
    assert.deepEqual(await legacy.$queryRawUnsafe('SELECT * FROM "User"'), before)
    const columns = await legacy.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info("PlantingGuide")')
    assert.ok(columns.some(column => column.name === 'sourceId'))
    const history = await legacy.$queryRawUnsafe<unknown[]>('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL')
    assert.equal(history.length, 2)
  } finally { await legacy.$disconnect() }
})
