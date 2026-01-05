'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, 
  Leaf, 
  Sun, 
  Droplets, 
  Thermometer, 
  Calendar,
  MapPin,
  Utensils,
  Heart,
  Sparkles,
  History,
  Lightbulb,
  BookOpen,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Scissors,
  ExternalLink,
  LogIn
} from 'lucide-react'

interface Recipe {
  name: string
  description: string
  ingredients?: string[]
  instructions?: string
  prepTime?: string
  source?: string
}

interface Plant {
  id: string
  name: string
  category: string
  subcategory?: string
  scientificName?: string
  description?: string
  
  // Detailed info
  generalInfo?: string
  funFacts?: string[] | string
  variations?: string[] | string
  
  // Zones
  hardinessZones?: string[] | string
  optimalZones?: string[] | string
  zoneNotes?: string
  
  // Culinary
  culinaryUses?: string
  recipes?: Recipe[] | string
  flavorProfile?: string
  nutritionalInfo?: string
  
  // Medicinal & Holistic
  medicinalUses?: string
  holisticUses?: string
  cautions?: string
  
  // Craft ideas
  craftIdeas?: CraftIdea[] | string
  
  // Historical
  history?: string
  culturalSignificance?: string
  
  // Growing info
  indoorStartWeeks?: number
  outdoorStartWeeks?: number
  transplantWeeks?: number
  harvestWeeks?: number
  daysToGerminate?: number
  daysToMaturity?: number
  minGerminationTemp?: number
  optGerminationTemp?: number
  sunRequirement?: string
  waterNeeds?: string
  soilPH?: string
  spacing?: string
  plantingDepth?: string
  
  // Companions
  companionPlants?: string
  avoidPlants?: string
  
  // Pests
  commonPests?: string
  commonDiseases?: string
  organicPestControl?: string
  
  // Harvest
  harvestTips?: string
  storageTips?: string
  preservationMethods?: string
  
  notes?: string
  imageUrl?: string
  
  // Submission info
  submittedById?: string
  isApproved?: boolean
  submittedBy?: {
    username: string | null
    name: string | null
  } | null
}

interface CraftIdea {
  name: string
  description: string
  materials?: string[]
  difficulty?: string
  link?: string
}

interface SuggestionForm {
  section: string
  suggestionType: string
  currentContent: string
  suggestedContent: string
  sourceUrl: string
  notes: string
}

const sectionLabels: Record<string, string> = {
  general: 'General Information',
  zones: 'Hardiness Zones',
  facts: 'Fun Facts',
  variations: 'Varieties & Variations',
  recipes: 'Recipes',
  crafts: 'Craft Ideas',
  medicinal: 'Medicinal Uses',
  holistic: 'Holistic Uses',
  history: 'History & Culture',
  growing: 'Growing Information',
  companions: 'Companion Planting',
}

