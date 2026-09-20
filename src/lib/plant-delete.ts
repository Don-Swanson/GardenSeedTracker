import { Prisma } from '@prisma/client'

export async function deletePlantPreservingReferences(
  tx: Prisma.TransactionClient,
  plantId: string,
) {
  const plant = await tx.plantingGuide.findUnique({
    where: { id: plantId },
    include: {
      _count: {
        select: { seeds: true, wishlistItems: true, suggestions: true },
      },
    },
  })

  if (!plant) return null

  // Keep user-owned inventory useful after its encyclopedia entry is removed.
  await tx.seed.updateMany({
    where: { plantTypeId: plantId, customPlantName: null },
    data: { customPlantName: plant.name },
  })
  await tx.seed.updateMany({
    where: { plantTypeId: plantId, customCategory: null },
    data: { customCategory: plant.category },
  })
  await tx.seed.updateMany({
    where: { plantTypeId: plantId },
    data: { plantTypeId: null },
  })
  await tx.wishlistItem.updateMany({
    where: { plantTypeId: plantId, customPlantName: null },
    data: { customPlantName: plant.name },
  })
  await tx.wishlistItem.updateMany({
    where: { plantTypeId: plantId },
    data: { plantTypeId: null },
  })
  await tx.plantingGuide.delete({ where: { id: plantId } })

  return {
    plant,
    affected: {
      seeds: plant._count.seeds,
      wishlistItems: plant._count.wishlistItems,
      suggestions: plant._count.suggestions,
    },
  }
}
