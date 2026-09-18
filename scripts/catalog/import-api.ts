import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import { readCatalog, type CatalogRecord } from './importer'

const receiptSchema = z.object({
  success: z.literal(true), mode: z.enum(['dry-run', 'applied']),
  input: z.number().int().nonnegative(), created: z.number().int().nonnegative(),
  enriched: z.number().int().nonnegative(), skipped: z.number().int().nonnegative(),
  conflicts: z.array(z.string()), replayed: z.boolean(),
})
const checkpointSchema = z.object({
  version: z.literal(1), identity: z.string(), runId: z.string(),
  receipts: z.array(receiptSchema),
})

async function main() {
  const { values } = parseArgs({ options: {
    file: { type: 'string' }, url: { type: 'string' },
    apply: { type: 'boolean', default: false },
    checkpoint: { type: 'string' }, 'allow-partial': { type: 'boolean', default: false },
  } })
  if (!values.file) throw new Error('Specify --file <catalog.json>. API target uses --url or GST_API_URL; credentials use ADMIN_API_KEY.')
  const base = new URL(values.url || process.env.GST_API_URL || '')
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Use the GST origin URL without credentials, query, fragment or path')
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) throw new Error('Remote API imports require HTTPS')
  const key = process.env.ADMIN_API_KEY
  if (!key) throw new Error('Set ADMIN_API_KEY in the process environment (never pass credentials on the command line)')
  const file = resolve(values.file)
  const raw = readFileSync(file, 'utf8')
  const catalog = JSON.parse(raw)
  const manifest = catalog.manifest
  if (!values['allow-partial'] && (
    manifest?.complete !== true ||
    manifest?.failures?.length ||
    manifest?.exportedRecords !== catalog.records?.length ||
    (manifest?.expectedRecords !== undefined && manifest.expectedRecords !== manifest.exportedRecords)
  )) {
    throw new Error('Catalog manifest does not prove a complete export. Finish collection before importing, or explicitly use --allow-partial for a test/sample.')
  }
  const records = readCatalog(file)
  const endpoint = new URL('/api/v1/admin/plants/import', base).href
  const mode = values.apply ? 'applied' : 'dry-run'
  // Batch layout is deterministic and below both server count and body-byte limits.
  const batches: CatalogRecord[][] = []
  let batch: CatalogRecord[] = [], bytes = 0
  for (const record of records) {
    const size = Buffer.byteLength(JSON.stringify(record), 'utf8') + 1
    if (batch.length && (batch.length >= 50 || bytes + size > 3_500_000)) { batches.push(batch); batch = []; bytes = 0 }
    if (size > 3_500_000) throw new Error(`Record exceeds the import size limit: ${record.sourceId}`)
    batch.push(record); bytes += size
  }
  if (batch.length) batches.push(batch)
  const identity = createHash('sha256').update(JSON.stringify({ endpoint, mode, exportHash: createHash('sha256').update(raw).digest('hex'), batches: batches.map(b => b.length) })).digest('hex')
  const path = resolve(values.checkpoint || `${file}.${values.apply ? 'apply' : 'preview'}.checkpoint.json`)
  const checkpoint = existsSync(path) ? checkpointSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) : { version: 1 as const, identity, runId: randomUUID(), receipts: [] as z.infer<typeof receiptSchema>[] }
  if (checkpoint.identity !== identity || checkpoint.receipts.length > batches.length) throw new Error('Checkpoint belongs to a different export, destination or mode; specify a new --checkpoint path')
  const save = () => { writeFileSync(path + '.tmp', JSON.stringify(checkpoint, null, 2) + '\n', { mode: 0o600 }); renameSync(path + '.tmp', path) }
  // Persist request IDs before the first write, so an interrupted request can always be replayed.
  save()
  async function request(body?: unknown) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(90_000),
          headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {}),
        })
        if (!response.ok) {
          if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 4) {
            const retryAfter = response.headers.get('retry-after')
            const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : 2 ** attempt
            if (seconds > 60) throw new Error(`API requests a ${seconds}-second delay; resume with the same checkpoint later`)
            await delay(Math.max(seconds, 2 ** attempt) * 1000); continue
          }
          throw new Error(`API returned HTTP ${response.status}; verify the deployed import endpoint and API credentials`)
        }
        return await response.json()
      } catch (error) {
        // Only network/time-out failures are retried here; HTTP/validation failures remain visible.
        if (!(error instanceof TypeError) && !(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name))) throw error
        if (attempt === 4) throw new Error('API connection failed; resume with the same checkpoint after checking connectivity')
        await delay(2 ** attempt * 1000)
      }
    }
    throw new Error('API retry limit reached')
  }
  const capabilities = await request()
  if (capabilities.schemaVersion !== 1 || capabilities.maxBatchSize < 50) throw new Error('Deployed API does not support this catalog importer')
  console.log(`${mode}: ${records.length} plants → ${base.origin}; ${checkpoint.receipts.length}/${batches.length} batches already acknowledged`)
  for (let i = checkpoint.receipts.length; i < batches.length; i++) {
    const receipt = receiptSchema.parse(await request({ schemaVersion: 1, records: batches[i], dryRun: !values.apply, fillMissing: true, separateAmbiguous: true, requestId: `${checkpoint.runId}:${i}` }))
    if (receipt.mode !== mode || receipt.input !== batches[i].length || receipt.created + receipt.enriched + receipt.skipped + receipt.conflicts.length !== receipt.input) throw new Error('API returned an inconsistent receipt; checkpoint retained for investigation')
    checkpoint.receipts.push(receipt); save()
    console.log(`Batch ${i + 1}/${batches.length}: ${receipt.created} created, ${receipt.enriched} enriched, ${receipt.skipped} unchanged, ${receipt.conflicts.length} conflicts`)
  }
  const summary = checkpoint.receipts.reduce((total, receipt) => ({
    input: total.input + receipt.input, created: total.created + receipt.created,
    enriched: total.enriched + receipt.enriched, skipped: total.skipped + receipt.skipped,
    conflicts: [...total.conflicts, ...receipt.conflicts],
  }), { input: 0, created: 0, enriched: 0, skipped: 0, conflicts: [] as string[] })
  console.log(JSON.stringify({ mode, target: base.origin, ...summary, checkpoint: path }, null, 2))
  if (summary.conflicts.length) process.exitCode = 2
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Import failed'); process.exitCode = 1 })
