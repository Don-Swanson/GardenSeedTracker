#!/usr/bin/env node
/**
 * Admin Plant API - Example Script
 * 
 * This script demonstrates how to use the Admin API to manage the plant database.
 * 
 * Setup:
 * 1. Generate an API key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 2. Add ADMIN_API_KEY to your .env file
 * 3. Run this script: npx ts-node scripts/plant-api-example.ts
 * 
 * API Endpoints:
 *   GET    /api/v1/admin/plants           - List all plants (with pagination)
 *   POST   /api/v1/admin/plants           - Create a new plant
 *   GET    /api/v1/admin/plants/:id       - Get a single plant
 *   PUT    /api/v1/admin/plants/:id       - Full update of a plant
 *   PATCH  /api/v1/admin/plants/:id       - Partial update of a plant
 *   DELETE /api/v1/admin/plants/:id       - Delete a plant
 *   PATCH  /api/v1/admin/plants           - Bulk operations (upsert, delete)
 *   POST   /api/v1/admin/plants/search    - Advanced search
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'
const API_KEY = process.env.ADMIN_API_KEY || ''

if (!API_KEY) {
  console.error('Error: ADMIN_API_KEY environment variable is required')
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  process.exit(1)
}

interface PlantData {
  name: string
  category: string
  scientificName?: string
  description?: string
  subcategory?: string
  daysToGerminate?: number
  daysToMaturity?: number
  sunRequirement?: string
  waterNeeds?: string
  spacing?: string
  plantingDepth?: string
  indoorStartWeeks?: number
  outdoorStartWeeks?: number
  transplantWeeks?: number
  harvestWeeks?: number
  companionPlants?: string
  avoidPlants?: string
  commonPests?: string
  commonDiseases?: string
  harvestTips?: string
  storageTips?: string
  // ... and many more fields
}

async function apiRequest(
  method: string, 
  endpoint: string, 
  body?: any
): Promise<any> {
  const url = `${API_BASE}${endpoint}`
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${data.error || 'Unknown error'}`)
  }

  return data
}

// ============== Example Functions ==============

/**
 * List all plants with pagination
 */
async function listPlants(page = 1, limit = 20, category?: string): Promise<void> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  if (category) params.set('category', category)

  const result = await apiRequest('GET', `/api/v1/admin/plants?${params}`)
  console.log(`Found ${result.meta.total} plants (page ${result.meta.page}/${result.meta.totalPages})`)
  console.log('Categories:', result.meta.categories)
  console.log('Plants:', result.data.map((p: any) => p.name))
}

/**
 * Search for plants
 */
async function searchPlants(search: string): Promise<void> {
  const result = await apiRequest('POST', '/api/v1/admin/plants/search', {
    search,
    limit: 10
  })
  console.log(`Search results for "${search}":`, result.data.map((p: any) => p.name))
}

/**
 * Get a single plant by ID
 */
async function getPlant(id: string): Promise<any> {
  const result = await apiRequest('GET', `/api/v1/admin/plants/${id}`)
  console.log('Plant:', result.data)
  return result.data
}

/**
 * Create a new plant
 */
async function createPlant(plantData: PlantData): Promise<any> {
  const result = await apiRequest('POST', '/api/v1/admin/plants', plantData)
  console.log('Created plant:', result.data.name, '(ID:', result.data.id + ')')
  return result.data
}

/**
 * Update a plant (full replacement)
 */
async function updatePlant(id: string, plantData: PlantData): Promise<any> {
  const result = await apiRequest('PUT', `/api/v1/admin/plants/${id}`, plantData)
  console.log('Updated plant:', result.data.name)
  return result.data
}

/**
 * Partial update a plant
 */
async function patchPlant(id: string, updates: Partial<PlantData>): Promise<any> {
  const result = await apiRequest('PATCH', `/api/v1/admin/plants/${id}`, updates)
  console.log('Patched plant:', result.data.name)
  return result.data
}

/**
 * Delete a plant
 */
async function deletePlant(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/v1/admin/plants/${id}`)
  console.log('Deleted plant:', id)
}

/**
 * Bulk upsert plants (create or update)
 */
async function bulkUpsertPlants(plants: PlantData[]): Promise<void> {
  const result = await apiRequest('PATCH', '/api/v1/admin/plants', {
    operation: 'upsert',
    plants
  })
  console.log('Bulk upsert results:')
  console.log('  Success:', result.data.success.length)
  console.log('  Failed:', result.data.failed.length)
  if (result.data.failed.length > 0) {
    console.log('  Failures:', result.data.failed)
  }
}

/**
 * Bulk delete plants by ID
 */
async function bulkDeletePlants(ids: string[]): Promise<void> {
  const result = await apiRequest('PATCH', '/api/v1/admin/plants', {
    operation: 'delete',
    plants: ids
  })
  console.log('Bulk delete results:')
  console.log('  Success:', result.data.success.length)
  console.log('  Failed:', result.data.failed.length)
}

// ============== Run Examples ==============

async function main() {
  console.log('=== Admin Plant API Examples ===\n')

  try {
    // List existing plants
    console.log('--- Listing Plants ---')
    await listPlants()
    console.log()

    // Search for plants
    console.log('--- Searching Plants ---')
    await searchPlants('tomato')
    console.log()

    // Create a new plant
    console.log('--- Creating Plant ---')
    const newPlant = await createPlant({
      name: 'Test Plant (API)',
      category: 'Vegetables',
      scientificName: 'Testus plantus',
      description: 'A test plant created via the Admin API',
      daysToGerminate: 7,
      daysToMaturity: 60,
      sunRequirement: 'Full sun',
      waterNeeds: 'Moderate',
      spacing: '12 inches',
    })
    console.log()

    // Update the plant
    console.log('--- Updating Plant ---')
    await patchPlant(newPlant.id, {
      description: 'Updated description via API',
      daysToMaturity: 65,
    })
    console.log()

    // Get the updated plant
    console.log('--- Getting Plant ---')
    await getPlant(newPlant.id)
    console.log()

    // Delete the test plant
    console.log('--- Deleting Plant ---')
    await deletePlant(newPlant.id)
    console.log()

    // Bulk operations example
    console.log('--- Bulk Upsert Example ---')
    await bulkUpsertPlants([
      {
        name: 'Bulk Test Plant 1',
        category: 'Vegetables',
        description: 'First bulk test plant',
      },
      {
        name: 'Bulk Test Plant 2',
        category: 'Herbs',
        description: 'Second bulk test plant',
      },
    ])
    console.log()

    console.log('All examples completed successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Only run if executed directly
if (require.main === module) {
  main()
}

// Export functions for use as a module
module.exports = {
  listPlants,
  searchPlants,
  getPlant,
  createPlant,
  updatePlant,
  patchPlant,
  deletePlant,
  bulkUpsertPlants,
  bulkDeletePlants,
}
