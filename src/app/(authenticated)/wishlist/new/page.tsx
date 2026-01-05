'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Star, Search, X, Calendar } from 'lucide-react'
import Link from 'next/link'
import { seedCategories } from '@/lib/garden-utils'

interface PlantType {
  id: string
  name: string
  category: string
  scientificName?: string
  indoorStartWeeks?: number
  outdoorStartWeeks?: number
}

export default function NewWishlistItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState(3)

  // Plant type autocomplete state
  const [plantSearch, setPlantSearch] = useState('')
  const [plantSuggestions, setPlantSuggestions] = useState<PlantType[]>([])
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null)
  const [isCustomPlant, setIsCustomPlant] = useState(false)
  const [customPlantName, setCustomPlantName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Custom planting dates (for items not linked to encyclopedia)
  const [indoorStartWeeks, setIndoorStartWeeks] = useState<string>('')
  const [outdoorStartWeeks, setOutdoorStartWeeks] = useState<string>('')

  // Fetch plants from encyclopedia
  const searchPlants = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPlantSuggestions([])
      return
    }
    
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/plants?search=${encodeURIComponent(query)}`)
      if (res.ok) {
        const plants = await res.json()
        setPlantSuggestions(plants.slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to search plants:', err)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (plantSearch && !selectedPlant) {
      debounceRef.current = setTimeout(() => {
        searchPlants(plantSearch)
      }, 300)
    } else {
      setPlantSuggestions([])
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [plantSearch, selectedPlant, searchPlants])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlant = (plant: PlantType) => {
    setSelectedPlant(plant)
    setPlantSearch(plant.name)
    setShowSuggestions(false)
    setIsCustomPlant(false)
    setCustomPlantName('')
    // Clear custom dates since we're using encyclopedia data
    setIndoorStartWeeks('')
    setOutdoorStartWeeks('')
  }

  const handleUseCustomPlant = () => {
    setIsCustomPlant(true)
    setCustomPlantName(plantSearch)
    setSelectedPlant(null)
    setShowSuggestions(false)
  }

  const handleClearSelection = () => {
    setSelectedPlant(null)
    setIsCustomPlant(false)
    setCustomPlantName('')
    setPlantSearch('')
    setPlantSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!selectedPlant && !customPlantName) {
      setError('Please select a plant from the encyclopedia or enter a custom plant name.')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const data = {
      plantTypeId: selectedPlant?.id || null,
      customPlantName: isCustomPlant ? customPlantName : null,
      variety: formData.get('variety') || null,
      brand: formData.get('brand') || null,
      estimatedPrice: parseFloat(formData.get('estimatedPrice') as string) || null,
      priority,
      sourceUrl: formData.get('sourceUrl') || null,
      notes: formData.get('notes') || null,
      // Custom planting dates (only for custom plants)
      indoorStartWeeks: isCustomPlant && indoorStartWeeks ? parseInt(indoorStartWeeks) : null,
      outdoorStartWeeks: isCustomPlant && outdoorStartWeeks ? parseInt(outdoorStartWeeks) : null,
    }

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to add item')

      router.push('/wishlist')
      router.refresh()
    } catch (err) {
      setError('Failed to add item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/wishlist" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Wishlist
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add to Wishlist</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Add seeds you want to buy</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Plant Type Selection */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Plant Type</h2>
          
          <div ref={searchRef} className="relative">
            <label htmlFor="plantSearch" className="label">Plant Name *</label>
            
            {selectedPlant ? (
              <div className="flex items-center gap-3 p-3 bg-garden-50 dark:bg-garden-900/30 border border-garden-200 dark:border-garden-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedPlant.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {seedCategories.find(c => c.value === selectedPlant.category)?.emoji} {selectedPlant.category}
                    {selectedPlant.scientificName && <span className="italic ml-2">({selectedPlant.scientificName})</span>}
                  </div>
                  {(selectedPlant.indoorStartWeeks || selectedPlant.outdoorStartWeeks) && (
                    <div className="text-xs text-garden-600 dark:text-garden-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Planting dates available for calendar
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1 hover:bg-garden-100 dark:hover:bg-garden-800 rounded"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ) : isCustomPlant ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-amber-700 dark:text-amber-300 mb-2">Custom plant (not in encyclopedia)</div>
                    <input
                      type="text"
                      value={customPlantName}
                      onChange={(e) => setCustomPlantName(e.target.value)}
                      className="input"
                      placeholder="Enter plant name"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800 rounded self-start mt-6"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Custom planting dates */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-200">Custom Planting Dates</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Add custom planting dates so this item appears in your calendar. Dates are relative to your last frost date.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label text-blue-800 dark:text-blue-200">Indoor Start</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={indoorStartWeeks}
                          onChange={(e) => setIndoorStartWeeks(e.target.value)}
                          className="input"
                          placeholder="e.g., 6"
                          min="0"
                          max="20"
                        />
                        <span className="text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">weeks before frost</span>
                      </div>
                    </div>
                    <div>
                      <label className="label text-blue-800 dark:text-blue-200">Direct Sow</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={outdoorStartWeeks}
                          onChange={(e) => setOutdoorStartWeeks(e.target.value)}
                          className="input"
                          placeholder="e.g., 2"
                        />
                        <span className="text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">weeks after frost</span>
                      </div>
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Use negative for before frost</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="plantSearch"
                    value={plantSearch}
                    onChange={(e) => {
                      setPlantSearch(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="input pl-10"
                    placeholder="Search plant encyclopedia..."
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-garden-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (plantSuggestions.length > 0 || plantSearch.length >= 2) && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {plantSuggestions.map((plant) => (
                      <button
                        key={plant.id}
                        type="button"
                        onClick={() => handleSelectPlant(plant)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <span>{seedCategories.find(c => c.value === plant.category)?.emoji || '🌱'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{plant.name}</div>
                          {plant.scientificName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">{plant.scientificName}</div>
                          )}
                        </div>
                        {(plant.indoorStartWeeks || plant.outdoorStartWeeks) && (
                          <span title="Has planting dates"><Calendar className="w-4 h-4 text-garden-500" /></span>
                        )}
                      </button>
                    ))}
                    {plantSearch.length >= 2 && (
                      <button
                        type="button"
                        onClick={handleUseCustomPlant}
                        className="w-full px-4 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-900/30 border-t border-gray-200 dark:border-gray-700 text-amber-700 dark:text-amber-300"
                      >
                        <span className="font-medium">+ Use &quot;{plantSearch}&quot; as custom plant</span>
                        <span className="text-xs block">Not in encyclopedia - add your own planting dates</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Search the plant encyclopedia for accurate planting dates, or add a custom plant.
            </p>
          </div>
        </div>

        {/* Variety & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="variety" className="label">Variety</label>
            <input 
              type="text" 
              id="variety" 
              name="variety" 
              className="input"
              placeholder="e.g., Brandywine"
            />
          </div>
          <div>
            <label htmlFor="brand" className="label">Brand</label>
            <input 
              type="text" 
              id="brand" 
              name="brand" 
              className="input"
              placeholder="e.g., Baker Creek"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="estimatedPrice" className="label">Estimated Price ($)</label>
          <input 
            type="number" 
            id="estimatedPrice" 
            name="estimatedPrice"
            step="0.01"
            min="0" 
            className="input"
            placeholder="e.g., 3.50"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <button
                key={starIndex}
                type="button"
                onClick={() => setPriority(starIndex)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    starIndex <= priority
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {priority === 5 ? 'Highest' : priority === 1 ? 'Lowest' : 'Medium'} priority
            </span>
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label htmlFor="sourceUrl" className="label">Source URL</label>
          <input 
            type="url" 
            id="sourceUrl" 
            name="sourceUrl" 
            className="input"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Link to where you can buy this seed</p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">Notes</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={3}
            className="input"
            placeholder="Why you want this seed, when to buy, etc."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add to Wishlist'}
          </button>
          <Link href="/wishlist" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
