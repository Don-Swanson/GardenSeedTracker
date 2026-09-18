import { PrismaClient } from '@prisma/client'
import { parseArgs } from 'node:util'
import { readCatalog, importRecords } from './importer'

async function main() {
  const { values } = parseArgs({ options: {
    file: { type: 'string' }, apply: { type: 'boolean', default: false },
    'fill-missing': { type: 'boolean', default: false },
    'separate-ambiguous': { type: 'boolean', default: true },
  } })
  if (!values.file) throw new Error('Usage: npm run catalog:import -- --file catalog.json [--apply] [--fill-missing]')
  // Validate the entire input before connecting or writing anything.
  const records = readCatalog(values.file)
  const prisma = new PrismaClient()
  try {
    const report = await prisma.$transaction(tx => importRecords(tx, records, values['fill-missing'], !values.apply, values['separate-ambiguous']), {
      timeout: 120_000, maxWait: 30_000,
    })
    console.log(JSON.stringify({ mode: values.apply ? 'applied' : 'dry-run', ...report }, null, 2))
    if (report.conflicts.length) process.exitCode = 2
  } finally { await prisma.$disconnect() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
