/**
 * Shared geo helpers for the shop's real-world location (as opposed to
 * `locations.service.ts`, which is the unrelated delivery-city picker
 * shown in `LocationBar`). Backed by `site_settings.latitude/longitude`
 * (see 0019_site_settings_coordinates.sql) — used anywhere the app lets a
 * customer check how far the RenTools yard is or get directions to it.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** "850 m" under 1km, otherwise "6.4 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export type GeoErrorReason = "unsupported" | "denied" | "unavailable";

export class GeoError extends Error {
  reason: GeoErrorReason;
  constructor(reason: GeoErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

/**
 * Asks the browser for the customer's current position and returns the
 * distance in km from that position to the shop. Rejects with a
 * `GeoError` (never a raw browser error) so callers can show a friendly
 * message regardless of why location wasn't available.
 */
export function getDistanceFromUser(shopLat: number, shopLng: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new GeoError("unsupported", "Geolocation isn't supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const km = haversineDistanceKm(
          position.coords.latitude,
          position.coords.longitude,
          shopLat,
          shopLng,
        );
        resolve(km);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeoError("denied", "Location access was denied."));
        } else {
          reject(new GeoError("unavailable", "Couldn't determine your location."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/** Google Maps turn-by-turn directions link, precise to the coordinate. */
export function getDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** Google Maps place link, precise to the coordinate (for "view on map" style links). */
export function getMapsViewUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
