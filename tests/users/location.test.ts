import assert from 'node:assert/strict'
import { test } from 'node:test'
import { combineLocationLookup, isValidUsZip } from '../../src/lib/location'

test('isValidUsZip only accepts exactly 5 digits', () => {
  assert.equal(isValidUsZip('32578'), true)
  assert.equal(isValidUsZip('3257'), false)
  assert.equal(isValidUsZip('325789'), false)
  assert.equal(isValidUsZip('3257a'), false)
  assert.equal(isValidUsZip('32578-1234'), false)
})

test('combineLocationLookup prefers zippopotam coordinates, uses phzmapi as fallback and for the zone', () => {
  const zippopotam = { places: [{ latitude: '30.5169', longitude: '-86.4822', 'place name': 'Niceville', 'state abbreviation': 'FL' }] }
  const phzmapi = { zone: '9a', coordinates: { lat: '30.500901', lon: '-86.45335' } }

  const result = combineLocationLookup('32578', zippopotam, phzmapi)
  assert.equal(result.latitude, 30.5169) // zippopotam wins when both are present
  assert.equal(result.longitude, -86.4822)
  assert.equal(result.place, 'Niceville, FL')
  assert.equal(result.zone, '9a')
})

test('combineLocationLookup falls back to phzmapi coordinates when zippopotam is unavailable', () => {
  const phzmapi = { zone: '9a', coordinates: { lat: '30.500901', lon: '-86.45335' } }
  const result = combineLocationLookup('32578', null, phzmapi)
  assert.equal(result.latitude, 30.500901)
  assert.equal(result.longitude, -86.45335)
  assert.equal(result.place, null)
  assert.equal(result.zone, '9a')
})

test('combineLocationLookup returns nulls throughout when both providers fail', () => {
  const result = combineLocationLookup('00000', null, null)
  assert.deepEqual(result, { zipCode: '00000', place: null, latitude: null, longitude: null, zone: null })
})

test('combineLocationLookup tolerates zippopotam succeeding with no zone data', () => {
  const zippopotam = { places: [{ latitude: '30.5169', longitude: '-86.4822', 'place name': 'Niceville', 'state abbreviation': 'FL' }] }
  const result = combineLocationLookup('32578', zippopotam, null)
  assert.equal(result.latitude, 30.5169)
  assert.equal(result.zone, null)
})
