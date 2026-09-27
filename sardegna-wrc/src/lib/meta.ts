import {
  AlarmClock,
  Camera,
  Car,
  Circle,
  Eye,
  Flag,
  Footprints,
  Fuel,
  Landmark,
  MapPin,
  Mountain,
  ParkingSquare,
  ShoppingCart,
  Ship,
  Coffee,
  Umbrella,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { EventType, PlaceCategory } from "./types";

// Etichette, icone e colori per tipi di attività e categorie di luoghi.

export type Tone = "rally" | "accent" | "ok" | "info" | "warn" | "muted";

export const toneText: Record<Tone, string> = {
  rally: "text-rally",
  accent: "text-hi",
  ok: "text-ok",
  info: "text-info",
  warn: "text-warn",
  muted: "text-muted",
};

export const EVENT_TYPES: Record<EventType, { label: string; Icon: LucideIcon; tone: Tone }> = {
  sveglia: { label: "Sveglia", Icon: AlarmClock, tone: "muted" },
  partenza: { label: "Partenza", Icon: Car, tone: "accent" },
  auto: { label: "In auto", Icon: Car, tone: "info" },
  parcheggio: { label: "Parcheggio", Icon: ParkingSquare, tone: "rally" },
  piedi: { label: "A piedi", Icon: Footprints, tone: "rally" },
  spettatore: { label: "Punto spettatore", Icon: Eye, tone: "rally" },
  prova: { label: "Prova speciale", Icon: Flag, tone: "rally" },
  rally: { label: "Rally", Icon: Flag, tone: "rally" },
  pasto: { label: "Mangiare", Icon: Utensils, tone: "warn" },
  visita: { label: "Visita", Icon: Landmark, tone: "info" },
  spiaggia: { label: "Spiaggia", Icon: Umbrella, tone: "info" },
  panorama: { label: "Panorama", Icon: Mountain, tone: "info" },
  traghetto: { label: "Traghetto", Icon: Ship, tone: "info" },
  altro: { label: "Altro", Icon: Circle, tone: "muted" },
};

export const PLACE_CATEGORIES: Record<PlaceCategory, { label: string; Icon: LucideIcon; tone: Tone }> = {
  rally: { label: "Rally", Icon: Flag, tone: "rally" },
  parcheggio: { label: "Parcheggio", Icon: ParkingSquare, tone: "rally" },
  spettatore: { label: "Punto spettatore", Icon: Eye, tone: "rally" },
  spiaggia: { label: "Spiaggia", Icon: Umbrella, tone: "info" },
  panorama: { label: "Panorama", Icon: Mountain, tone: "info" },
  ristorante: { label: "Ristorante", Icon: Utensils, tone: "warn" },
  bar: { label: "Bar", Icon: Coffee, tone: "warn" },
  supermercato: { label: "Supermercato", Icon: ShoppingCart, tone: "ok" },
  distributore: { label: "Distributore", Icon: Fuel, tone: "ok" },
  attrazione: { label: "Attrazione", Icon: Camera, tone: "info" },
  visitare: { label: "Da visitare", Icon: MapPin, tone: "info" },
};

/** Filtri semplici della Mappa. */
export const PLACE_FILTERS: { id: string; label: string; cats: PlaceCategory[] | null }[] = [
  { id: "tutti", label: "Tutti", cats: null },
  { id: "rally", label: "Rally", cats: ["rally", "parcheggio", "spettatore"] },
  { id: "mangiare", label: "Mangiare", cats: ["ristorante", "bar", "supermercato"] },
  { id: "visitare", label: "Visitare", cats: ["spiaggia", "panorama", "attrazione", "visitare"] },
  { id: "servizi", label: "Servizi", cats: ["distributore", "supermercato"] },
];
