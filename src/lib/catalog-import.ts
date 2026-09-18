import { Prisma } from '@prisma/client'
import { z } from 'zod'

const optionalText = z.string().max(200_000).optional()
const optionalInteger = z.number().int().min(-500).max(10_000).optional()
export const recordSchema = z.object({
  name: z.string().trim().min(1).max(500),
  scientificName: z.string().trim().min(3).max(500),
  category: z.enum(['vegetable', 'herb', 'flower', 'fruit', 'tree', 'shrub', 'grass', 'other']),
  commonNames: optionalText,
  description: optionalText,
  generalInfo: optionalText,
  subcategory: optionalText,
  hardinessZones: z.string().refine(value => {
    try { return z.array(z.string().regex(/^(?:[1-9]|1[0-3])[ab]$/)).safeParse(JSON.parse(value)).success }
    catch { return false }
  }, 'Expected a JSON array of USDA half-zones').optional(),
  zoneNotes: optionalText,
  sunRequirement: optionalText,
  waterNeeds: optionalText,
  soilPH: optionalText,
  indoorStartWeeks: z.number().int().min(0).max(104).optional(),
  outdoorStartWeeks: z.number().int().min(-104).max(104).optional(),
  transplantWeeks: z.number().int().min(-104).max(104).optional(),
  harvestWeeks: z.number().int().min(1).max(2600).optional(),
  daysToGerminate: optionalInteger,
  daysToMaturity: optionalInteger,
  minGrowingTemp: optionalInteger,
  maxGrowingTemp: optionalInteger,
  spacing: optionalText,
  plantingDepth: optionalText,
  rowSpacing: optionalText,
  companionPlants: optionalText,
  avoidPlants: optionalText,
  commonPests: optionalText,
  commonDiseases: optionalText,
  organicPestControl: optionalText,
  harvestTips: optionalText,
  storageTips: optionalText,
  preservationMethods: optionalText,
  imageUrl: z.string().url().refine(value => new URL(value).protocol === 'https:', 'Image URL must use HTTPS').optional(),
  culinaryUses: optionalText,
  medicinalUses: optionalText,
  holisticUses: optionalText,
  cautions: optionalText,
  notes: optionalText,
  sourceName: z.string().trim().min(1).max(100),
  sourceId: z.string().trim().min(1).max(500),
  sourceUrl: z.string().url().refine(value => {
    const url = new URL(value)
    return url.protocol === 'https:'
  }, 'Source URL must use HTTPS'),
  sourceLicense: optionalText,
  sourceRetrievedAt: z.string().datetime(),
  sourceData: z.string().max(500_000).refine(value => {
    try { return !!JSON.parse(value) && typeof JSON.parse(value) === 'object' } catch { return false }
  }),
}).strict()

export type CatalogRecord = z.infer<typeof recordSchema>
export function validateCatalog(input: unknown): CatalogRecord[] {
  const catalog = z.object({ schemaVersion: z.literal(1), records: z.array(recordSchema).min(1) }).passthrough().parse(input)
  const identities = new Set<string>()
  for (const record of catalog.records) {
    const identity = sourceIdentity(record.sourceName, record.sourceId)
    if (identities.has(identity)) throw new Error(`Duplicate source identity: ${record.sourceId}`)
    identities.add(identity)
  }
  return catalog.records
}

export function normalizeIdentity(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

function sourceIdentity(sourceName: string, sourceId: string) {
  return `${normalizeIdentity(sourceName)}:${normalizeIdentity(sourceId)}`
}

/** Add-only by default. Explicit enrichment fills blanks, preserving all curated values and IDs. */
export async function importRecords(tx: Prisma.TransactionClient, records: CatalogRecord[], fillMissing: boolean, dryRun = false, separateAmbiguous = false) {
  const existing = await tx.plantingGuide.findMany()
  const sourceMap = new Map<string, typeof existing[number]>()
  const scientificMap = new Map<string, typeof existing>()
  const nameMap = new Map<string, typeof existing[number]>()
  for (const plant of existing) {
    if (plant.sourceName && plant.sourceId) sourceMap.set(sourceIdentity(plant.sourceName, plant.sourceId), plant)
    if (plant.scientificName) {
      const key = normalizeIdentity(plant.scientificName)
      scientificMap.set(key, [...(scientificMap.get(key) || []), plant])
    }
    nameMap.set(normalizeIdentity(plant.name), plant)
  }
  const report = { input: records.length, created: 0, enriched: 0, skipped: 0, conflicts: [] as string[] }
  for (const record of records) {
    const key = sourceIdentity(record.sourceName, record.sourceId)
    const candidates = scientificMap.get(normalizeIdentity(record.scientificName)) || []
    let match = sourceMap.get(key)
    if (!match && candidates.length > 1 && !separateAmbiguous) {
      report.conflicts.push(`Ambiguous scientific name: ${record.scientificName}`)
      continue
    }
    if (!match && candidates.length === 1) {
      const candidate = candidates[0]
      // A legacy/curated plant with no provider identity can safely adopt a scientific match.
      // Provider records with different IDs remain distinct when the caller requests separation.
      if (!separateAmbiguous || !candidate.sourceName || !candidate.sourceId) match = candidate
    }
    // A common name alone cannot establish species identity. Preserve unclassified curated entries.
    const sameName = nameMap.get(normalizeIdentity(record.name))
    if (!match && sameName && !sameName.scientificName && !separateAmbiguous) {
      report.conflicts.push(`Existing common name needs a scientific name: ${record.name}`)
      continue
    }
    const data = { ...record, sourceRetrievedAt: new Date(record.sourceRetrievedAt) }
    if (match) {
      if (!fillMissing) { report.skipped++; continue }
      const patch: Record<string, unknown> = {}
      for (const [field, value] of Object.entries(data)) {
        if (['name', 'scientificName', 'category'].includes(field)) continue
        const current = match[field as keyof typeof match]
        if ((current === null || current === '') && value !== '') patch[field] = value
      }
      // Refresh extraction evidence only for an existing record from this exact source.
      if (match.sourceName && match.sourceId && sourceIdentity(match.sourceName, match.sourceId) === key && match.sourceData !== record.sourceData) {
        patch.sourceData = data.sourceData
        patch.sourceRetrievedAt = data.sourceRetrievedAt
      }
      if (!Object.keys(patch).length) { report.skipped++; continue }
      if (!dryRun) await tx.plantingGuide.update({ where: { id: match.id }, data: patch })
      Object.assign(match, patch)
      report.enriched++
      continue
    }
    // Distinct species sharing a common name remain distinct plants.
    let name = record.name
    if (nameMap.has(normalizeIdentity(name))) name = `${record.name} (${record.scientificName})`
    if (nameMap.has(normalizeIdentity(name))) {
      report.conflicts.push(`Display name collision: ${name}`)
      continue
    }
    const created = dryRun
      ? { ...data, name, id: `preview:${key}` } as typeof existing[number]
      : await tx.plantingGuide.create({ data: { ...data, name } })
    sourceMap.set(key, created)
    const scientificKey = normalizeIdentity(record.scientificName)
    scientificMap.set(scientificKey, [...(scientificMap.get(scientificKey) || []), created])
    nameMap.set(normalizeIdentity(name), created)
    report.created++
  }
  return report
}
