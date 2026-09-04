/**
 * CivicLens Geospatial & Reverse Geocoding Utilities
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// In-memory cache for reverse geocoding to avoid redundant API calls
const geoCache: Record<string, string> = {};

/**
 * Parse PostGIS geometry (EWKB hex, WKT string, GeoJSON object) into { lat, lng }
 */
export function parsePostGISPoint(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;

  // 1. GeoJSON object { type: "Point", coordinates: [lng, lat] }
  if (typeof loc === "object" && loc.type === "Point" && Array.isArray(loc.coordinates)) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }

  // 2. WKT string "POINT(lng lat)"
  if (typeof loc === "string" && loc.startsWith("POINT(")) {
    const coords = loc.replace("POINT(", "").replace(")", "").trim().split(/\s+/);
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    if (!isNaN(lng) && !isNaN(lat)) return { lng, lat };
  }

  // 3. EWKB Hex string (e.g. 0101000020E6100000...)
  if (typeof loc === "string" && loc.length >= 42 && /^[0-9A-Fa-f]+$/.test(loc)) {
    try {
      const buf = Buffer.from(loc, "hex");
      const isLittleEndian = buf.readUInt8(0) === 1;
      const type = isLittleEndian ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
      
      // If type has SRID flag (0x20000000), offset for coords is 9 bytes
      const hasSRID = (type & 0x20000000) !== 0;
      const offset = hasSRID ? 9 : 5;

      const lng = isLittleEndian ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset);
      const lat = isLittleEndian ? buf.readDoubleLE(offset + 8) : buf.readDoubleBE(offset + 8);

      if (!isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lng, lat };
      }
    } catch (e) {
      console.warn("EWKB parsing error:", e);
    }
  }

  return null;
}

/**
 * Reverse geocode [lng, lat] to a readable Indian street / city address using Mapbox
 */
export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geoCache[cacheKey]) return geoCache[cacheKey];

  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=IN&types=address,poi,neighborhood,locality,place`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          let placeName = data.features[0].place_name;
          // Clean up Arabic commas or trailing India
          placeName = placeName.replace(/،/g, ",").replace(/, India$/, "").trim();
          geoCache[cacheKey] = placeName;
          return placeName;
        }
      }
    } catch (err) {
      console.warn("Mapbox geocoding error:", err);
    }
  }

  return `Lat ${lat.toFixed(4)}°, Lng ${lng.toFixed(4)}°`;
}
