import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-auth'
import { importRecords, recordSchema, validateCatalog } from '@/lib/catalog-import'

export const runtime = 'nodejs'
const MAX_BYTES = 4 * 1024 * 1024
const batchSchema = z.object({
  schemaVersion: z.literal(1),
  records: z.array(recordSchema).min(1).max(50),
  dryRun: z.boolean().default(true),
  fillMissing: z.boolean().default(true),
  separateAmbiguous: z.boolean().default(true),
  requestId: z.string().regex(/^[a-zA-Z0-9:_-]{1,120}$/),
}).strict()

export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response
  return NextResponse.json({ schemaVersion: 1, maxBatchSize: 50, maxBytes: MAX_BYTES, modes: ['dry-run', 'fill-missing', 'add-only'] })
}

export async function POST(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response
  try {
    // Enforce the limit on actual bytes, including chunked requests without Content-Length.
    const reader = request.body?.getReader()
    if (!reader) return NextResponse.json({ error: 'Request body required' }, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel()
        return NextResponse.json({ error: 'Import batch exceeds 4 MB' }, { status: 413 })
      }
      chunks.push(value)
    }
    const body = batchSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    const records = validateCatalog({ schemaVersion: 1, records: body.records })
    const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex')
    const auditId = `catalog:${body.requestId}`
    const result = await prisma.$transaction(async tx => {
      if (!body.dryRun) {
        const prior = await tx.adminAuditLog.findUnique({ where: { id: auditId } })
        if (prior) {
          const saved = JSON.parse(prior.details || '{}')
          if (saved.digest !== digest) throw new Error('IDEMPOTENCY_CONFLICT')
          return { ...saved.report, replayed: true }
        }
      }
      const report = await importRecords(tx, records, body.fillMissing, body.dryRun, body.separateAmbiguous)
      if (!body.dryRun) {
        // The receipt and plant changes commit together. Retrying a timed-out batch is safe.
        await tx.adminAuditLog.create({ data: {
          id: auditId, adminId: 'api', adminEmail: 'api@system',
          action: 'import_plant_catalog_via_api', targetType: 'plant', targetId: body.requestId,
          details: JSON.stringify({ digest, report }),
        } })
      }
      return { ...report, replayed: false }
    }, { timeout: 60_000, maxWait: 30_000 })
    return NextResponse.json({ success: true, mode: body.dryRun ? 'dry-run' : 'applied', ...result })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError ||
        (error instanceof Error && /^(Duplicate source|Source\/scientific|Source URL)/.test(error.message))) {
      return NextResponse.json({ error: 'Invalid catalog batch' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT') {
      return NextResponse.json({ error: 'Request ID was already used for a different payload' }, { status: 409 })
    }
    console.error('Catalog import failed', error)
    return NextResponse.json({ error: 'Catalog import failed; retry the same request ID' }, { status: 500 })
  }
}
