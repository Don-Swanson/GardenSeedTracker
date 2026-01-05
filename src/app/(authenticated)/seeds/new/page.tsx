'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { seedCategories, sunRequirements, waterNeeds } from '@/lib/garden-utils'

interface PlantType {
  id: string
  name: string
  category: string
  scientificName?: string
  description?: string
  sunRequirement?: string
  waterNeeds?: string
  daysToMaturity?: number
}

export default function NewSeedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Plant type autocomplete state
  const [plantSearch, setPlantSearch] = useState('')
  const [plantSuggestions, setPlantSuggestions] = useState<PlantType[]>([])
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null)
  const [isCustomPlant, setIsCustomPlant] = useState(false)
  const [customPlantName, setCustomPlantName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

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
        setPlantSuggestions(plants.slice(0, 10)) // Limit to 10 suggestions
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
    setCustomCategory('')
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
    setCustomCategory('')
    setPlantSearch('')
    setPlantSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate that either a plant type is selected or custom name is provided
    if (!selectedPlant && !customPlantName) {
      setError('Please select a plant type from the encyclopedia or enter a custom plant name.')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const data = {
      plantTypeId: selectedPlant?.id || null,
      customPlantName: isCustomPlant ? customPlantName : null,
      customCategory: isCustomPlant ? customCategory : null,
      variety: formData.get('variety') || null,
      brand: formData.get('brand') || null,
      quantity: parseInt(formData.get('quantity') as string) || 1,
      quantityUnit: formData.get('quantityUnit') || 'seeds',
      purchaseDate: formData.get('purchaseDate') || null,
      expirationDate: formData.get('expirationDate') || null,
      daysToGerminate: parseInt(formData.get('daysToGerminate') as string) || null,
      daysToMaturity: parseInt(formData.get('daysToMaturity') as string) || null,
      sunRequirement: formData.get('sunRequirement') || null,
      waterNeeds: formData.get('waterNeeds') || null,
      spacing: formData.get('spacing') || null,
      plantingDepth: formData.get('plantingDepth') || null,
      notes: formData.get('notes') || null,
    }

    try {
      const res = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create seed')

      router.push('/seeds')
      router.refresh()
    } catch (err) {
      setError('Failed to create seed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/seeds" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Seeds
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Seeds</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Add seeds to your inventory</p>
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
          
          {/* Search or Selected Plant Display */}
          <div ref={searchRef} className="relative">
            <label htmlFor="plantSearch" className="label">Plant Name *</label>
            
            {selectedPlant ? (
              // Show selected encyclopedia plant
              <div className="flex items-center gap-3 p-3 bg-garden-50 dark:bg-garden-900/30 border border-garden-200 dark:border-garden-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedPlant.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {seedCategories.find(c => c.value === selectedPlant.category)?.emoji} {selectedPlant.category}
                    {selectedPlant.scientificName && <span className="italic ml-2">({selectedPlant.scientificName})</span>}
                  </div>
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
              // Show custom plant entry
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-amber-700 dark:text-amber-300 mb-2">Custom plant type (not in encyclopedia)</div>
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
                <div>
                  <label htmlFor="customCategory" className="label">Category</label>
                  <select 
                    id="customCategory" 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="input"
                  >
                    <option value="">Select category</option>
                    {seedCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              // Show search input
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
                      <div className="animate-spin w-4 h-4 border-2 border-garden-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && (plantSuggestions.length > 0 || plantSearch.length >= 2) && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-auto">
                    {plantSuggestions.map((plant) => (
                      <button
                        key={plant.id}
                        type="button"
                        onClick={() => handleSelectPlant(plant)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/40 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">{plant.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {seedCategories.find(c => c.value === plant.category)?.emoji} {plant.category}
                          {plant.scientificName && <span className="italic ml-2">({plant.scientificName})</span>}
                        </div>
                      </button>
                    ))}
                    
                    {/* Custom plant option */}
                    {plantSearch.length >= 2 && (
                      <button
                        type="button"
                        onClick={handleUseCustomPlant}
                        className="w-full px-4 py-3 text-left hover:bg-amber-100 dark:hover:bg-amber-900/50 bg-amber-50 dark:bg-amber-950/60 flex items-center gap-2 border-t-2 border-amber-300 dark:border-amber-700"
                      >
                        <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-900 dark:text-amber-100 font-semibold">
                          Add "{plantSearch}" as custom plant type
                        </span>
                      </button>
                    )}
                    
                    {plantSuggestions.length === 0 && plantSearch.length >= 2 && !searchLoading && (
                      <div className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800">
                        No plants found in encyclopedia. You can add it as a custom type above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Search for plants in the encyclopedia, or add a custom type if not found.
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="variety" className="label">Variety</label>
              <input 
                type="text" 
                id="variety" 
                name="variety" 
                className="input"
                placeholder="e.g., Cherokee Purple"
              />
            </div>
            <div>
              <label htmlFor="brand" className="label">Brand</label>
              <input 
                type="text" 
                id="brand" 
                name="brand" 
                className="input"
                placeholder="e.g., Burpee"
              />
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Quantity & Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="label">Quantity</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                defaultValue={1}
                min={0}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="quantityUnit" className="label">Unit</label>
              <select id="quantityUnit" name="quantityUnit" className="input">
                <option value="seeds">Seeds</option>
                <option value="packets">Packets</option>
                <option value="grams">Grams</option>
                <option value="ounces">Ounces</option>
              </select>
            </div>
            <div>
              <label htmlFor="purchaseDate" className="label">Purchase Date</label>
              <input 
                type="date" 
                id="purchaseDate" 
                name="purchaseDate" 
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expirationDate" className="label">Expiration Date</label>
            <input 
              type="date" 
              id="expirationDate" 
              name="expirationDate" 
              className="input"
            />
          </div>
        </div>

        {/* Growing Info */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Growing Information</h2>
          
          {selectedPlant && (selectedPlant.sunRequirement || selectedPlant.waterNeeds || selectedPlant.daysToMaturity) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-garden-50 dark:bg-garden-900/20 p-3 rounded-lg">
              <p className="font-medium text-garden-700 dark:text-garden-300 mb-1">Default values from encyclopedia:</p>
              <div className="flex flex-wrap gap-4">
                {selectedPlant.sunRequirement && <span>☀️ {selectedPlant.sunRequirement}</span>}
                {selectedPlant.waterNeeds && <span>💧 {selectedPlant.waterNeeds} water</span>}
                {selectedPlant.daysToMaturity && <span>📅 {selectedPlant.daysToMaturity} days to maturity</span>}
              </div>
              <p className="mt-2 text-xs">You can override these values below.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daysToGerminate" className="label">Days to Germinate</label>
              <input 
                type="number" 
                id="daysToGerminate" 
                name="daysToGerminate" 
                min={0}
                className="input"
                placeholder="e.g., 7"
              />
            </div>
            <div>
              <label htmlFor="daysToMaturity" className="label">Days to Maturity</label>
              <input 
                type="number" 
                id="daysToMaturity" 
                name="daysToMaturity" 
                min={0}
                className="input"
                placeholder={selectedPlant?.daysToMaturity ? `Default: ${selectedPlant.daysToMaturity}` : "e.g., 75"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sunRequirement" className="label">Sun Requirement</label>
              <select id="sunRequirement" name="sunRequirement" className="input">
                <option value="">{selectedPlant?.sunRequirement ? `Default: ${selectedPlant.sunRequirement}` : 'Select sun requirement'}</option>
                {sunRequirements.map(sun => (
                  <option key={sun.value} value={sun.value}>
                    {sun.icon} {sun.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="waterNeeds" className="label">Water Needs</label>
              <select id="waterNeeds" name="waterNeeds" className="input">
                <option value="">{selectedPlant?.waterNeeds ? `Default: ${selectedPlant.waterNeeds}` : 'Select water needs'}</option>
                {waterNeeds.map(water => (
                  <option key={water.value} value={water.value}>
                    {water.label} - {water.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spacing" className="label">Spacing</label>
              <input 
                type="text" 
                id="spacing" 
                name="spacing" 
                className="input"
                placeholder="e.g., 24 inches apart"
              />
            </div>
            <div>
              <label htmlFor="plantingDepth" className="label">Planting Depth</label>
              <input 
                type="text" 
                id="plantingDepth" 
                name="plantingDepth" 
                className="input"
                placeholder="e.g., 1/4 inch"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">Notes</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={3}
            className="input"
            placeholder="Any additional notes..."
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
            {loading ? 'Saving...' : 'Save Seeds'}
          </button>
          <Link href="/seeds" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
