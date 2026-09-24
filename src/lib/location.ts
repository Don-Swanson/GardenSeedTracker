// Shared helpers for turning a US ZIP code into a latitude/longitude, a
// place name and a USDA hardiness zone. Kept free of fetch/network calls so
// it can be unit tested without hitting the two external services.

export const US_ZIP_REGEX = /^\d{5}$/

export function isValidUsZip(zip: string): boolean {
  return US_ZIP_REGEX.test(zip)
}

export interface ZippopotamPlace {
  latitude: string
  longitude: string
  'place name': string
  'state abbreviation': string
}

export interface ZippopotamResponse {
  places?: ZippopotamPlace[]
}

export interface PhzmapiResponse {
  zone?: string
  coordinates?: { lat?: string; lon?: string }
}

export interface LocationLookupResult {
  zipCode: string
  place: string | null
  latitude: number | null
  longitude: number | null
  zone: string | null
}

/**
 * Combine the two providers' responses into one result.
 * - zippopotam.us gives place name + coordinates (used as primary lat/lon,
 *   since it's what the app already relied on before this feature existed).
 * - phzmapi.org gives the USDA zone, and its own coordinates as a fallback
 *   when zippopotam is unavailable.
 * Either provider can fail independently; we return whatever we have.
 */
export function combineLocationLookup(
  zip: string,
  zippopotam: ZippopotamResponse | null,
  phzmapi: PhzmapiResponse | null
): LocationLookupResult {
  const place = zippopotam?.places?.[0]
  const zipLat = place ? parseFloat(place.latitude) : NaN
  const zipLon = place ? parseFloat(place.longitude) : NaN
  const phzLat = phzmapi?.coordinates?.lat ? parseFloat(phzmapi.coordinates.lat) : NaN
  const phzLon = phzmapi?.coordinates?.lon ? parseFloat(phzmapi.coordinates.lon) : NaN

  const latitude = Number.isFinite(zipLat) ? zipLat : Number.isFinite(phzLat) ? phzLat : null
  const longitude = Number.isFinite(zipLon) ? zipLon : Number.isFinite(phzLon) ? phzLon : null

  return {
    zipCode: zip,
    place: place ? `${place['place name']}, ${place['state abbreviation']}` : null,
    latitude,
    longitude,
    zone: phzmapi?.zone || null,
  }
}
