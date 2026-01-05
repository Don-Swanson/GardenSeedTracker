'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Leaf, 
  Send, 
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  X
} from 'lucide-react'

interface PlantSubmission {
  name: string
  scientificName: string
  category: string
  subcategory: string
  description: string
  generalInfo: string
  funFacts: string[]
  variations: string[]
  hardinessZones: string[]
  optimalZones: string[]
  zoneNotes: string
  culinaryUses: string
  flavorProfile: string
  nutritionalInfo: string
  medicinalUses: string
  holisticUses: string
  cautions: string
  craftIdeas: string
  history: string
  culturalSignificance: string
  sunRequirement: string
  waterNeeds: string
  soilPH: string
  indoorStartWeeks: string
  outdoorStartWeeks: string
  transplantWeeks: string
  harvestWeeks: string
  daysToGerminate: string
  daysToMaturity: string
  minGerminationTemp: string
  optGerminationTemp: string
  minGrowingTemp: string
  maxGrowingTemp: string
  spacing: string
  rowSpacing: string
  plantingDepth: string
  plantsPerSquareFoot: string
  companionPlants: string
  avoidPlants: string
  commonPests: string
  commonDiseases: string
  organicPestControl: string
  harvestTips: string
  storageTips: string
  preservationMethods: string
  notes: string
  sourceUrl: string
}

const categories = [
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'herb', label: 'Herb' },
  { value: 'flower', label: 'Flower' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'tree', label: 'Tree' },
  { value: 'shrub', label: 'Shrub' },
  { value: 'vine', label: 'Vine' },
  { value: 'grass', label: 'Grass/Grain' },
]

const subcategories: Record<string, string[]> = {
  vegetable: ['Leafy Greens', 'Root Vegetables', 'Cruciferous', 'Nightshades', 'Legumes', 'Alliums', 'Squash', 'Other'],
  herb: ['Culinary', 'Medicinal', 'Aromatic', 'Tea Herbs', 'Other'],
  flower: ['Annual', 'Perennial', 'Bulbs', 'Wildflower', 'Cutting Flowers', 'Other'],
  fruit: ['Berries', 'Citrus', 'Stone Fruit', 'Tropical', 'Melons', 'Other'],
  tree: ['Fruit Trees', 'Nut Trees', 'Ornamental', 'Shade Trees', 'Evergreen', 'Other'],
  shrub: ['Flowering', 'Berry-Producing', 'Evergreen', 'Deciduous', 'Other'],
  vine: ['Edible', 'Flowering', 'Climbing', 'Ground Cover', 'Other'],
  grass: ['Grain', 'Ornamental', 'Lawn', 'Native', 'Other'],
}

const sunOptions = ['full sun', 'partial shade', 'full shade', 'partial sun']
const waterOptions = ['low', 'moderate', 'high']

const hardinessZoneOptions = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b',
  '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b', '11a', '11b', '12a', '12b'
]

