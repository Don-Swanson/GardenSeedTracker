// Distance helpers for the swap board's "near me" filter/sort. SQLite has no
// built-in geo functions, so the pattern used throughout the swap listings
// API is: use boundingBox() to cheaply narrow the SQL query to a candidate
// set, then compute exact distances with haversineMiles() in JS and filter
// to the real radius (a bounding box is a square, not a circle).

const EARTH_RADIUS_MILES = 3958.8
const MILES_PER_DEGREE_LATITUDE = 69.0

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two points, in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

export interface BoundingBox {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

/**
 * A square that fully contains the circle of `radiusMiles` around
 * (lat, lon) - a cheap pre-filter for a SQL WHERE clause. Always over-
 * inclusive; callers must still check haversineMiles against the real
 * radius for an exact match.
 */
export function boundingBox(lat: number, lon: number, radiusMiles: number): BoundingBox {
  const latDelta = radiusMiles / MILES_PER_DEGREE_LATITUDE
  // Longitude degrees get narrower away from the equator; clamp so we don't
  // divide by ~0 near the poles (irrelevant here, but keeps this safe).
  const milesPerDegreeLongitude = Math.max(MILES_PER_DEGREE_LATITUDE * Math.cos(toRadians(lat)), 1)
  const lonDelta = radiusMiles / milesPerDegreeLongitude
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  }
}

/**
 * Rounds a coordinate to ~1km precision. Used so a listing's stored
 * location is never precise enough to identify an exact address, while
 * still being useful for "how far away is this" sorting/filtering.
 */
export function roundCoordinateForPrivacy(value: number): number {
  return Math.round(value * 100) / 100
}
