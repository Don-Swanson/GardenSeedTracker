import { Prisma, PrismaClient } from '@prisma/client'

/** Check every application table, including settings and users, in the seed transaction. */
export async function seedIfEmpty(
  prisma: PrismaClient,
  seed: (tx: Prisma.TransactionClient) => Promise<void>,
) {
  return prisma.$transaction(async (tx) => {
    const tables = await tx.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
    `
    for (const { name } of tables) {
      // Table identifiers come from SQLite, and are still quoted defensively.
      const rows = await tx.$queryRawUnsafe<unknown[]>(`SELECT 1 FROM "${name.replace(/"/g, '""')}" LIMIT 1`)
      if (rows.length) return false
    }
    await seed(tx)
    return true
  }, { timeout: 120_000, maxWait: 30_000 })
}