export default function NewPlantPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [form, setForm] = useState<PlantSubmission>({
    name: '',
    scientificName: '',
    category: 'vegetable',
    subcategory: '',
    description: '',
    generalInfo: '',
    funFacts: [''],
    variations: [''],
    hardinessZones: [],
    optimalZones: [],
    zoneNotes: '',
    culinaryUses: '',
    flavorProfile: '',
    nutritionalInfo: '',
    medicinalUses: '',
    holisticUses: '',
    cautions: '',
    craftIdeas: '',
    history: '',
    culturalSignificance: '',
    sunRequirement: 'full sun',
    waterNeeds: 'moderate',
    soilPH: '',
    indoorStartWeeks: '',
    outdoorStartWeeks: '',
    transplantWeeks: '',
    harvestWeeks: '',
    daysToGerminate: '',
    daysToMaturity: '',
    minGerminationTemp: '',
    optGerminationTemp: '',
    minGrowingTemp: '',
    maxGrowingTemp: '',
    spacing: '',
    rowSpacing: '',
    plantingDepth: '',
    plantsPerSquareFoot: '',
    companionPlants: '',
    avoidPlants: '',
    commonPests: '',
    commonDiseases: '',
    organicPestControl: '',
    harvestTips: '',
    storageTips: '',
    preservationMethods: '',
    notes: '',
    sourceUrl: '',
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleArrayFieldAdd = (field: 'funFacts' | 'variations') => {
    setForm(f => ({
      ...f,
      [field]: [...f[field], '']
    }))
  }

  const handleArrayFieldRemove = (field: 'funFacts' | 'variations', index: number) => {
    setForm(f => ({
      ...f,
      [field]: f[field].filter((_, i) => i !== index)
    }))
  }

  const handleArrayFieldChange = (field: 'funFacts' | 'variations', index: number, value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].map((item, i) => i === index ? value : item)
    }))
  }

  const handleZoneToggle = (zone: string) => {
    setForm(f => ({
      ...f,
      hardinessZones: f.hardinessZones.includes(zone)
        ? f.hardinessZones.filter(z => z !== zone)
        : [...f.hardinessZones, zone]
    }))
  }

  const handleOptimalZoneToggle = (zone: string) => {
    setForm(f => ({
      ...f,
      optimalZones: f.optimalZones.includes(zone)
        ? f.optimalZones.filter(z => z !== zone)
        : [...f.optimalZones, zone]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    // Validate required fields
    if (!form.name.trim()) {
      setSubmitError('Plant name is required')
      setSubmitting(false)
      return
    }

    if (!form.description.trim()) {
      setSubmitError('Please provide a brief description of the plant')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/plants/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          funFacts: form.funFacts.filter(f => f.trim()),
          variations: form.variations.filter(v => v.trim()),
          optimalZones: form.optimalZones,
          // Convert numeric strings to numbers where applicable
          indoorStartWeeks: form.indoorStartWeeks ? parseInt(form.indoorStartWeeks) : null,
          outdoorStartWeeks: form.outdoorStartWeeks ? parseInt(form.outdoorStartWeeks) : null,
          transplantWeeks: form.transplantWeeks ? parseInt(form.transplantWeeks) : null,
          harvestWeeks: form.harvestWeeks ? parseInt(form.harvestWeeks) : null,
          daysToGerminate: form.daysToGerminate ? parseInt(form.daysToGerminate) : null,
          minGerminationTemp: form.minGerminationTemp ? parseInt(form.minGerminationTemp) : null,
          optGerminationTemp: form.optGerminationTemp ? parseInt(form.optGerminationTemp) : null,
          minGrowingTemp: form.minGrowingTemp ? parseInt(form.minGrowingTemp) : null,
          maxGrowingTemp: form.maxGrowingTemp ? parseInt(form.maxGrowingTemp) : null,
          plantsPerSquareFoot: form.plantsPerSquareFoot ? parseFloat(form.plantsPerSquareFoot) : null,
        }),
      })

      if (response.ok) {
        setSubmitSuccess(true)
      } else {
        const error = await response.json()
        setSubmitError(error.error || 'Failed to submit plant')
      }
    } catch (error) {
      setSubmitError('Failed to submit plant. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-600"></div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your plant submission has been received and will be reviewed by our team.
            Once approved, it will appear in the Plant Encyclopedia.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/plants" className="btn-secondary">
              Back to Encyclopedia
            </Link>
            <button
              onClick={() => {
                setSubmitSuccess(false)
                setForm({
                  name: '',
                  scientificName: '',
                  category: 'vegetable',
                  subcategory: '',
                  description: '',
                  generalInfo: '',
                  funFacts: [''],
                  variations: [''],
                  hardinessZones: [],
                  optimalZones: [],
                  zoneNotes: '',
                  culinaryUses: '',
                  flavorProfile: '',
                  nutritionalInfo: '',
                  medicinalUses: '',
                  holisticUses: '',
                  cautions: '',
                  craftIdeas: '',
                  history: '',
                  culturalSignificance: '',
                  sunRequirement: 'full sun',
                  waterNeeds: 'moderate',
                  soilPH: '',
                  indoorStartWeeks: '',
                  outdoorStartWeeks: '',
                  transplantWeeks: '',
                  harvestWeeks: '',
                  daysToGerminate: '',
                  daysToMaturity: '',
                  minGerminationTemp: '',
                  optGerminationTemp: '',
                  minGrowingTemp: '',
                  maxGrowingTemp: '',
                  spacing: '',
                  rowSpacing: '',
                  plantingDepth: '',
                  plantsPerSquareFoot: '',
                  companionPlants: '',
                  avoidPlants: '',
                  commonPests: '',
                  commonDiseases: '',
                  organicPestControl: '',
                  harvestTips: '',
                  storageTips: '',
                  preservationMethods: '',
                  notes: '',
                  sourceUrl: '',
                })
              }}
              className="btn-primary"
            >
              Submit Another Plant
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/plants" className="text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Plant Encyclopedia
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-garden-100 dark:bg-garden-900/30 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-garden-600 dark:text-garden-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a New Plant</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Help grow our encyclopedia by adding a new plant
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">How it works:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-blue-700 dark:text-blue-300">
              <li>Fill out as much information as you can (only name and description are required)</li>
              <li>Your submission will be reviewed by our team</li>
              <li>Once approved, the plant will appear in the encyclopedia</li>
              <li>You&apos;ll be credited as a contributor</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plant Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="e.g., Lavender"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scientific Name
              </label>
              <input
                type="text"
                value={form.scientificName}
                onChange={(e) => setForm(f => ({ ...f, scientificName: e.target.value }))}
                className="input"
                placeholder="e.g., Lavandula angustifolia"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm(f => ({ ...f, category: e.target.value, subcategory: '' }))}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {subcategories[form.category] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subcategory
              </label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm(f => ({ ...f, subcategory: e.target.value }))}
                className="input"
              >
                <option value="">Select subcategory...</option>
                {subcategories[form.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brief Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input"
              placeholder="A short overview of the plant..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              General Information
            </label>
            <textarea
              value={form.generalInfo}
              onChange={(e) => setForm(f => ({ ...f, generalInfo: e.target.value }))}
              rows={4}
              className="input"
              placeholder="Detailed information about the plant, its characteristics, origins, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hardiness Zones (where it can grow)
            </label>
            <div className="flex flex-wrap gap-2">
              {hardinessZoneOptions.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.hardinessZones.includes(zone)
                      ? 'bg-garden-100 dark:bg-garden-900/40 border-garden-500 text-garden-800 dark:text-garden-200'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to select all zones where this plant can grow</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optimal Zones (where it grows best)
            </label>
            <div className="flex flex-wrap gap-2">
              {hardinessZoneOptions.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => handleOptimalZoneToggle(zone)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.optimalZones.includes(zone)
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select zones where this plant thrives</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zone Notes
            </label>
            <textarea
              value={form.zoneNotes}
              onChange={(e) => setForm(f => ({ ...f, zoneNotes: e.target.value }))}
              rows={2}
              className="input"
              placeholder="Any special notes about growing zones, microclimates, etc."
            />
          </div>
        </div>

        {/* Details & Facts Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Details &amp; Fun Facts
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fun Facts
            </label>
            {form.funFacts.map((fact, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={fact}
                  onChange={(e) => handleArrayFieldChange('funFacts', index, e.target.value)}
                  className="flex-1 input"
                  placeholder="Enter an interesting fact..."
                />
                {form.funFacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleArrayFieldRemove('funFacts', index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleArrayFieldAdd('funFacts')}
              className="text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add another fact
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Popular Varieties
            </label>
            {form.variations.map((variation, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={variation}
                  onChange={(e) => handleArrayFieldChange('variations', index, e.target.value)}
                  className="flex-1 input"
                  placeholder="e.g., English Lavender - compact growth, very fragrant"
                />
                {form.variations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleArrayFieldRemove('variations', index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleArrayFieldAdd('variations')}
              className="text-sm text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add another variety
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              History &amp; Origins
            </label>
            <textarea
              value={form.history}
              onChange={(e) => setForm(f => ({ ...f, history: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Where did this plant originate? What is its history?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cultural Significance
            </label>
            <textarea
              value={form.culturalSignificance}
              onChange={(e) => setForm(f => ({ ...f, culturalSignificance: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Any symbolic meaning, use in traditions, folklore, etc."
            />
          </div>
        </div>

        {/* Uses Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Uses &amp; Applications
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Culinary Uses
            </label>
            <textarea
              value={form.culinaryUses}
              onChange={(e) => setForm(f => ({ ...f, culinaryUses: e.target.value }))}
              rows={3}
              className="input"
              placeholder="How is this plant used in cooking? Any recipes or flavor profiles?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Flavor Profile
              </label>
              <input
                type="text"
                value={form.flavorProfile}
                onChange={(e) => setForm(f => ({ ...f, flavorProfile: e.target.value }))}
                className="input"
                placeholder="e.g., Sweet, earthy, slightly bitter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nutritional Info
              </label>
              <input
                type="text"
                value={form.nutritionalInfo}
                onChange={(e) => setForm(f => ({ ...f, nutritionalInfo: e.target.value }))}
                className="input"
                placeholder="e.g., High in Vitamin C, good source of fiber"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Craft &amp; DIY Ideas
            </label>
            <textarea
              value={form.craftIdeas}
              onChange={(e) => setForm(f => ({ ...f, craftIdeas: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Any craft projects, DIY uses, or creative applications?"
            />
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Medicinal and holistic uses are for informational purposes only. 
                  Always cite reliable sources for any health-related claims.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medicinal Uses (Traditional &amp; Modern)
              </label>
              <textarea
                value={form.medicinalUses}
                onChange={(e) => setForm(f => ({ ...f, medicinalUses: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Traditional or modern medicinal applications..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Holistic Uses
              </label>
              <textarea
                value={form.holisticUses}
                onChange={(e) => setForm(f => ({ ...f, holisticUses: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Aromatherapy, companion planting benefits, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cautions &amp; Warnings
              </label>
              <textarea
                value={form.cautions}
                onChange={(e) => setForm(f => ({ ...f, cautions: e.target.value }))}
                rows={2}
                className="input"
                placeholder="Any safety warnings, contraindications, or precautions..."
              />
            </div>
          </div>
        </div>

        {/* Growing Information Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Growing Information
          </h2>
          
          {/* Environment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sun Requirement
              </label>
              <select
                value={form.sunRequirement}
                onChange={(e) => setForm(f => ({ ...f, sunRequirement: e.target.value }))}
                className="input"
              >
                {sunOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Water Needs
              </label>
              <select
                value={form.waterNeeds}
                onChange={(e) => setForm(f => ({ ...f, waterNeeds: e.target.value }))}
                className="input"
              >
                {waterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soil pH
              </label>
              <input
                type="text"
                value={form.soilPH}
                onChange={(e) => setForm(f => ({ ...f, soilPH: e.target.value }))}
                className="input"
                placeholder="e.g., 6.0-7.0"
              />
            </div>
          </div>

          {/* Timing */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Timing (weeks relative to last frost)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start Indoors
                </label>
                <input
                  type="number"
                  value={form.indoorStartWeeks}
                  onChange={(e) => setForm(f => ({ ...f, indoorStartWeeks: e.target.value }))}
                  className="input"
                  placeholder="e.g., -8"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Direct Sow
                </label>
                <input
                  type="number"
                  value={form.outdoorStartWeeks}
                  onChange={(e) => setForm(f => ({ ...f, outdoorStartWeeks: e.target.value }))}
                  className="input"
                  placeholder="e.g., 0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Transplant
                </label>
                <input
                  type="number"
                  value={form.transplantWeeks}
                  onChange={(e) => setForm(f => ({ ...f, transplantWeeks: e.target.value }))}
                  className="input"
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Begin Harvest
                </label>
                <input
                  type="number"
                  value={form.harvestWeeks}
                  onChange={(e) => setForm(f => ({ ...f, harvestWeeks: e.target.value }))}
                  className="input"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use negative numbers for weeks before last frost</p>
          </div>

          {/* Germination & Maturity */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Days to Germinate
              </label>
              <input
                type="number"
                value={form.daysToGerminate}
                onChange={(e) => setForm(f => ({ ...f, daysToGerminate: e.target.value }))}
                className="input"
                placeholder="e.g., 7-14"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Days to Maturity
              </label>
              <input
                type="text"
                value={form.daysToMaturity}
                onChange={(e) => setForm(f => ({ ...f, daysToMaturity: e.target.value }))}
                className="input"
                placeholder="e.g., 60-90"
              />
            </div>
          </div>

          {/* Temperature */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Temperature Requirements (°F)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Min Germination
                </label>
                <input
                  type="number"
                  value={form.minGerminationTemp}
                  onChange={(e) => setForm(f => ({ ...f, minGerminationTemp: e.target.value }))}
                  className="input"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Optimal Germination
                </label>
                <input
                  type="number"
                  value={form.optGerminationTemp}
                  onChange={(e) => setForm(f => ({ ...f, optGerminationTemp: e.target.value }))}
                  className="input"
                  placeholder="e.g., 70"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Min Growing
                </label>
                <input
                  type="number"
                  value={form.minGrowingTemp}
                  onChange={(e) => setForm(f => ({ ...f, minGrowingTemp: e.target.value }))}
                  className="input"
                  placeholder="e.g., 40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Max Growing
                </label>
                <input
                  type="number"
                  value={form.maxGrowingTemp}
                  onChange={(e) => setForm(f => ({ ...f, maxGrowingTemp: e.target.value }))}
                  className="input"
                  placeholder="e.g., 85"
                />
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plant Spacing
              </label>
              <input
                type="text"
                value={form.spacing}
                onChange={(e) => setForm(f => ({ ...f, spacing: e.target.value }))}
                className="input"
                placeholder="e.g., 12-18 inches"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Row Spacing
              </label>
              <input
                type="text"
                value={form.rowSpacing}
                onChange={(e) => setForm(f => ({ ...f, rowSpacing: e.target.value }))}
                className="input"
                placeholder="e.g., 24-36 inches"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Planting Depth
              </label>
              <input
                type="text"
                value={form.plantingDepth}
                onChange={(e) => setForm(f => ({ ...f, plantingDepth: e.target.value }))}
                className="input"
                placeholder="e.g., 1/4 inch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plants/Sq Ft
              </label>
              <input
                type="text"
                value={form.plantsPerSquareFoot}
                onChange={(e) => setForm(f => ({ ...f, plantsPerSquareFoot: e.target.value }))}
                className="input"
                placeholder="e.g., 4"
              />
            </div>
          </div>

          {/* Companion Planting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Good Companion Plants
              </label>
              <input
                type="text"
                value={form.companionPlants}
                onChange={(e) => setForm(f => ({ ...f, companionPlants: e.target.value }))}
                className="input"
                placeholder="e.g., Rosemary, Thyme, Sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avoid Planting With
              </label>
              <input
                type="text"
                value={form.avoidPlants}
                onChange={(e) => setForm(f => ({ ...f, avoidPlants: e.target.value }))}
                className="input"
                placeholder="Plants that don't grow well together"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Growing Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Any other tips for growing this plant..."
            />
          </div>
        </div>

        {/* Pests & Diseases Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Pests &amp; Diseases
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Common Pests
              </label>
              <textarea
                value={form.commonPests}
                onChange={(e) => setForm(f => ({ ...f, commonPests: e.target.value }))}
                rows={3}
                className="input"
                placeholder="e.g., Aphids, Spider mites, Caterpillars"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Common Diseases
              </label>
              <textarea
                value={form.commonDiseases}
                onChange={(e) => setForm(f => ({ ...f, commonDiseases: e.target.value }))}
                rows={3}
                className="input"
                placeholder="e.g., Powdery mildew, Root rot, Blight"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organic Pest Control
            </label>
            <textarea
              value={form.organicPestControl}
              onChange={(e) => setForm(f => ({ ...f, organicPestControl: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Natural methods for pest control..."
            />
          </div>
        </div>

        {/* Harvest & Storage Section */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Harvest &amp; Storage
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Harvest Tips
            </label>
            <textarea
              value={form.harvestTips}
              onChange={(e) => setForm(f => ({ ...f, harvestTips: e.target.value }))}
              rows={3}
              className="input"
              placeholder="When and how to harvest for best results..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Storage Tips
              </label>
              <textarea
                value={form.storageTips}
                onChange={(e) => setForm(f => ({ ...f, storageTips: e.target.value }))}
                rows={3}
                className="input"
                placeholder="How to store fresh produce..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preservation Methods
              </label>
              <textarea
                value={form.preservationMethods}
                onChange={(e) => setForm(f => ({ ...f, preservationMethods: e.target.value }))}
                rows={3}
                className="input"
                placeholder="e.g., Canning, freezing, drying..."
              />
            </div>
          </div>
        </div>

        {/* Source URL Section */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Source/Reference URL (optional)
          </label>
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(e) => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
            className="input"
            placeholder="https://example.com/plant-info"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Citing sources helps us verify the information
          </p>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">
            {submitError}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link href="/plants" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Plant for Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
