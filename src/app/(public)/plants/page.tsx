'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Leaf, Flower2, Apple, TreeDeciduous, Filter, Plus, LogIn } from 'lucide-react'

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

  useEffect(() => {
    fetchPlants()
  }, [])

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
      if (response.ok) {
        const data = await response.json()
        setPlants(data)
        // Extract unique categories
        const categorySet = new Set<string>()
        data.forEach((p: Plant) => categorySet.add(p.category))
        setCategories(Array.from(categorySet))
      }
    } catch (error) {
      console.error('Error fetching plants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || plant.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group plants by category
  const groupedPlants = filteredPlants.reduce((acc, plant) => {
    const cat = plant.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(plant)
    return acc
  }, {} as Record<string, Plant[]>)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-600"></div>
      </div>
    )
  }

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
        
        {session ? (
          <Link
            href="/plants/new"
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Submit New Plant
          </Link>
        ) : (
          <Link
            href="/auth/signin"
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            Sign in to Submit Plants
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search plants by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-garden-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredPlants.length} of {plants.length} plants
      </p>

      {/* Plants by Category */}
      {Object.entries(groupedPlants).map(([category, categoryPlants]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 capitalize">
            {categoryIcons[category] || <Leaf className="w-5 h-5" />}
            {category}s
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

      {filteredPlants.length === 0 && (
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
