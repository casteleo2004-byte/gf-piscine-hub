import type { GeoPoint, MapsApp } from "./types";

export type TravelMode = "driving" | "walking";

/**
 * Link che apre direttamente la navigazione verso la destinazione.
 * Si usano gli URL https ufficiali: su iPhone aprono l'app Mappe o
 * Google Maps (se installata) senza copiare coordinate a mano.
 */
export function navigationUrl(
  app: MapsApp,
  dest: { point?: GeoPoint; address?: string; label?: string },
  mode: TravelMode = "driving",
  /** Partenza diversa dalla posizione attuale (es. parcheggio → punto spettatore). */
  origin?: GeoPoint,
): string | null {
  const target = dest.point ? `${dest.point.lat},${dest.point.lng}` : dest.address?.trim();
  if (!target) return null;
  const from = origin ? `${origin.lat},${origin.lng}` : undefined;
  if (app === "apple") {
    const params = new URLSearchParams({ daddr: target, dirflg: mode === "walking" ? "w" : "d" });
    if (from) params.set("saddr", from);
    if (dest.label && dest.point) params.set("q", dest.label);
    return `https://maps.apple.com/?${params.toString()}`;
  }
  const params = new URLSearchParams({ api: "1", destination: target, travelmode: mode });
  if (from) params.set("origin", from);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Link per vedere un punto sulla mappa (senza avviare la navigazione). */
export function viewUrl(app: MapsApp, point: GeoPoint, label?: string): string {
  if (app === "apple") {
    const params = new URLSearchParams({ ll: `${point.lat},${point.lng}`, q: label || "Punto" });
    return `https://maps.apple.com/?${params.toString()}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
}
