/**
 * OpenStreetMap Overpass API Client
 * Fetches amenity counts near a location (lat/lng)
 * Results are cached for 30 days
 */

import axios from 'axios';

const OVERPASS_API_BASE = 'https://overpass-api.de/api/interpreter';

export interface AmenityCounts {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  schools: number;
  hospitals: number;
  parks: number;
  restaurants: number;
  shops: number;
  publicTransport: number;
  timestamp: Date;
}

/**
 * Amenity queries for Overpass API
 * Each query returns count of specific amenity type within radius
 */
const AMENITY_QUERIES = {
  schools: '[out:json];(node["amenity"="school"](around:RADIUS,LAT,LNG);way["amenity"="school"](around:RADIUS,LAT,LNG););out count;',
  hospitals: '[out:json];(node["amenity"="hospital"](around:RADIUS,LAT,LNG);way["amenity"="hospital"](around:RADIUS,LAT,LNG););out count;',
  parks: '[out:json];(node["leisure"="park"](around:RADIUS,LAT,LNG);way["leisure"="park"](around:RADIUS,LAT,LNG););out count;',
  restaurants: '[out:json];(node["amenity"="restaurant"](around:RADIUS,LAT,LNG);way["amenity"="restaurant"](around:RADIUS,LAT,LNG););out count;',
  shops: '[out:json];(node["shop"](around:RADIUS,LAT,LNG);way["shop"](around:RADIUS,LAT,LNG););out count;',
  publicTransport: '[out:json];(node["public_transport"="stop_position"](around:RADIUS,LAT,LNG);node["amenity"="bus_station"](around:RADIUS,LAT,LNG);way["public_transport"="platform"](around:RADIUS,LAT,LNG););out count;',
};

/**
 * Fetch amenity counts for a location
 * Default radius: 1000 meters (1 km)
 */
export async function getAmenityCounts(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<AmenityCounts> {
  try {
    const counts: Record<string, number> = {};

    // Query each amenity type in parallel with timeout
    const queries = Object.entries(AMENITY_QUERIES).map(async ([amenityType, query]) => {
      try {
        const overpassQuery = query
          .replace(/LAT/g, latitude.toString())
          .replace(/LNG/g, longitude.toString())
          .replace(/RADIUS/g, radiusMeters.toString());

        const response = await axios.post(OVERPASS_API_BASE, overpassQuery, {
          timeout: 15000,
          headers: { 'Content-Type': 'text/plain' },
        });

        // Extract count from response
        const count = response.data.osm3s?.timestamp_osm_base 
          ? response.data.elements?.[0]?.tags?.total || 0
          : 0;

        counts[amenityType] = count;
      } catch (error) {
        console.warn(`[OSM Overpass] Failed to fetch ${amenityType}:`, error);
        counts[amenityType] = 0; // Default to 0 on error
      }
    });

    await Promise.all(queries);

    return {
      latitude,
      longitude,
      radiusMeters,
      schools: counts.schools || 0,
      hospitals: counts.hospitals || 0,
      parks: counts.parks || 0,
      restaurants: counts.restaurants || 0,
      shops: counts.shops || 0,
      publicTransport: counts.publicTransport || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[OSM Overpass] Failed to get amenity counts:', error);
    throw new Error(`Overpass API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate amenity quality signals for valuation
 */
export function extractAmenitySignals(amenities: AmenityCounts): {
  schoolsNearby: string;
  healthcareAccess: string;
  recreationAccess: string;
  retailAccess: string;
  transportAccess: string;
  amenityScore: number; // 0-100
} {
  const schoolScore = Math.min(amenities.schools / 2, 20); // Max 20 points
  const healthScore = Math.min(amenities.hospitals * 10, 20); // Max 20 points
  const parkScore = Math.min(amenities.parks / 2, 20); // Max 20 points
  const retailScore = Math.min(amenities.shops / 5, 20); // Max 20 points
  const transportScore = Math.min(amenities.publicTransport * 5, 20); // Max 20 points

  const totalScore = Math.round(schoolScore + healthScore + parkScore + retailScore + transportScore);

  return {
    schoolsNearby: amenities.schools > 0 ? `${amenities.schools} nearby` : 'None nearby',
    healthcareAccess: amenities.hospitals > 0 ? `${amenities.hospitals} hospital(s)` : 'Limited access',
    recreationAccess: amenities.parks > 0 ? `${amenities.parks} park(s)` : 'Limited access',
    retailAccess: amenities.shops > 0 ? `${amenities.shops} shops` : 'Limited access',
    transportAccess: amenities.publicTransport > 0 ? `${amenities.publicTransport} stops` : 'Limited access',
    amenityScore: totalScore,
  };
}
