import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, Package } from 'lucide-react'
import SeedCard from '@/components/SeedCard'
import SeedFilters from '@/components/SeedFilters'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function SeedsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { category, search } = params
  
  const where: any = {}
  
  if (category && category !== 'all') {
    where.category = category
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { variety: { contains: search } },
      { brand: { contains: search } },
    ]
  }

  const seeds = await prisma.seed.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      plantings: {
        orderBy: { plantingDate: 'desc' },
        take: 1,
      },
    },
  })

  const categories = await prisma.seed.groupBy({
    by: ['category'],
    _count: true,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seed Inventory</h1>
          <p className="text-gray-600 mt-1">
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
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No seeds found</h3>
          <p className="text-gray-500 mb-4">
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
