import type { GeoPoint } from "./types";

/** Distanza in linea d'aria (km). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Stima grossolana di distanza e tempo su strada partendo dalla linea d'aria
 * (strade sarde tortuose: fattore 1.35, media 55 km/h). Usata solo quando
 * l'utente non ha inserito un tempo reale.
 */
export function estimateDrive(a: GeoPoint, b: GeoPoint): { km: number; minutes: number } {
  const km = haversineKm(a, b) * 1.35;
  return { km, minutes: (km / 55) * 60 };
}

export function formatKm(km: number | undefined): string {
  if (km == null || !Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return km < 10 ? `${km.toFixed(1).replace(".", ",")} km` : `${Math.round(km)} km`;
}

export function formatPoint(p: GeoPoint): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Estrae coordinate da testo libero: "40.56, 8.31", "40,56 8,31",
 * link Google Maps (@lat,lng / q=lat,lng / !3d..!4d..) o Apple Maps (ll=, q=).
 */
export function parsePoint(input: string): GeoPoint | null {
  const s = input.trim();
  if (!s) return null;
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|ll|daddr|destination|query|sll)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i,
    /^(-?\d+\.\d+)\s*[,;\s]\s*(-?\d+\.\d+)$/,
    /^(-?\d+,\d+)\s+(-?\d+,\d+)$/,
    /^(-?\d+,\d+)\s*;\s*(-?\d+,\d+)$/,
  ];
  for (const re of patterns) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1].replace(",", "."));
      const lng = Number(m[2].replace(",", "."));
      if (valid(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/** Posizione GPS corrente (una sola lettura). */
export function getCurrentPoint(timeoutMs = 15000): Promise<GeoPoint & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GPS non disponibile"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(err.code === 1 ? "Permesso posizione negato" : "Posizione non disponibile")),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}
