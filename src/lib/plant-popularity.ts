import { Prisma, type PrismaClient } from '@prisma/client'
import { plantFilterSql, type PlantFilters } from './plant-filters'

/** One vote per gardener across active inventory and unpurchased wishlist entries. */
export async function popularPlantIds(db: PrismaClient, options: Partial<PlantFilters> & { search?: string; category?: string; limit: number; offset: number; sort?: string }) {
  const order = options.sort === 'name' ? Prisma.sql`p.name COLLATE NOCASE ASC, p.id ASC` : Prisma.sql`COALESCE(popularity.gardeners, 0) DESC, p.name COLLATE NOCASE ASC, p.id ASC`
  return db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH interest AS (
      SELECT plantTypeId, userId FROM Seed WHERE isArchived = 0 AND plantTypeId IS NOT NULL
      UNION
      SELECT plantTypeId, userId FROM WishlistItem WHERE purchased = 0 AND plantTypeId IS NOT NULL
    ), popularity AS (
      SELECT plantTypeId, COUNT(*) AS gardeners FROM interest GROUP BY plantTypeId
    )
    SELECT p.id FROM PlantingGuide p
    LEFT JOIN popularity ON popularity.plantTypeId = p.id
    WHERE ${plantFilterSql(options)}
    ORDER BY ${order}
    LIMIT ${options.limit} OFFSET ${options.offset}
  `)
}
