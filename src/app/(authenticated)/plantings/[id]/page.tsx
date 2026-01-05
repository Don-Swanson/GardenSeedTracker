'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MapPin, Calendar, Plus, Edit2, Trash2, Save, X,
  Sprout, Check
} from 'lucide-react'
import { formatDate, plantingStatuses } from '@/lib/garden-utils'

interface PlantingEvent {
  id: string
  date: string
  quantity: number | null
  method: string | null
  notes: string | null
}

interface Planting {
  id: string
  seed: {
    id: string
    name: string
    variety: string | null
  }
  locationName: string
  quantityPlanted: number
  harvestDate: string | null
  actualYield: string | null
  status: string
  notes: string | null
  plantingEvents: PlantingEvent[]
}

export default function PlantingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [planting, setPlanting] = useState<Planting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // For adding new event
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    method: '',
    notes: '',
  })
  const [savingEvent, setSavingEvent] = useState(false)
  
  // For editing event
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editEventData, setEditEventData] = useState({
    date: '',
    quantity: '',
    method: '',
    notes: '',
  })

  // For editing planting details
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({
    locationName: '',
    quantityPlanted: '',
    status: '',
    notes: '',
    harvestDate: '',
    actualYield: '',
  })

  useEffect(() => {
    async function fetchPlanting() {
      const { id } = await params
      try {
        const res = await fetch(`/api/plantings/${id}`)
        if (!res.ok) throw new Error('Failed to fetch planting')
        const data = await res.json()
        setPlanting(data)
        setDetailsForm({
          locationName: data.locationName || '',
          quantityPlanted: data.quantityPlanted?.toString() || '',
          status: data.status || 'planted',
          notes: data.notes || '',
          harvestDate: data.harvestDate ? data.harvestDate.split('T')[0] : '',
          actualYield: data.actualYield || '',
        })
      } catch (err) {
        setError('Failed to load planting details')
      } finally {
        setLoading(false)
      }
    }
    fetchPlanting()
  }, [params])

  const handleAddEvent = async () => {
    if (!planting || !newEvent.date) return
    setSavingEvent(true)
    
    try {
      const res = await fetch(`/api/plantings/${planting.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newEvent.date,
          quantity: newEvent.quantity ? parseInt(newEvent.quantity) : null,
          method: newEvent.method || null,
          notes: newEvent.notes || null,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to add planting date')
      
      const event = await res.json()
      setPlanting({
        ...planting,
        plantingEvents: [event, ...planting.plantingEvents],
      })
      setShowAddEvent(false)
      setNewEvent({ date: new Date().toISOString().split('T')[0], quantity: '', method: '', notes: '' })
    } catch (err) {
      setError('Failed to add planting date')
    } finally {
      setSavingEvent(false)
    }
  }

  const startEditEvent = (event: PlantingEvent) => {
    setEditingEventId(event.id)
    setEditEventData({
      date: event.date.split('T')[0],
      quantity: event.quantity?.toString() || '',
      method: event.method || '',
      notes: event.notes || '',
    })
  }

  const handleUpdateEvent = async (eventId: string) => {
    if (!planting) return
    setSavingEvent(true)
    
    try {
      const res = await fetch(`/api/plantings/${planting.id}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editEventData.date,
          quantity: editEventData.quantity ? parseInt(editEventData.quantity) : null,
          method: editEventData.method || null,
          notes: editEventData.notes || null,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update planting date')
      
      const updated = await res.json()
      setPlanting({
        ...planting,
        plantingEvents: planting.plantingEvents.map(e => 
          e.id === eventId ? updated : e
        ),
      })
      setEditingEventId(null)
    } catch (err) {
      setError('Failed to update planting date')
    } finally {
      setSavingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!planting || !confirm('Are you sure you want to delete this planting date?')) return
    
    try {
      const res = await fetch(`/api/plantings/${planting.id}/events/${eventId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete planting date')
      
      setPlanting({
        ...planting,
        plantingEvents: planting.plantingEvents.filter(e => e.id !== eventId),
      })
    } catch (err) {
      setError('Failed to delete planting date')
    }
  }

  const handleUpdateDetails = async () => {
    if (!planting) return
    setSavingEvent(true)
    
    try {
      const res = await fetch(`/api/plantings/${planting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: detailsForm.locationName,
          quantityPlanted: parseInt(detailsForm.quantityPlanted) || 1,
          status: detailsForm.status,
          notes: detailsForm.notes || null,
          harvestDate: detailsForm.harvestDate || null,
          actualYield: detailsForm.actualYield || null,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update planting')
      
      const updated = await res.json()
      setPlanting(updated)
      setEditingDetails(false)
    } catch (err) {
      setError('Failed to update planting details')
    } finally {
      setSavingEvent(false)
    }
  }

  const handleDelete = async () => {
    if (!planting || !confirm('Are you sure you want to delete this entire planting record?')) return
    
    try {
      const res = await fetch(`/api/plantings/${planting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/plantings')
    } catch (err) {
      setError('Failed to delete planting')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!planting) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">Planting not found</p>
        <Link href="/plantings" className="text-garden-600 hover:underline mt-2 block">
          Back to Plantings
        </Link>
      </div>
    )
  }

  const statusInfo = plantingStatuses.find(s => s.value === planting.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/plantings" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Plantings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {planting.seed.name}
              {planting.seed.variety && <span className="text-gray-500 font-normal"> ({planting.seed.variety})</span>}
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {planting.locationName}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
            {statusInfo?.label || planting.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Planting Details Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planting Details</h2>
          {!editingDetails ? (
            <button
              onClick={() => setEditingDetails(true)}
              className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingDetails(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDetails}
                disabled={savingEvent}
                className="text-sm text-garden-600 hover:text-garden-700 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          )}
        </div>

        {!editingDetails ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Location:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{planting.locationName}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total Quantity:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {planting.plantingEvents.reduce((sum, event) => sum + (event.quantity || 0), 0) || planting.quantityPlanted}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{statusInfo?.label || planting.status}</span>
            </div>
            {planting.harvestDate && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Harvest Date:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDate(planting.harvestDate)}</span>
              </div>
            )}
            {planting.actualYield && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Yield:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{planting.actualYield}</span>
              </div>
            )}
            {planting.notes && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{planting.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={detailsForm.locationName}
                  onChange={(e) => setDetailsForm({ ...detailsForm, locationName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Total Quantity</label>
                <input
                  type="number"
                  value={detailsForm.quantityPlanted}
                  onChange={(e) => setDetailsForm({ ...detailsForm, quantityPlanted: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={detailsForm.status}
                  onChange={(e) => setDetailsForm({ ...detailsForm, status: e.target.value })}
                  className="input"
                >
                  {plantingStatuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Harvest Date</label>
                <input
                  type="date"
                  value={detailsForm.harvestDate}
                  onChange={(e) => setDetailsForm({ ...detailsForm, harvestDate: e.target.value })}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Actual Yield</label>
                <input
                  type="text"
                  value={detailsForm.actualYield}
                  onChange={(e) => setDetailsForm({ ...detailsForm, actualYield: e.target.value })}
                  className="input"
                  placeholder="e.g., 5 lbs, 20 tomatoes"
                />
              </div>
              <div className="col-span-2">
                <label className="label">General Notes</label>
                <textarea
                  value={detailsForm.notes}
                  onChange={(e) => setDetailsForm({ ...detailsForm, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Planting Dates Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-garden-600" />
            Planting Dates
            <span className="text-sm font-normal text-gray-500">
              ({planting.plantingEvents.length} date{planting.plantingEvents.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <button
            onClick={() => setShowAddEvent(true)}
            className="btn btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Date
          </button>
        </div>

        {/* Add New Event Form */}
        {showAddEvent && (
          <div className="bg-garden-50 rounded-lg p-4 mb-4 border border-garden-200">
            <h3 className="font-medium text-gray-900 mb-3">Add New Planting Date</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-sm">Date *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-sm">Quantity</label>
                <input
                  type="number"
                  value={newEvent.quantity}
                  onChange={(e) => setNewEvent({ ...newEvent, quantity: e.target.value })}
                  className="input"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label text-sm">Method</label>
                <select
                  value={newEvent.method}
                  onChange={(e) => setNewEvent({ ...newEvent, method: e.target.value })}
                  className="input"
                >
                  <option value="">Select method...</option>
                  <option value="direct sow">Direct Sow</option>
                  <option value="transplant">Transplant</option>
                  <option value="indoor start">Indoor Start</option>
                  <option value="succession">Succession Planting</option>
                </select>
              </div>
              <div>
                <label className="label text-sm">Notes</label>
                <input
                  type="text"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="input"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={savingEvent || !newEvent.date}
                className="btn btn-primary text-sm"
              >
                {savingEvent ? 'Saving...' : 'Add Date'}
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        {planting.plantingEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No planting dates recorded yet. Add your first one!
          </p>
        ) : (
          <div className="space-y-3">
            {planting.plantingEvents.map((event) => (
              <div 
                key={event.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-garden-300 dark:hover:border-garden-600 transition-colors"
              >
                {editingEventId === event.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-sm">Date</label>
                        <input
                          type="date"
                          value={editEventData.date}
                          onChange={(e) => setEditEventData({ ...editEventData, date: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Quantity</label>
                        <input
                          type="number"
                          value={editEventData.quantity}
                          onChange={(e) => setEditEventData({ ...editEventData, quantity: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Method</label>
                        <select
                          value={editEventData.method}
                          onChange={(e) => setEditEventData({ ...editEventData, method: e.target.value })}
                          className="input"
                        >
                          <option value="">Select method...</option>
                          <option value="direct sow">Direct Sow</option>
                          <option value="transplant">Transplant</option>
                          <option value="indoor start">Indoor Start</option>
                          <option value="succession">Succession Planting</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-sm">Notes</label>
                        <input
                          type="text"
                          value={editEventData.notes}
                          onChange={(e) => setEditEventData({ ...editEventData, notes: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingEventId(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateEvent(event.id)}
                        disabled={savingEvent}
                        className="btn btn-primary text-sm"
                      >
                        {savingEvent ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-garden-100 dark:bg-garden-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sprout className="w-5 h-5 text-garden-600 dark:text-garden-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(event.date)}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {event.quantity && (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                              Qty: {event.quantity}
                            </span>
                          )}
                          {event.method && (
                            <span className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              {event.method}
                            </span>
                          )}
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">{event.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditEvent(event)}
                        className="p-2 text-gray-400 hover:text-garden-600 hover:bg-garden-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Planting */}
      <div className="card border-red-200 bg-red-50">
        <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">
          Deleting this planting will remove all associated planting dates and cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Delete Entire Planting
        </button>
      </div>
    </div>
  )
}
