'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Edit,
  Save,
  X,
  Leaf,
  Sun,
  Droplets,
  Calendar,
  Ruler
} from 'lucide-react'

interface PlantingGuide {
  id: string
  name: string
  scientificName: string | null
  category: string | null
  description: string | null
  generalInfo: string | null
  funFacts: string | null
  variations: string | null
  hardinessZones: string | null
  culinaryUses: string | null
  medicinalUses: string | null
  holisticUses: string | null
  craftIdeas: string | null
  history: string | null
  culturalSignificance: string | null
  sunRequirement: string | null
  waterNeeds: string | null
  daysToMaturity: number | null
  spacing: string | null
  plantingDepth: string | null
  companionPlants: string | null
  avoidPlants: string | null
  notes: string | null
  isApproved: boolean
}

interface Submission {
  id: string
  plantName: string
  category: string | null
  scientificName: string | null
  description: string | null
  reason: string | null
  additionalInfo: string | null
  sourceUrl: string | null
  status: string
  adminNotes: string | null
  votes: number
  createdAt: string
  user: {
    email: string
    name: string | null
  }
  plantingGuide: PlantingGuide | null
}

interface EditForm {
  name: string
  scientificName: string
  category: string
  description: string
  generalInfo: string
  funFacts: string
  variations: string
  hardinessZones: string
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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [activeEditTab, setActiveEditTab] = useState<'basic' | 'details' | 'uses' | 'growing'>('basic')

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: filter })
      const res = await fetch(`/api/admin/submissions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions)
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          adminNotes: adminNotes[id] || null 
        })
      })

      if (res.ok) {
        fetchSubmissions()
        setExpandedId(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Action failed')
      }
    } catch (err) {
      console.error('Action failed:', err)
      alert('Action failed')
    } finally {
      setProcessing(null)
    }
  }

  const parseJsonField = (field: string | null | undefined): string => {
    if (!field) return ''
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed.join(', ') : field
    } catch {
      return field
    }
  }

  const startEditing = (submission: Submission) => {
    const pg = submission.plantingGuide
    setEditingId(submission.id)
    setActiveEditTab('basic')
    setEditForm({
      name: pg?.name || submission.plantName,
      scientificName: pg?.scientificName || submission.scientificName || '',
      category: pg?.category || submission.category || 'vegetable',
      description: pg?.description || submission.description || '',
      generalInfo: pg?.generalInfo || submission.additionalInfo || '',
      funFacts: parseJsonField(pg?.funFacts),
      variations: parseJsonField(pg?.variations),
      hardinessZones: parseJsonField(pg?.hardinessZones),
      culinaryUses: pg?.culinaryUses || '',
      medicinalUses: pg?.medicinalUses || '',
      holisticUses: pg?.holisticUses || '',
      craftIdeas: pg?.craftIdeas || '',
      history: pg?.history || '',
      culturalSignificance: pg?.culturalSignificance || '',
      sunRequirement: pg?.sunRequirement || 'full sun',
      waterNeeds: pg?.waterNeeds || 'moderate',
      daysToMaturity: pg?.daysToMaturity?.toString() || '',
      spacing: pg?.spacing || '',
      plantingDepth: pg?.plantingDepth || '',
      companionPlants: pg?.companionPlants || '',
      avoidPlants: pg?.avoidPlants || '',
      notes: pg?.notes || '',
      sourceUrl: submission.sourceUrl || ''
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdits = async (submission: Submission) => {
    if (!editForm) return
    setProcessing(submission.id)
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update',
          plantingGuideId: submission.plantingGuide?.id,
          ...editForm
        })
      })

      if (res.ok) {
        fetchSubmissions()
        setEditingId(null)
        setEditForm(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save changes')
      }
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save changes')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{status}</span>
    }
  }

  const renderViewMode = (submission: Submission) => {
    const pg = submission.plantingGuide
    
    return (
      <>
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pg?.scientificName && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Scientific Name</h4>
              <p className="text-gray-600 dark:text-gray-400 italic">{pg.scientificName}</p>
            </div>
          )}
          {pg?.category && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h4>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{pg.category}</p>
            </div>
          )}
        </div>

        {pg?.description && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
            <p className="text-gray-600 dark:text-gray-400">{pg.description}</p>
          </div>
        )}

        {pg?.generalInfo && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">General Information</h4>
            <p className="text-gray-600 dark:text-gray-400">{pg.generalInfo}</p>
          </div>
        )}

        {/* Growing Info */}
        {(pg?.sunRequirement || pg?.waterNeeds || pg?.daysToMaturity || pg?.hardinessZones) && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4" /> Growing Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {pg?.sunRequirement && (
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{pg.sunRequirement}</span>
                </div>
              )}
              {pg?.waterNeeds && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{pg.waterNeeds}</span>
                </div>
              )}
              {pg?.daysToMaturity && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">{pg.daysToMaturity} days</span>
                </div>
              )}
              {pg?.spacing && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">{pg.spacing}</span>
                </div>
              )}
            </div>
            {pg?.hardinessZones && (
              <div className="mt-3">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Hardiness Zones: </span>
                <span className="text-gray-600 dark:text-gray-300">{parseJsonField(pg.hardinessZones)}</span>
              </div>
            )}
          </div>
        )}

        {/* Uses */}
        {(pg?.culinaryUses || pg?.medicinalUses || pg?.craftIdeas) && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Uses</h4>
            <div className="space-y-2 text-sm">
              {pg?.culinaryUses && (
                <div><span className="font-medium text-gray-500">Culinary:</span> <span className="text-gray-600 dark:text-gray-400">{pg.culinaryUses}</span></div>
              )}
              {pg?.medicinalUses && (
                <div><span className="font-medium text-gray-500">Medicinal:</span> <span className="text-gray-600 dark:text-gray-400">{pg.medicinalUses}</span></div>
              )}
              {pg?.craftIdeas && (
                <div><span className="font-medium text-gray-500">Craft:</span> <span className="text-gray-600 dark:text-gray-400">{pg.craftIdeas}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Companion Planting */}
        {(pg?.companionPlants || pg?.avoidPlants) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pg?.companionPlants && (
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">Good Companions</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{pg.companionPlants}</p>
              </div>
            )}
            {pg?.avoidPlants && (
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-1">Avoid Planting With</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{pg.avoidPlants}</p>
              </div>
            )}
          </div>
        )}

        {/* Fun Facts & Variations */}
        {(pg?.funFacts || pg?.variations) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pg?.funFacts && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Fun Facts</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{parseJsonField(pg.funFacts)}</p>
              </div>
            )}
            {pg?.variations && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Varieties</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{parseJsonField(pg.variations)}</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {pg?.history && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">History & Origins</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{pg.history}</p>
          </div>
        )}

        {/* Notes */}
        {pg?.notes && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{pg.notes}</p>
          </div>
        )}

        {/* Source URL */}
        {submission.sourceUrl && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Source</h4>
            <a 
              href={submission.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
            >
              {submission.sourceUrl}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Admin Notes (for already processed) */}
        {submission.adminNotes && submission.status !== 'pending' && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Admin Notes
            </h4>
            <p className="text-gray-600 dark:text-gray-400">{submission.adminNotes}</p>
          </div>
        )}

        {/* No plant data warning */}
        {!pg && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              ⚠️ No associated plant data found. This submission may have been created before the full submission system was implemented.
            </p>
          </div>
        )}
      </>
    )
  }

  const renderEditMode = () => {
    if (!editForm) return null

    const tabs = [
      { id: 'basic', label: 'Basic Info' },
      { id: 'details', label: 'Details' },
      { id: 'uses', label: 'Uses' },
      { id: 'growing', label: 'Growing' },
    ] as const

    return (
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveEditTab(tab.id)}
              className={`px-3 py-1 text-sm rounded-t-lg ${
                activeEditTab === tab.id
                  ? 'bg-garden-100 dark:bg-garden-900/30 text-garden-800 dark:text-garden-200 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeEditTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Plant Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Scientific Name</label>
                <input
                  type="text"
                  value={editForm.scientificName}
                  onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="input"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">General Information</label>
              <textarea
                value={editForm.generalInfo}
                onChange={(e) => setEditForm({ ...editForm, generalInfo: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeEditTab === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="label">Hardiness Zones (comma-separated)</label>
              <input
                type="text"
                value={editForm.hardinessZones}
                onChange={(e) => setEditForm({ ...editForm, hardinessZones: e.target.value })}
                className="input"
                placeholder="e.g., 4a, 4b, 5a, 5b"
              />
            </div>

            <div>
              <label className="label">Fun Facts (comma-separated)</label>
              <textarea
                value={editForm.funFacts}
                onChange={(e) => setEditForm({ ...editForm, funFacts: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="label">Varieties (comma-separated)</label>
              <textarea
                value={editForm.variations}
                onChange={(e) => setEditForm({ ...editForm, variations: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="label">History & Origins</label>
              <textarea
                value={editForm.history}
                onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Cultural Significance</label>
              <textarea
                value={editForm.culturalSignificance}
                onChange={(e) => setEditForm({ ...editForm, culturalSignificance: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="label">Source URL</label>
              <input
                type="url"
                value={editForm.sourceUrl}
                onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                className="input"
              />
            </div>
          </div>
        )}

        {/* Uses Tab */}
        {activeEditTab === 'uses' && (
          <div className="space-y-4">
            <div>
              <label className="label">Culinary Uses</label>
              <textarea
                value={editForm.culinaryUses}
                onChange={(e) => setEditForm({ ...editForm, culinaryUses: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Medicinal Uses</label>
              <textarea
                value={editForm.medicinalUses}
                onChange={(e) => setEditForm({ ...editForm, medicinalUses: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Holistic Uses</label>
              <textarea
                value={editForm.holisticUses}
                onChange={(e) => setEditForm({ ...editForm, holisticUses: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="label">Craft & DIY Ideas</label>
              <textarea
                value={editForm.craftIdeas}
                onChange={(e) => setEditForm({ ...editForm, craftIdeas: e.target.value })}
                className="input"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Growing Tab */}
        {activeEditTab === 'growing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Sun Requirement</label>
                <select
                  value={editForm.sunRequirement}
                  onChange={(e) => setEditForm({ ...editForm, sunRequirement: e.target.value })}
                  className="input"
                >
                  {sunOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Water Needs</label>
                <select
                  value={editForm.waterNeeds}
                  onChange={(e) => setEditForm({ ...editForm, waterNeeds: e.target.value })}
                  className="input"
                >
                  {waterOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Days to Maturity</label>
                <input
                  type="text"
                  value={editForm.daysToMaturity}
                  onChange={(e) => setEditForm({ ...editForm, daysToMaturity: e.target.value })}
                  className="input"
                  placeholder="e.g., 60"
                />
              </div>

              <div>
                <label className="label">Spacing</label>
                <input
                  type="text"
                  value={editForm.spacing}
                  onChange={(e) => setEditForm({ ...editForm, spacing: e.target.value })}
                  className="input"
                  placeholder="e.g., 12-18 inches"
                />
              </div>

              <div>
                <label className="label">Planting Depth</label>
                <input
                  type="text"
                  value={editForm.plantingDepth}
                  onChange={(e) => setEditForm({ ...editForm, plantingDepth: e.target.value })}
                  className="input"
                  placeholder="e.g., 1/4 inch"
                />
              </div>
            </div>

            <div>
              <label className="label">Companion Plants</label>
              <input
                type="text"
                value={editForm.companionPlants}
                onChange={(e) => setEditForm({ ...editForm, companionPlants: e.target.value })}
                className="input"
                placeholder="e.g., Tomatoes, Basil, Peppers"
              />
            </div>

            <div>
              <label className="label">Avoid Planting With</label>
              <input
                type="text"
                value={editForm.avoidPlants}
                onChange={(e) => setEditForm({ ...editForm, avoidPlants: e.target.value })}
                className="input"
                placeholder="e.g., Fennel, Dill"
              />
            </div>

            <div>
              <label className="label">Additional Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plant Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve user-submitted plant suggestions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-garden-100 dark:bg-garden-900/30 text-garden-800 dark:text-garden-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            No {filter === 'all' ? '' : filter} submissions found
          </div>
        ) : (
          submissions.map((submission) => (
            <div 
              key={submission.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {submission.plantName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {submission.plantingGuide?.category && (
                          <span className="capitalize">{submission.plantingGuide.category}</span>
                        )}
                        {submission.plantingGuide?.scientificName && (
                          <span className="italic">{submission.plantingGuide.scientificName}</span>
                        )}
                        {submission.plantingGuide && (
                          <span className={submission.plantingGuide.isApproved ? 'text-green-500' : 'text-amber-500'}>
                            {submission.plantingGuide.isApproved ? '✓ In Encyclopedia' : '○ Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(submission.status)}
                    {expandedId === submission.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === submission.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Submitted by {submission.user.name || submission.user.email}</span>
                    <span>•</span>
                    <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                  </div>

                  {editingId === submission.id && editForm ? (
                    <>
                      {renderEditMode()}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => saveEdits(submission)}
                          disabled={processing === submission.id || !editForm.name.trim()}
                          className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {processing === submission.id ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={processing === submission.id}
                          className="btn bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {renderViewMode(submission)}

                      {/* Action Panel (for pending) */}
                      {submission.status === 'pending' && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                          <div className="mb-4">
                            <label className="label">Admin Notes (optional)</label>
                            <textarea
                              value={adminNotes[submission.id] || ''}
                              onChange={(e) => setAdminNotes({ ...adminNotes, [submission.id]: e.target.value })}
                              placeholder="Add notes about your decision..."
                              rows={2}
                              className="input"
                            />
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={() => startEditing(submission)}
                              disabled={processing === submission.id}
                              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Before Approving
                            </button>
                            <button
                              onClick={() => handleAction(submission.id, 'approve')}
                              disabled={processing === submission.id}
                              className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {processing === submission.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleAction(submission.id, 'reject')}
                              disabled={processing === submission.id}
                              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
