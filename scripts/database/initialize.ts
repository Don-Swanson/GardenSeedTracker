import { PrismaClient } from '@prisma/client'
import { readFileSync, closeSync, openSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const baseline = '20260913000000_baseline'
const prismaCli = resolve('node_modules/prisma/build/index.js')
const migrate = (...args: string[]) => execFileSync(process.execPath, [prismaCli, 'migrate', ...args], { stdio: 'inherit' })

async function main() {
  const url = process.env.DATABASE_URL
  if (!url?.startsWith('file:/') || url.includes('?')) {
    throw new Error('Set DATABASE_URL to an absolute SQLite URL, e.g. file:/app/data/garden.db')
  }
  // Never truncate an existing file. Required for Prisma 6 on some platforms.
  closeSync(openSync(url.slice(5), 'a', 0o600))
  const prisma = new PrismaClient()
  let needsBaseline = false
  try {
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
    const hasHistory = tables.some(table => table.name === '_prisma_migrations')
    const history = hasHistory ? await prisma.$queryRaw<Array<{ migration_name: string }>>`SELECT migration_name FROM _prisma_migrations` : []
    needsBaseline = history.length === 0 && tables.some(table => table.name !== '_prisma_migrations')
    if (needsBaseline) {
      // Adopt pre-migration installations without rebuilding tables or dropping legacy columns.
      // This baseline only creates missing tables/indexes, and validates the columns we depend on.
      const sql = readFileSync(resolve('prisma/migrations', baseline, 'migration.sql'), 'utf8')
      await prisma.$transaction(async tx => {
        for (const statement of sql.split(';').map(s => s.replace(/^--.*$/gm, '').trim()).filter(Boolean)) {
          if (!/^CREATE (TABLE|UNIQUE INDEX|INDEX) /.test(statement)) throw new Error('Baseline must contain only CREATE statements')
          const safe = statement.replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
            .replace(/^CREATE UNIQUE INDEX /, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
            .replace(/^CREATE INDEX /, 'CREATE INDEX IF NOT EXISTS ')
          await tx.$executeRawUnsafe(safe)
        }
        for (const match of Array.from(sql.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g))) {
          const [, table, definition] = match
          const actual = await tx.$queryRawUnsafe<Array<{ name: string; type: string }>>(`PRAGMA table_info("${table.replace(/"/g, '""')}")`)
          for (const column of Array.from(definition.matchAll(/^\s+"([^"]+)" (\w+)/gm))) {
            if (!actual.some(item => item.name === column[1] && item.type.toUpperCase() === column[2])) {
              throw new Error(`Existing schema needs a reviewed migration for ${table}.${column[1]}; no data was removed.`)
            }
          }
        }
      }, { timeout: 30_000 })
    }
  } finally { await prisma.$disconnect() }
  if (needsBaseline) migrate('resolve', '--applied', baseline)
  migrate('deploy')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
