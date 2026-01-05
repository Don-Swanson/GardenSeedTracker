'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Leaf,
  Save,
  X,
  Check,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { seedCategories } from '@/lib/garden-utils'

interface Plant {
  id: string
  name: string
  category: string
  subcategory: string | null
  scientificName: string | null
  description: string | null
  generalInfo: string | null
  funFacts: string | null
  variations: string | null
  hardinessZones: string | null
  optimalZones: string | null
  zoneNotes: string | null
  culinaryUses: string | null
  recipes: string | null
  flavorProfile: string | null
  nutritionalInfo: string | null
  medicinalUses: string | null
  holisticUses: string | null
  cautions: string | null
  craftIdeas: string | null
  history: string | null
  culturalSignificance: string | null
  indoorStartWeeks: number | null
  outdoorStartWeeks: number | null
  transplantWeeks: number | null
  harvestWeeks: number | null
  daysToGerminate: number | null
  daysToMaturity: number | null
  minGerminationTemp: number | null
  optGerminationTemp: number | null
  minGrowingTemp: number | null
  maxGrowingTemp: number | null
  sunRequirement: string | null
  waterNeeds: string | null
  soilPH: string | null
  spacing: string | null
  plantingDepth: string | null
  rowSpacing: string | null
  plantsPerSquareFoot: number | null
  companionPlants: string | null
  avoidPlants: string | null
  commonPests: string | null
  commonDiseases: string | null
  organicPestControl: string | null
  harvestTips: string | null
  storageTips: string | null
  preservationMethods: string | null
  notes: string | null
  imageUrl: string | null
  isUserSubmitted: boolean
  isApproved: boolean
  createdAt: string
}

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Collapsible sections in form
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    details: false,
    uses: false,
    growing: false,
    timing: false,
    conditions: false,
    pests: false,
    harvest: false,
    admin: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fetchPlants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        category: category === 'all' ? '' : category,
        limit: '20'
      })
      const res = await fetch(`/api/admin/plants?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPlants(data.plants)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch plants:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlants()
  }, [page, category])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1)
      fetchPlants()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleSavePlant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    
    const getNumber = (key: string) => {
      const val = formData.get(key) as string
      return val && val.trim() !== '' ? parseFloat(val) : null
    }
    
    const getString = (key: string) => {
      const val = formData.get(key) as string
      return val && val.trim() !== '' ? val.trim() : null
    }

    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      subcategory: getString('subcategory'),
      scientificName: getString('scientificName'),
      description: getString('description'),
      generalInfo: getString('generalInfo'),
      funFacts: getString('funFacts'),
      variations: getString('variations'),
      hardinessZones: getString('hardinessZones'),
      optimalZones: getString('optimalZones'),
      zoneNotes: getString('zoneNotes'),
      culinaryUses: getString('culinaryUses'),
      recipes: getString('recipes'),
      flavorProfile: getString('flavorProfile'),
      nutritionalInfo: getString('nutritionalInfo'),
      medicinalUses: getString('medicinalUses'),
      holisticUses: getString('holisticUses'),
      cautions: getString('cautions'),
      craftIdeas: getString('craftIdeas'),
      history: getString('history'),
      culturalSignificance: getString('culturalSignificance'),
      indoorStartWeeks: getNumber('indoorStartWeeks'),
      outdoorStartWeeks: getNumber('outdoorStartWeeks'),
      transplantWeeks: getNumber('transplantWeeks'),
      harvestWeeks: getNumber('harvestWeeks'),
      daysToGerminate: getNumber('daysToGerminate'),
      daysToMaturity: getNumber('daysToMaturity'),
      minGerminationTemp: getNumber('minGerminationTemp'),
      optGerminationTemp: getNumber('optGerminationTemp'),
      minGrowingTemp: getNumber('minGrowingTemp'),
      maxGrowingTemp: getNumber('maxGrowingTemp'),
      sunRequirement: getString('sunRequirement'),
      waterNeeds: getString('waterNeeds'),
      soilPH: getString('soilPH'),
      spacing: getString('spacing'),
      plantingDepth: getString('plantingDepth'),
      rowSpacing: getString('rowSpacing'),
      plantsPerSquareFoot: getNumber('plantsPerSquareFoot'),
      companionPlants: getString('companionPlants'),
      avoidPlants: getString('avoidPlants'),
      commonPests: getString('commonPests'),
      commonDiseases: getString('commonDiseases'),
      organicPestControl: getString('organicPestControl'),
      harvestTips: getString('harvestTips'),
      storageTips: getString('storageTips'),
      preservationMethods: getString('preservationMethods'),
      notes: getString('notes'),
      imageUrl: getString('imageUrl'),
      isApproved: formData.get('isApproved') === 'on',
    }

    try {
      const url = editingPlant 
        ? `/api/admin/plants/${editingPlant.id}`
        : '/api/admin/plants'
      const method = editingPlant ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        setEditingPlant(null)
        setShowAddModal(false)
        fetchPlants()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save plant')
      }
    } catch (err) {
      console.error('Failed to save plant:', err)
      alert('Failed to save plant')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlant = async (plant: Plant) => {
    if (!confirm(`Delete "${plant.name}"? This will also remove it from any seeds that reference it.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/plants/${plant.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchPlants()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete plant')
      }
    } catch (err) {
      console.error('Failed to delete plant:', err)
      alert('Failed to delete plant')
    }
  }

  const handleToggleApproval = async (plant: Plant) => {
    try {
      const res = await fetch(`/api/admin/plants/${plant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plant, isApproved: !plant.isApproved })
      })

      if (res.ok) {
        fetchPlants()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update plant')
      }
    } catch (err) {
      console.error('Failed to update plant:', err)
    }
  }

  const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon?: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
        {icon}
        {title}
      </span>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </button>
  )

  const PlantForm = ({ plant }: { plant?: Plant | null }) => (
    <form onSubmit={handleSavePlant} className="space-y-4">
      {/* Basic Information - Always Expanded */}
      <div className="space-y-4">
        <SectionHeader title="Basic Information" section="basic" icon={<Leaf className="w-4 h-4" />} />
        {expandedSections.basic && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={plant?.name || ''} 
                  required 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Scientific Name</label>
                <input 
                  type="text" 
                  name="scientificName" 
                  defaultValue={plant?.scientificName || ''} 
                  className="input"
                  placeholder="e.g., Solanum lycopersicum"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select name="category" defaultValue={plant?.category || ''} required className="input">
                  <option value="">Select category</option>
                  {seedCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subcategory</label>
                <input 
                  type="text" 
                  name="subcategory" 
                  defaultValue={plant?.subcategory || ''} 
                  className="input"
                  placeholder="e.g., Cherry, Heirloom"
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea 
                name="description" 
                defaultValue={plant?.description || ''} 
                rows={3}
                className="input"
              />
            </div>

            <div>
              <label className="label">Image URL</label>
              <input 
                type="url" 
                name="imageUrl" 
                defaultValue={plant?.imageUrl || ''} 
                className="input"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Details & Facts */}
      <div className="space-y-4">
        <SectionHeader title="Details & Facts" section="details" />
        {expandedSections.details && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <label className="label">General Information</label>
              <textarea 
                name="generalInfo" 
                defaultValue={plant?.generalInfo || ''} 
                rows={4}
                className="input"
                placeholder="Extended description, history, characteristics..."
              />
            </div>
            <div>
              <label className="label">Fun Facts (JSON array)</label>
              <textarea 
                name="funFacts" 
                defaultValue={plant?.funFacts || ''} 
                rows={3}
                className="input font-mono text-sm"
                placeholder='["Fact 1", "Fact 2", "Fact 3"]'
              />
            </div>
            <div>
              <label className="label">Variations/Varieties (JSON array)</label>
              <textarea 
                name="variations" 
                defaultValue={plant?.variations || ''} 
                rows={3}
                className="input font-mono text-sm"
                placeholder='["Variety 1 - description", "Variety 2 - description"]'
              />
            </div>
            <div>
              <label className="label">History &amp; Origins</label>
              <textarea 
                name="history" 
                defaultValue={plant?.history || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Cultural Significance</label>
              <textarea 
                name="culturalSignificance" 
                defaultValue={plant?.culturalSignificance || ''} 
                rows={3}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Uses */}
      <div className="space-y-4">
        <SectionHeader title="Uses & Applications" section="uses" />
        {expandedSections.uses && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <label className="label">Culinary Uses</label>
              <textarea 
                name="culinaryUses" 
                defaultValue={plant?.culinaryUses || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Recipes (JSON array)</label>
              <textarea 
                name="recipes" 
                defaultValue={plant?.recipes || ''} 
                rows={3}
                className="input font-mono text-sm"
                placeholder='[{"name": "Recipe Name", "description": "..."}]'
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Flavor Profile</label>
                <input 
                  type="text" 
                  name="flavorProfile" 
                  defaultValue={plant?.flavorProfile || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Nutritional Info</label>
                <input 
                  type="text" 
                  name="nutritionalInfo" 
                  defaultValue={plant?.nutritionalInfo || ''} 
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Medicinal Uses</label>
              <textarea 
                name="medicinalUses" 
                defaultValue={plant?.medicinalUses || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Holistic Uses</label>
              <textarea 
                name="holisticUses" 
                defaultValue={plant?.holisticUses || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Cautions/Warnings</label>
              <textarea 
                name="cautions" 
                defaultValue={plant?.cautions || ''} 
                rows={2}
                className="input"
                placeholder="Any safety warnings or contraindications"
              />
            </div>
            <div>
              <label className="label">Craft &amp; DIY Ideas (JSON array)</label>
              <textarea 
                name="craftIdeas" 
                defaultValue={plant?.craftIdeas || ''} 
                rows={3}
                className="input font-mono text-sm"
                placeholder='["Craft idea 1", "Craft idea 2"]'
              />
            </div>
          </div>
        )}
      </div>

      {/* Growing Conditions */}
      <div className="space-y-4">
        <SectionHeader title="Growing Conditions" section="conditions" />
        {expandedSections.conditions && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Sun Requirement</label>
                <select name="sunRequirement" defaultValue={plant?.sunRequirement || ''} className="input">
                  <option value="">Select</option>
                  <option value="full sun">Full Sun</option>
                  <option value="partial sun">Partial Sun</option>
                  <option value="partial shade">Partial Shade</option>
                  <option value="full shade">Full Shade</option>
                </select>
              </div>
              <div>
                <label className="label">Water Needs</label>
                <select name="waterNeeds" defaultValue={plant?.waterNeeds || ''} className="input">
                  <option value="">Select</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="label">Soil pH</label>
                <input 
                  type="text" 
                  name="soilPH" 
                  defaultValue={plant?.soilPH || ''} 
                  className="input"
                  placeholder="e.g., 6.0-7.0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Min Germination Temp (°F)</label>
                <input 
                  type="number" 
                  name="minGerminationTemp" 
                  defaultValue={plant?.minGerminationTemp || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Opt Germination Temp (°F)</label>
                <input 
                  type="number" 
                  name="optGerminationTemp" 
                  defaultValue={plant?.optGerminationTemp || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Min Growing Temp (°F)</label>
                <input 
                  type="number" 
                  name="minGrowingTemp" 
                  defaultValue={plant?.minGrowingTemp || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Max Growing Temp (°F)</label>
                <input 
                  type="number" 
                  name="maxGrowingTemp" 
                  defaultValue={plant?.maxGrowingTemp || ''} 
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Spacing</label>
                <input 
                  type="text" 
                  name="spacing" 
                  defaultValue={plant?.spacing || ''} 
                  className="input"
                  placeholder="e.g., 12 inches"
                />
              </div>
              <div>
                <label className="label">Planting Depth</label>
                <input 
                  type="text" 
                  name="plantingDepth" 
                  defaultValue={plant?.plantingDepth || ''} 
                  className="input"
                  placeholder="e.g., 1/4 inch"
                />
              </div>
              <div>
                <label className="label">Row Spacing</label>
                <input 
                  type="text" 
                  name="rowSpacing" 
                  defaultValue={plant?.rowSpacing || ''} 
                  className="input"
                  placeholder="e.g., 24 inches"
                />
              </div>
              <div>
                <label className="label">Plants/Sq Ft</label>
                <input 
                  type="number" 
                  name="plantsPerSquareFoot" 
                  defaultValue={plant?.plantsPerSquareFoot || ''} 
                  className="input"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="label">Hardiness Zones (JSON array)</label>
              <input 
                type="text" 
                name="hardinessZones" 
                defaultValue={plant?.hardinessZones || ''} 
                className="input font-mono text-sm"
                placeholder='["3a", "3b", "4a", "4b", "5a", ...] or 3-10'
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Optimal Zones (JSON array)</label>
                <input 
                  type="text" 
                  name="optimalZones" 
                  defaultValue={plant?.optimalZones || ''} 
                  className="input font-mono text-sm"
                  placeholder='["5a", "5b", "6a"]'
                />
              </div>
              <div>
                <label className="label">Zone Notes</label>
                <input 
                  type="text" 
                  name="zoneNotes" 
                  defaultValue={plant?.zoneNotes || ''} 
                  className="input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timing */}
      <div className="space-y-4">
        <SectionHeader title="Timing" section="timing" />
        {expandedSections.timing && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Indoor Start (weeks before frost)</label>
                <input 
                  type="number" 
                  name="indoorStartWeeks" 
                  defaultValue={plant?.indoorStartWeeks || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Outdoor Start (weeks after frost)</label>
                <input 
                  type="number" 
                  name="outdoorStartWeeks" 
                  defaultValue={plant?.outdoorStartWeeks || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Transplant (weeks)</label>
                <input 
                  type="number" 
                  name="transplantWeeks" 
                  defaultValue={plant?.transplantWeeks || ''} 
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Harvest (weeks)</label>
                <input 
                  type="number" 
                  name="harvestWeeks" 
                  defaultValue={plant?.harvestWeeks || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Days to Germinate</label>
                <input 
                  type="number" 
                  name="daysToGerminate" 
                  defaultValue={plant?.daysToGerminate || ''} 
                  className="input"
                />
              </div>
              <div>
                <label className="label">Days to Maturity</label>
                <input 
                  type="number" 
                  name="daysToMaturity" 
                  defaultValue={plant?.daysToMaturity || ''} 
                  className="input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Companion Planting & Growing */}
      <div className="space-y-4">
        <SectionHeader title="Companion Planting" section="growing" />
        {expandedSections.growing && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <label className="label">Good Companion Plants</label>
              <textarea 
                name="companionPlants" 
                defaultValue={plant?.companionPlants || ''} 
                rows={2}
                className="input"
                placeholder="e.g., Basil, Carrots, Parsley"
              />
            </div>
            <div>
              <label className="label">Plants to Avoid</label>
              <textarea 
                name="avoidPlants" 
                defaultValue={plant?.avoidPlants || ''} 
                rows={2}
                className="input"
                placeholder="e.g., Fennel, Brassicas"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pests & Diseases */}
      <div className="space-y-4">
        <SectionHeader title="Pests & Diseases" section="pests" />
        {expandedSections.pests && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <label className="label">Common Pests</label>
              <textarea 
                name="commonPests" 
                defaultValue={plant?.commonPests || ''} 
                rows={2}
                className="input"
              />
            </div>
            <div>
              <label className="label">Common Diseases</label>
              <textarea 
                name="commonDiseases" 
                defaultValue={plant?.commonDiseases || ''} 
                rows={2}
                className="input"
              />
            </div>
            <div>
              <label className="label">Organic Pest Control</label>
              <textarea 
                name="organicPestControl" 
                defaultValue={plant?.organicPestControl || ''} 
                rows={3}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Harvest & Storage */}
      <div className="space-y-4">
        <SectionHeader title="Harvest & Storage" section="harvest" />
        {expandedSections.harvest && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <label className="label">Harvest Tips</label>
              <textarea 
                name="harvestTips" 
                defaultValue={plant?.harvestTips || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Storage Tips</label>
              <textarea 
                name="storageTips" 
                defaultValue={plant?.storageTips || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Preservation Methods</label>
              <textarea 
                name="preservationMethods" 
                defaultValue={plant?.preservationMethods || ''} 
                rows={3}
                className="input"
              />
            </div>
            <div>
              <label className="label">Additional Notes</label>
              <textarea 
                name="notes" 
                defaultValue={plant?.notes || ''} 
                rows={3}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Admin Settings */}
      <div className="space-y-4">
        <SectionHeader title="Admin Settings" section="admin" />
        {expandedSections.admin && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                name="isApproved" 
                id="isApproved"
                defaultChecked={plant?.isApproved ?? true}
                className="w-5 h-5 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
              />
              <label htmlFor="isApproved" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Approved (visible in encyclopedia)
              </label>
            </div>
            {plant?.isUserSubmitted && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ This plant was submitted by a user
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-4 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
        <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Plant'}
        </button>
        <button 
          type="button" 
          onClick={() => { setEditingPlant(null); setShowAddModal(false); }}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Encyclopedia</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage plant entries in the encyclopedia</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Plant
        </button>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPlant) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
              </h2>
              <button 
                onClick={() => { setEditingPlant(null); setShowAddModal(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <PlantForm plant={editingPlant} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="all">All Categories</option>
            {seedCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Plants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : plants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No plants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Growing Info</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plants.map((plant) => (
                  <tr key={plant.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!plant.isApproved ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Leaf className="w-8 h-8 text-garden-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{plant.name}</p>
                          {plant.scientificName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{plant.scientificName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-garden-100 dark:bg-garden-900/30 text-garden-800 dark:text-garden-200">
                        {seedCategories.find(c => c.value === plant.category)?.emoji} {plant.category}
                      </span>
                      {plant.subcategory && (
                        <span className="ml-2 text-xs text-gray-500">{plant.subcategory}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          plant.isApproved 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {plant.isApproved ? (
                            <><Eye className="w-3 h-3" /> Visible</>
                          ) : (
                            <><EyeOff className="w-3 h-3" /> Hidden</>
                          )}
                        </span>
                        {plant.isUserSubmitted && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">User submitted</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="space-y-1">
                        {plant.sunRequirement && <div>☀️ {plant.sunRequirement}</div>}
                        {plant.waterNeeds && <div>💧 {plant.waterNeeds}</div>}
                        {plant.daysToMaturity && <div>📅 {plant.daysToMaturity} days</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(plant)}
                          className={`p-2 rounded-lg ${
                            plant.isApproved 
                              ? 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600' 
                              : 'hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600'
                          }`}
                          title={plant.isApproved ? 'Hide plant' : 'Show plant'}
                        >
                          {plant.isApproved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingPlant(plant)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlant(plant)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
