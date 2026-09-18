import { Prisma, type PrismaClient } from '@prisma/client'

/** One vote per gardener across active inventory and unpurchased wishlist entries. */
export async function popularPlantIds(db: PrismaClient, options: { search?: string; category?: string; limit: number; offset: number }) {
  const pattern = `%${(options.search || '').replace(/[\\%_]/g, '\\$&')}%`
  const search = options.search ? Prisma.sql`AND (p.name LIKE ${pattern} ESCAPE '\\' OR p.scientificName LIKE ${pattern} ESCAPE '\\' OR p.commonNames LIKE ${pattern} ESCAPE '\\' OR p.description LIKE ${pattern} ESCAPE '\\')` : Prisma.empty
  const category = options.category ? Prisma.sql`AND p.category = ${options.category}` : Prisma.empty
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
    WHERE p.isApproved = 1 ${category} ${search}
    ORDER BY COALESCE(popularity.gardeners, 0) DESC, p.name COLLATE NOCASE ASC, p.id ASC
    LIMIT ${options.limit} OFFSET ${options.offset}
  `)
}
