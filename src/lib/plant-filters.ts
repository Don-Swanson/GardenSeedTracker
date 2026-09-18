import { Prisma } from '@prisma/client'
import { z } from 'zod'

const filtersSchema = z.object({
  sunlight: z.array(z.enum(['full-sun', 'part-shade', 'full-shade'])).default([]),
  water: z.array(z.enum(['low', 'average', 'frequent'])).default([]),
  zone: z.string().regex(/^(?:[1-9]|1[0-3])[ab]$/).optional(),
})
export type PlantFilters = z.infer<typeof filtersSchema>
export function parsePlantFilters(params: URLSearchParams): PlantFilters {
  const list = (name: string) => [...new Set(params.getAll(name).flatMap(value => value.split(',')).map(value => value.trim().toLowerCase()).filter(Boolean))]
  return filtersSchema.parse({ sunlight: list('sunlight'), water: list('water'), zone: params.get('zone')?.trim().toLowerCase() || undefined })
}

/** AND between criteria, OR within a criterion; shared by ranking and result counts. */
export function plantFilterSql(options: Partial<PlantFilters> & { search?: string; category?: string }) {
  const clauses: Prisma.Sql[] = [Prisma.sql`p.isApproved = 1`]
  if (options.category) clauses.push(Prisma.sql`p.category = ${options.category}`)
  if (options.search) {
    const pattern = `%${options.search.replace(/[\\%_]/g, '\\$&')}%`
    clauses.push(Prisma.sql`(p.name LIKE ${pattern} ESCAPE '\\' OR p.scientificName LIKE ${pattern} ESCAPE '\\' OR p.commonNames LIKE ${pattern} ESCAPE '\\' OR p.description LIKE ${pattern} ESCAPE '\\')`)
  }
  const sun = Prisma.sql`LOWER(COALESCE(p.sunRequirement, ''))`
  const sunConditions = (options.sunlight || []).map(value => {
    if (value === 'full-sun') return Prisma.sql`(${sun} LIKE '%full sun%' OR TRIM(${sun}) = 'sun' OR ${sun} LIKE 'sun,%')`
    if (value === 'part-shade') return Prisma.sql`(${sun} LIKE '%part shade%' OR ${sun} LIKE '%partial shade%' OR ${sun} LIKE '%part sun%' OR ${sun} LIKE '%partial sun%' OR ${sun} LIKE '%filtered shade%')`
    return Prisma.sql`(${sun} LIKE '%full shade%' OR ${sun} LIKE '%deep shade%' OR TRIM(${sun}) = 'shade')`
  })
  if (sunConditions.length) clauses.push(Prisma.sql`(${Prisma.join(sunConditions, ' OR ')})`)
  const water = Prisma.sql`LOWER(TRIM(COALESCE(p.waterNeeds, '')))`
  const waterConditions = (options.water || []).map(value => {
    if (value === 'average') return Prisma.sql`(${water} LIKE 'average%' OR ${water} LIKE 'moderate%' OR ${water} LIKE 'medium%')`
    if (value === 'low') return Prisma.sql`(${water} LIKE 'minimum%' OR ${water} LIKE 'minimal%' OR ${water} LIKE 'low%')`
    return Prisma.sql`(${water} LIKE 'frequent%' OR ${water} LIKE 'high%')`
  })
  if (waterConditions.length) clauses.push(Prisma.sql`(${Prisma.join(waterConditions, ' OR ')})`)
  if (options.zone) {
    const wholeZone = options.zone.slice(0, -1)
    clauses.push(Prisma.sql`EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(p.hardinessZones) THEN p.hardinessZones ELSE '[]' END) zones WHERE LOWER(CAST(zones.value AS TEXT)) IN (${options.zone}, ${wholeZone}))`)
  }
  return Prisma.sql`${Prisma.join(clauses, ' AND ')}`
}
