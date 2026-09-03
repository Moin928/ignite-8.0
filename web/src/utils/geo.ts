/**
 * CivicLens Geospatial & Reverse Geocoding Utilities
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// In-memory cache for reverse geocoding
const geoCache: Record<string, string> = {};

// Fallback Indian bounding boxes & major cities for fast local resolution
const INDIAN_CITIES = [
  { name: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, radius: 0.5 },
  { name: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, radius: 0.6 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, radius: 0.6 },
  { name: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867, radius: 0.5 },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, radius: 0.5 },
  { name: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, radius: 0.4 },
  { name: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, radius: 0.5 },
  { name: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, radius: 0.5 },
];

/**
 * Reverse geocode [lng, lat] to a readable Indian street / city address
 */
export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geoCache[cacheKey]) return geoCache[cacheKey];

  // Try Mapbox Reverse Geocoding API if token is available
  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=IN&types=poi,address,neighborhood,locality,place`;
      const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache for 24h
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const placeName = data.features[0].place_name;
          // Trim country name from end if present
          const cleanName = placeName.replace(/, India$/, "");
          geoCache[cacheKey] = cleanName;
          return cleanName;
        }
      }
    } catch (err) {
      console.warn("Mapbox geocoding error:", err);
    }
  }

  // Fallback: estimate nearest major Indian city
  for (const city of INDIAN_CITIES) {
    const dLat = Math.abs(city.lat - lat);
    const dLng = Math.abs(city.lng - lng);
    if (dLat < city.radius && dLng < city.radius) {
      const result = `${city.name} (Ward Sector)`;
      geoCache[cacheKey] = result;
      return result;
    }
  }

  return `Lat ${lat.toFixed(4)}°, Lng ${lng.toFixed(4)}°`;
}

/**
 * Parse PostGIS POINT(lng lat) into coordinates object
 */
export function parsePostGISPoint(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;
  if (typeof loc === "object" && loc.type === "Point" && Array.isArray(loc.coordinates)) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  if (typeof loc === "string" && loc.startsWith("POINT(")) {
    const coords = loc.replace("POINT(", "").replace(")", "").split(" ");
    return { lng: parseFloat(coords[0]), lat: parseFloat(coords[1]) };
  }
  return null;
}
