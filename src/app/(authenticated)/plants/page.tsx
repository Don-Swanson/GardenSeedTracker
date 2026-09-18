'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Leaf, Flower2, Apple, TreeDeciduous, Filter, Plus, Heart } from 'lucide-react'

interface Plant {
  id: string
  name: string
  category: string
  scientificName?: string
  description?: string
  sunRequirement?: string
  waterNeeds?: string
  daysToMaturity?: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  vegetable: <Apple className="w-5 h-5" />,
  herb: <Leaf className="w-5 h-5" />,
  flower: <Flower2 className="w-5 h-5" />,
  fruit: <TreeDeciduous className="w-5 h-5" />,
}

const categoryColors: Record<string, string> = {
  vegetable: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  herb: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700',
  flower: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
  fruit: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
}

export default function PlantsPage() {
  const { data: session } = useSession()
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const [sort, setSort] = useState('popular')
  const [sunlight, setSunlight] = useState('')
  const [zone, setZone] = useState('')
  const [water, setWater] = useState('')

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ page: String(page), limit: '48', search: searchTerm, category: selectedCategory, sort, sunlight, zone, water })
        const response = await fetch(`/api/plants?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load plants. Please try again.')
        const data = await response.json()
        setPlants(data.plants)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setCategories(data.categories)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load plants.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [page, searchTerm, selectedCategory, sort, sunlight, zone, water])

  const filteredPlants = plants

  // Group plants by category
  // Preserve the API ranking rather than regrouping popular plants by category.
  const groupedPlants = { plants: filteredPlants }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Encyclopedia</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Explore our comprehensive database of plants with growing guides, recipes, and more
          </p>
        </div>
        
        <Link
          href="/plants/new"
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Submit New Plant
        </Link>
      </div>

      {/* Donation Banner */}
      <div className="bg-gradient-to-r from-pink-50 to-garden-50 dark:from-pink-900/20 dark:to-garden-900/20 rounded-xl p-4 border border-pink-100 dark:border-pink-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-500 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Enjoying the Plant Encyclopedia?</span> Help us grow by supporting the project!
            </p>
          </div>
          <Link
            href="/donate"
            className="text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 whitespace-nowrap"
          >
            Donate →
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select aria-label="Sort plants" value={sort} onChange={event => { setSort(event.target.value); setPage(1) }} className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white">
          <option value="popular">Most popular</option>
          <option value="name">Name A–Z</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search plants by name or description..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}s
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sunlight
            <select value={sunlight} onChange={event => { setSunlight(event.target.value); setPage(1) }} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
              <option value="">Any sunlight</option>
              <option value="full-sun">Full sun</option>
              <option value="part-shade">Partial sun / shade</option>
              <option value="full-shade">Full shade</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">USDA hardiness zone
            <select value={zone} onChange={event => { setZone(event.target.value); setPage(1) }} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
              <option value="">Any zone</option>
              {Array.from({ length: 13 }, (_, index) => index + 1).flatMap(number => ['a', 'b'].map(half => <option key={`${number}${half}`} value={`${number}${half}`}>{number}{half}</option>))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watering
            <select value={water} onChange={event => { setWater(event.target.value); setPage(1) }} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
              <option value="">Any watering</option>
              <option value="low">Low / minimal</option>
              <option value="average">Average / moderate</option>
              <option value="frequent">Frequent / high</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Plants must match every selected filter. Plants with unknown values are excluded for that filter.</p>
        {(sunlight || zone || water || selectedCategory || searchTerm) && <button type="button" className="btn-secondary" onClick={() => { setSunlight(''); setZone(''); setWater(''); setSelectedCategory(''); setSearchTerm(''); setPage(1) }}>Clear filters</button>}
      </div>
      {sort === 'popular' && <p className="text-sm text-gray-600 dark:text-gray-400">Popularity reflects gardeners with each plant in active inventory or on their wishlist.</p>}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {loading ? 'Loading plants…' : `${total.toLocaleString()} plants found · Page ${page} of ${Math.max(1, totalPages)}`}
      </p>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button type="button" className="btn-secondary" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button type="button" className="btn-secondary" disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {/* Plants by Category */}
      {Object.entries(groupedPlants).map(([category, categoryPlants]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 capitalize">
            {categoryIcons[category] || <Leaf className="w-5 h-5" />}
            Plants
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({categoryPlants.length})
            </span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryPlants.map(plant => (
              <Link
                key={plant.id}
                href={`/plants/${plant.id}`}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-garden-600 dark:group-hover:text-garden-400 transition-colors">
                    {plant.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[plant.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                    {plant.category}
                  </span>
                </div>
                
                {plant.scientificName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                    {plant.scientificName}
                  </p>
                )}
                
                {plant.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {plant.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {plant.sunRequirement && (
                    <span className="bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-200 px-2 py-1 rounded">
                      ☀️ {plant.sunRequirement}
                    </span>
                  )}
                  {plant.waterNeeds && (
                    <span className="bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-1 rounded">
                      💧 {plant.waterNeeds}
                    </span>
                  )}
                  {plant.daysToMaturity && (
                    <span className="bg-green-50 dark:bg-green-900/30 dark:text-green-200 px-2 py-1 rounded">
                      🌱 {plant.daysToMaturity} days
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {!loading && !error && filteredPlants.length === 0 && (
        <div className="text-center py-12">
          <Leaf className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No plants found</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}
