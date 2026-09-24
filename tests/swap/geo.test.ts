import assert from 'node:assert/strict'
import { test } from 'node:test'
import { boundingBox, haversineMiles, roundCoordinateForPrivacy } from '../../src/lib/geo'

test('haversineMiles returns 0 for the same point', () => {
  assert.equal(haversineMiles(30.5169, -86.4822, 30.5169, -86.4822), 0)
})

test('haversineMiles roughly matches a known distance (NYC to LA ~2445 mi)', () => {
  const distance = haversineMiles(40.7128, -74.006, 34.0522, -118.2437)
  assert.ok(distance > 2400 && distance < 2500, `expected ~2445mi, got ${distance}`)
})

test('boundingBox contains the center point and roughly the expected radius', () => {
  const box = boundingBox(30.5169, -86.4822, 25)
  assert.ok(box.minLat < 30.5169 && box.maxLat > 30.5169)
  assert.ok(box.minLon < -86.4822 && box.maxLon > -86.4822)
  // A point just inside the box's latitude edge should be within ~25 miles north.
  const edgeDistance = haversineMiles(30.5169, -86.4822, box.maxLat, -86.4822)
  assert.ok(edgeDistance > 20 && edgeDistance < 30, `expected ~25mi, got ${edgeDistance}`)
})

test('roundCoordinateForPrivacy rounds to 2 decimal places (~1km)', () => {
  assert.equal(roundCoordinateForPrivacy(30.516923), 30.52)
  assert.equal(roundCoordinateForPrivacy(-86.482201), -86.48)
})
