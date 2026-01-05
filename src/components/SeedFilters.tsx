'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { seedCategories } from '@/lib/garden-utils'

interface SeedFiltersProps {
  categories: { category: string | null; _count: number }[]
  currentCategory?: string
  currentSearch?: string
}

export default function SeedFilters({ categories, currentCategory, currentSearch }: SeedFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || '')

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    router.push(`/seeds?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    router.push(`/seeds?${params.toString()}`)
  }

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search seeds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </form>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentCategory || currentCategory === 'all'
                ? 'bg-garden-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {seedCategories.map((cat) => {
            const count = categories.find(c => c.category === cat.value)?._count || 0
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  currentCategory === cat.value
                    ? 'bg-garden-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.emoji} {cat.label} ({count})
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