export default function PlantDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const [plant, setPlant] = useState<Plant | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Suggestion modal state
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [suggestionForm, setSuggestionForm] = useState<SuggestionForm>({
    section: 'general',
    suggestionType: 'addition',
    currentContent: '',
    suggestedContent: '',
    sourceUrl: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    growing: true,
    culinary: true,
    crafts: false,
    medicinal: false,
    history: false,
  })

  useEffect(() => {
    if (id) {
      fetchPlant()
    }
  }, [id])

  const fetchPlant = async () => {
    try {
      const response = await fetch(`/api/plants/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPlant(data)
      } else {
        router.push('/plants')
      }
    } catch (error) {
      console.error('Error fetching plant:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseJsonField = (field: string | string[] | undefined): string[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return field.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  const parseRecipes = (field: Recipe[] | string | undefined): Recipe[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const parseCraftIdeas = (field: CraftIdea[] | string | undefined): CraftIdea[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch(`/api/plants/${id}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionForm),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => {
          setShowSuggestionModal(false)
          setSubmitSuccess(false)
          setSuggestionForm({
            section: 'general',
            suggestionType: 'addition',
            currentContent: '',
            suggestedContent: '',
            sourceUrl: '',
            notes: '',
          })
        }, 2000)
      } else {
        const error = await response.json()
        setSubmitError(error.error || 'Failed to submit suggestion')
      }
    } catch (error) {
      setSubmitError('Failed to submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-600"></div>
      </div>
    )
  }

  if (!plant) {
    return (
      <div className="text-center py-12">
        <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Plant not found</h3>
        <Link href="/plants" className="text-garden-600 hover:text-garden-700 mt-2 inline-block">
          ← Back to plants
        </Link>
      </div>
    )
  }

  const funFacts = parseJsonField(plant.funFacts)
  const variations = parseJsonField(plant.variations)
  const hardinessZones = parseJsonField(plant.hardinessZones)
  const optimalZones = parseJsonField(plant.optimalZones)
  const recipes = parseRecipes(plant.recipes)
  const craftIdeas = parseCraftIdeas(plant.craftIdeas)

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div>
        <Link href="/plants" className="text-garden-600 hover:text-garden-700 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Plant Encyclopedia
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{plant.name}</h1>
            {plant.scientificName && (
              <p className="text-lg text-gray-500 italic">{plant.scientificName}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm bg-garden-100 dark:bg-garden-900/50 text-garden-800 dark:text-garden-200 px-3 py-1 rounded-full capitalize">
                {plant.category}
              </span>
              {plant.subcategory && (
                <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full">
                  {plant.subcategory}
                </span>
              )}
            </div>
            {/* Contributor credit */}
            {plant.submittedById && plant.submittedBy && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Contributed by{' '}
                <span className="font-medium text-garden-600 dark:text-garden-400">
                  {plant.submittedBy.username ? `@${plant.submittedBy.username}` : plant.submittedBy.name || 'Community Member'}
                </span>
                {!plant.isApproved && (
                  <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Pending Review
                  </span>
                )}
              </p>
            )}
          </div>
          
          {session ? (
            <button
              onClick={() => setShowSuggestionModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Suggest an Update
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="btn-secondary flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in to Suggest Updates
            </Link>
          )}
        </div>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {plant.sunRequirement && (
          <div className="card bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
            <Sun className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Sun</p>
            <p className="text-sm text-yellow-900 dark:text-yellow-100 capitalize">{plant.sunRequirement}</p>
          </div>
        )}
        {plant.waterNeeds && (
          <div className="card bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
            <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Water</p>
            <p className="text-sm text-blue-900 dark:text-blue-100 capitalize">{plant.waterNeeds}</p>
          </div>
        )}
        {plant.daysToMaturity && (
          <div className="card bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">Days to Harvest</p>
            <p className="text-sm text-green-900 dark:text-green-100">{plant.daysToMaturity} days</p>
          </div>
        )}
        {(optimalZones.length > 0 || hardinessZones.length > 0) && (
          <div className="card bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
            <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Best Zones</p>
            <p className="text-sm text-purple-900 dark:text-purple-100">
              {optimalZones.length > 0 ? optimalZones.slice(0, 3).join(', ') : hardinessZones.slice(0, 3).join(', ')}
              {(optimalZones.length > 3 || hardinessZones.length > 3) && '...'}
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(plant.description || plant.generalInfo) && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-garden-600 dark:text-garden-400" />
                About {plant.name}
              </h2>
              {plant.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{plant.description}</p>
              )}
              {plant.generalInfo && (
                <p className="text-gray-600 dark:text-gray-300">{plant.generalInfo}</p>
              )}
            </div>
          )}

          {/* Fun Facts */}
          {funFacts.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Fun Facts
              </h2>
              <ul className="space-y-2">
                {funFacts.map((fact, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hardiness Zones */}
          {hardinessZones.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Growing Zones
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compatible Zones:</p>
                  <div className="flex flex-wrap gap-2">
                    {hardinessZones.map(zone => (
                      <span 
                        key={zone} 
                        className={`px-3 py-1 rounded-full text-sm ${
                          optimalZones.includes(zone) 
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {zone}
                        {optimalZones.includes(zone) && ' ★'}
                      </span>
                    ))}
                  </div>
                </div>
                {optimalZones.length > 0 && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ★ = Optimal zones for best growth
                  </p>
                )}
                {plant.zoneNotes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{plant.zoneNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Variations */}
          {variations.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Popular Varieties
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variations.map((variety, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-800 dark:text-gray-200">{variety}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Culinary Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('culinary')}
              className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 dark:text-white mb-3"
            >
              <span className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Culinary Uses
              </span>
              {expandedSections.culinary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.culinary && (
              <div className="space-y-4">
                {plant.flavorProfile && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Flavor Profile:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.flavorProfile}</p>
                  </div>
                )}
                
                {plant.culinaryUses && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How to Use:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.culinaryUses}</p>
                  </div>
                )}
                
                {plant.nutritionalInfo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nutritional Benefits:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.nutritionalInfo}</p>
                  </div>
                )}

                {recipes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipes:</p>
                    <div className="space-y-3">
                      {recipes.map((recipe, index) => (
                        <div key={index} className="bg-orange-50 dark:bg-orange-900/40 rounded-lg p-4 border border-orange-100 dark:border-orange-800">
                          <h4 className="font-semibold text-orange-900 dark:text-orange-100">{recipe.name}</h4>
                          <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">{recipe.description}</p>
                          {recipe.prepTime && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">⏱️ {recipe.prepTime}</p>
                          )}
                          {recipe.ingredients && recipe.ingredients.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Ingredients:</p>
                              <ul className="text-xs text-orange-800 dark:text-orange-200 list-disc list-inside">
                                {recipe.ingredients.map((ing, i) => (
                                  <li key={i}>{ing}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {recipe.source && (
                            <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">Source: {recipe.source}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!plant.culinaryUses && !plant.flavorProfile && recipes.length === 0 && (
                  <p className="text-gray-500 italic">
                    No culinary information available yet. 
                    <button 
                      onClick={() => {
                        setSuggestionForm(f => ({ ...f, section: 'recipes' }))
                        setShowSuggestionModal(true)
                      }}
                      className="text-garden-600 hover:underline ml-1"
                    >
                      Be the first to add some!
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Craft Ideas Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('crafts')}
              className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 dark:text-white mb-3"
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-purple-600" />
                Craft & DIY Ideas
              </span>
              {expandedSections.crafts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.crafts && (
              <div className="space-y-4">
                {craftIdeas.length > 0 ? (
                  <div className="space-y-3">
                    {craftIdeas.map((craft, index) => (
                      <div key={index} className="bg-purple-50 dark:bg-purple-900/40 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100">{craft.name}</h4>
                          {craft.difficulty && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded">
                              {craft.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">{craft.description}</p>
                        {craft.materials && craft.materials.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Materials needed:</p>
                            <ul className="text-xs text-purple-800 dark:text-purple-200 list-disc list-inside">
                              {craft.materials.map((material, i) => (
                                <li key={i}>{material}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {craft.link && (
                          <a 
                            href={craft.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mt-2"
                          >
                            View tutorial <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No craft ideas available yet.
                    <button 
                      onClick={() => {
                        setSuggestionForm(f => ({ ...f, section: 'crafts' }))
                        setShowSuggestionModal(true)
                      }}
                      className="text-garden-600 hover:underline ml-1"
                    >
                      Share your creative projects!
                    </button>
                  </p>
                )}
                
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="font-medium mb-1 text-gray-700 dark:text-gray-200">�� Craft ideas might include:</p>
                  <ul className="text-xs space-y-1 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <li>• Natural dyes from leaves, petals, or fruits</li>
                    <li>• Dried flower arrangements and potpourri</li>
                    <li>• Homemade beauty products (soaps, balms, scrubs)</li>
                    <li>• Pressed flower art and greeting cards</li>
                    <li>• Garden markers and decorations</li>
                    <li>• Seed saving and seed bomb making</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Medicinal & Holistic Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('medicinal')}
              className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 dark:text-white mb-3"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Medicinal & Holistic Uses
              </span>
              {expandedSections.medicinal ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.medicinal && (
              <div className="space-y-4">
                {/* Medicinal Disclaimer */}
                <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Important Disclaimer</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        The information provided here is for <strong>educational and informational purposes only</strong> and 
                        is not intended as medical advice. It should not be used to diagnose, treat, cure, or prevent 
                        any disease or health condition.
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                        <strong>Always consult a qualified healthcare professional</strong> before using any plant 
                        medicinally, especially if you are pregnant, nursing, taking medications, or have a health condition.
                      </p>
                    </div>
                  </div>
                </div>
                
                {plant.medicinalUses && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Traditional & Modern Medicinal Uses:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.medicinalUses}</p>
                  </div>
                )}
                
                {plant.holisticUses && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Holistic Applications:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.holisticUses}</p>
                  </div>
                )}

                {plant.cautions && (
                  <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Cautions & Warnings
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{plant.cautions}</p>
                  </div>
                )}

                {!plant.medicinalUses && !plant.holisticUses && (
                  <p className="text-gray-500 italic">
                    No medicinal or holistic information available yet.
                    <button 
                      onClick={() => {
                        setSuggestionForm(f => ({ ...f, section: 'medicinal' }))
                        setShowSuggestionModal(true)
                      }}
                      className="text-garden-600 hover:underline ml-1"
                    >
                      Share your knowledge!
                    </button>
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 italic border-t dark:border-gray-700 pt-3">
                  <strong>Disclaimer:</strong> Garden Seed Tracker does not endorse or recommend any specific 
                  medicinal use of plants. Information presented is gathered from traditional uses and should 
                  not replace professional medical advice. Individual results may vary and some plants may cause 
                  allergic reactions or interact with medications.
                </p>
              </div>
            )}
          </div>

          {/* History & Culture Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 dark:text-white mb-3"
            >
              <span className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                History & Culture
              </span>
              {expandedSections.history ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.history && (
              <div className="space-y-4">
                {plant.history && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Origins & History:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.history}</p>
                  </div>
                )}
                
                {plant.culturalSignificance && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cultural Significance:</p>
                    <p className="text-gray-600 dark:text-gray-300">{plant.culturalSignificance}</p>
                  </div>
                )}

                {!plant.history && !plant.culturalSignificance && (
                  <p className="text-gray-500 italic">
                    No historical information available yet.
                    <button 
                      onClick={() => {
                        setSuggestionForm(f => ({ ...f, section: 'history' }))
                        setShowSuggestionModal(true)
                      }}
                      className="text-garden-600 hover:underline ml-1"
                    >
                      Add some history!
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Growing info sidebar */}
        <div className="space-y-6">
          {/* Growing Guide */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-garden-600 dark:text-garden-400" />
              Growing Guide
            </h2>
            
            <div className="space-y-3 text-sm">
              {plant.indoorStartWeeks && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Indoor Start:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.indoorStartWeeks} weeks before last frost</span>
                </div>
              )}
              {plant.outdoorStartWeeks && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Direct Sow:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plant.outdoorStartWeeks > 0 ? `${plant.outdoorStartWeeks} weeks after` : `${Math.abs(plant.outdoorStartWeeks)} weeks before`} last frost
                  </span>
                </div>
              )}
              {plant.daysToGerminate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Germination:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.daysToGerminate} days</span>
                </div>
              )}
              {plant.spacing && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Spacing:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.spacing}</span>
                </div>
              )}
              {plant.plantingDepth && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Depth:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.plantingDepth}</span>
                </div>
              )}
              {plant.soilPH && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Soil pH:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.soilPH}</span>
                </div>
              )}
              {plant.optGerminationTemp && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Ideal Germ Temp:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plant.optGerminationTemp}°F</span>
                </div>
              )}
            </div>
          </div>

          {/* Companion Planting */}
          {(plant.companionPlants || plant.avoidPlants) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Companion Planting</h2>
              
              {plant.companionPlants && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✓ Good Companions:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.companionPlants}</p>
                </div>
              )}
              
              {plant.avoidPlants && (
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">✗ Avoid Planting With:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.avoidPlants}</p>
                </div>
              )}
            </div>
          )}

          {/* Pests & Problems */}
          {(plant.commonPests || plant.commonDiseases) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pests & Diseases</h2>
              
              {plant.commonPests && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Pests:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.commonPests}</p>
                </div>
              )}
              
              {plant.commonDiseases && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Diseases:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.commonDiseases}</p>
                </div>
              )}
              
              {plant.organicPestControl && (
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Organic Control:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.organicPestControl}</p>
                </div>
              )}
            </div>
          )}

          {/* Harvest & Storage */}
          {(plant.harvestTips || plant.storageTips || plant.preservationMethods) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Harvest & Storage</h2>
              
              {plant.harvestTips && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harvesting:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.harvestTips}</p>
                </div>
              )}
              
              {plant.storageTips && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.storageTips}</p>
                </div>
              )}
              
              {plant.preservationMethods && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preservation:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plant.preservationMethods}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {plant.notes && (
            <div className="card bg-garden-50 dark:bg-garden-900/30 border-garden-200 dark:border-garden-700">
              <h2 className="text-lg font-semibold text-garden-900 dark:text-garden-100 mb-2">Growing Tips</h2>
              <p className="text-sm text-garden-800 dark:text-garden-200">{plant.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Suggest an Update for {plant.name}
                </h2>
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thank You!</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Your suggestion has been submitted for review.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Section
                      </label>
                      <select
                        value={suggestionForm.section}
                        onChange={(e) => setSuggestionForm(f => ({ ...f, section: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                      >
                        {Object.entries(sectionLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={suggestionForm.suggestionType}
                        onChange={(e) => setSuggestionForm(f => ({ ...f, suggestionType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                      >
                        <option value="addition">Add new information</option>
                        <option value="correction">Correct existing info</option>
                        <option value="removal">Remove incorrect info</option>
                      </select>
                    </div>
                  </div>

                  {suggestionForm.suggestionType === 'correction' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Content (what needs fixing)
                      </label>
                      <textarea
                        value={suggestionForm.currentContent}
                        onChange={(e) => setSuggestionForm(f => ({ ...f, currentContent: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                        placeholder="Paste the current text that needs correction..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Suggestion *
                    </label>
                    <textarea
                      value={suggestionForm.suggestedContent}
                      onChange={(e) => setSuggestionForm(f => ({ ...f, suggestedContent: e.target.value }))}
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                      placeholder="Enter your suggested content..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Source URL (optional)
                    </label>
                    <input
                      type="url"
                      value={suggestionForm.sourceUrl}
                      onChange={(e) => setSuggestionForm(f => ({ ...f, sourceUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                      placeholder="https://example.com/source"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Citing a source helps us verify the information
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      value={suggestionForm.notes}
                      onChange={(e) => setSuggestionForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-garden-500"
                      placeholder="Any additional context..."
                    />
                  </div>

                  {submitError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                      {submitError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSuggestionModal(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !suggestionForm.suggestedContent}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Suggestion
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
