import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, Package } from 'lucide-react'
import SeedCard from '@/components/SeedCard'
import SeedFilters from '@/components/SeedFilters'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function SeedsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { category, search } = params
  
  // Get user session for user filtering
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return <div>Please sign in to view your seeds.</div>
  }
  const userId = session.user.id
  
  const where: any = { userId }
  
  if (category && category !== 'all') {
    where.OR = [
      { plantType: { category } },
      { customCategory: category },
    ]
  }
  
  if (search) {
    where.OR = [
      { plantType: { name: { contains: search } } },
      { customPlantName: { contains: search } },
      { nickname: { contains: search } },
      { variety: { contains: search } },
      { brand: { contains: search } },
    ]
  }

  const seeds = await prisma.seed.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      plantType: true,
      plantings: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          plantingEvents: { orderBy: { date: 'desc' }, take: 1 },
        },
      },
    },
  })

  // Get unique categories from seeds
  const seedsWithCategories = await prisma.seed.findMany({
    where: { userId },
    select: {
      plantType: { select: { category: true } },
      customCategory: true,
    },
  })
  
  const categorySet = new Set<string>()
  seedsWithCategories.forEach(s => {
    if (s.plantType?.category) categorySet.add(s.plantType.category)
    if (s.customCategory) categorySet.add(s.customCategory)
  })
  
  const categories = Array.from(categorySet).map(cat => ({
    category: cat,
    _count: seedsWithCategories.filter(s => 
      s.plantType?.category === cat || s.customCategory === cat
    ).length,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seed Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your seed collection ({seeds.length} varieties)
          </p>
        </div>
        <Link href="/seeds/new" className="btn btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Add Seeds
        </Link>
      </div>

      {/* Filters */}
      <SeedFilters 
        categories={categories} 
        currentCategory={category} 
        currentSearch={search} 
      />

      {/* Seeds Grid */}
      {seeds.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No seeds found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search || category 
              ? 'Try adjusting your filters or search terms.'
              : 'Start building your seed inventory by adding your first seeds.'}
          </p>
          <Link href="/seeds/new" className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Your First Seeds
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seeds.map((seed) => (
            <SeedCard key={seed.id} seed={seed} />
          ))}
        </div>
      )}
    </div>
  )
}
