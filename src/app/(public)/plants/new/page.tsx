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
  description: string
  generalInfo: string
  funFacts: string[]
  variations: string[]
  hardinessZones: string[]
  culinaryUses: string
  medicinalUses: string
  holisticUses: string
  craftIdeas: string
  history: string
  culturalSignificance: string
  sunRequirement: string
  waterNeeds: string
  daysToMaturity: string
  spacing: string
  plantingDepth: string
  companionPlants: string
  avoidPlants: string
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
    description: '',
    generalInfo: '',
    funFacts: [''],
    variations: [''],
    hardinessZones: [],
    culinaryUses: '',
    medicinalUses: '',
    holisticUses: '',
    craftIdeas: '',
    history: '',
    culturalSignificance: '',
    sunRequirement: 'full sun',
    waterNeeds: 'moderate',
    daysToMaturity: '',
    spacing: '',
    plantingDepth: '',
    companionPlants: '',
    avoidPlants: '',
    notes: '',
    sourceUrl: '',
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
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
                  description: '',
                  generalInfo: '',
                  funFacts: [''],
                  variations: [''],
                  hardinessZones: [],
                  culinaryUses: '',
                  medicinalUses: '',
                  holisticUses: '',
                  craftIdeas: '',
                  history: '',
                  culturalSignificance: '',
                  sunRequirement: 'full sun',
                  waterNeeds: 'moderate',
                  daysToMaturity: '',
                  spacing: '',
                  plantingDepth: '',
                  companionPlants: '',
                  avoidPlants: '',
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
        <Link href="/plants" className="text-garden-600 hover:text-garden-700 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Plant Encyclopedia
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-garden-100 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-garden-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submit a New Plant</h1>
            <p className="text-gray-600">
              Help grow our encyclopedia by adding a new plant
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">How it works:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Fill out as much information as you can (only name and description are required)</li>
              <li>Your submission will be reviewed by our team</li>
              <li>Once approved, the plant will appear in the encyclopedia</li>
              <li>You'll be credited as a contributor</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { id: 'basic', label: 'Basic Info' },
          { id: 'details', label: 'Details & Facts' },
          { id: 'uses', label: 'Uses' },
          { id: 'growing', label: 'Growing' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-garden-600 text-garden-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., Lavender"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={form.scientificName}
                  onChange={(e) => setForm(f => ({ ...f, scientificName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., Lavandula angustifolia"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="A short overview of the plant..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Information
              </label>
              <textarea
                value={form.generalInfo}
                onChange={(e) => setForm(f => ({ ...f, generalInfo: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Detailed information about the plant, its characteristics, origins, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hardiness Zones
              </label>
              <div className="flex flex-wrap gap-2">
                {hardinessZoneOptions.map(zone => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleZoneToggle(zone)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.hardinessZones.includes(zone)
                        ? 'bg-garden-100 border-garden-500 text-garden-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Click to select zones where this plant grows</p>
            </div>
          </div>
        )}

        {/* Details & Facts Tab */}
        {activeTab === 'details' && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Details & Fun Facts</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fun Facts
              </label>
              {form.funFacts.map((fact, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={fact}
                    onChange={(e) => handleArrayFieldChange('funFacts', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                    placeholder="Enter an interesting fact..."
                  />
                  {form.funFacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('funFacts', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleArrayFieldAdd('funFacts')}
                className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add another fact
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popular Varieties
              </label>
              {form.variations.map((variation, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={variation}
                    onChange={(e) => handleArrayFieldChange('variations', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                    placeholder="e.g., English Lavender - compact growth, very fragrant"
                  />
                  {form.variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('variations', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleArrayFieldAdd('variations')}
                className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add another variety
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                History & Origins
              </label>
              <textarea
                value={form.history}
                onChange={(e) => setForm(f => ({ ...f, history: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Where did this plant originate? What is its history?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultural Significance
              </label>
              <textarea
                value={form.culturalSignificance}
                onChange={(e) => setForm(f => ({ ...f, culturalSignificance: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Any symbolic meaning, use in traditions, folklore, etc."
              />
            </div>
          </div>
        )}

        {/* Uses Tab */}
        {activeTab === 'uses' && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Uses & Applications</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Culinary Uses
              </label>
              <textarea
                value={form.culinaryUses}
                onChange={(e) => setForm(f => ({ ...f, culinaryUses: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="How is this plant used in cooking? Any recipes or flavor profiles?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Craft & DIY Ideas
              </label>
              <textarea
                value={form.craftIdeas}
                onChange={(e) => setForm(f => ({ ...f, craftIdeas: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Any craft projects, DIY uses, or creative applications?"
              />
            </div>

            <div className="border-t pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Medicinal and holistic uses are for informational purposes only. 
                    Always cite reliable sources for any health-related claims.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicinal Uses (Traditional & Modern)
                </label>
                <textarea
                  value={form.medicinalUses}
                  onChange={(e) => setForm(f => ({ ...f, medicinalUses: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="Traditional or modern medicinal applications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holistic Uses
                </label>
                <textarea
                  value={form.holisticUses}
                  onChange={(e) => setForm(f => ({ ...f, holisticUses: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="Aromatherapy, companion planting benefits, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* Growing Tab */}
        {activeTab === 'growing' && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Growing Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sun Requirement
                </label>
                <select
                  value={form.sunRequirement}
                  onChange={(e) => setForm(f => ({ ...f, sunRequirement: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                >
                  {sunOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Needs
                </label>
                <select
                  value={form.waterNeeds}
                  onChange={(e) => setForm(f => ({ ...f, waterNeeds: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                >
                  {waterOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days to Maturity
                </label>
                <input
                  type="text"
                  value={form.daysToMaturity}
                  onChange={(e) => setForm(f => ({ ...f, daysToMaturity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 60-90"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spacing
                </label>
                <input
                  type="text"
                  value={form.spacing}
                  onChange={(e) => setForm(f => ({ ...f, spacing: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 12-18 inches"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planting Depth
                </label>
                <input
                  type="text"
                  value={form.plantingDepth}
                  onChange={(e) => setForm(f => ({ ...f, plantingDepth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 1/4 inch"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Good Companion Plants
              </label>
              <input
                type="text"
                value={form.companionPlants}
                onChange={(e) => setForm(f => ({ ...f, companionPlants: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="e.g., Rosemary, Thyme, Sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avoid Planting With
              </label>
              <input
                type="text"
                value={form.avoidPlants}
                onChange={(e) => setForm(f => ({ ...f, avoidPlants: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Plants that don't grow well together"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Growing Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
                placeholder="Any other tips for growing this plant..."
              />
            </div>
          </div>
        )}

        {/* Source URL */}
        <div className="card mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source/Reference URL (optional)
          </label>
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(e) => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-garden-500"
            placeholder="https://example.com/plant-info"
          />
          <p className="text-xs text-gray-500 mt-1">
            Citing sources helps us verify the information
          </p>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-6">
            {submitError}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 mt-6">
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
