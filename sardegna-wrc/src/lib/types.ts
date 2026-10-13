// Modelli dati dell'app. Tutto è serializzabile in JSON così da poter
// passare in futuro da localStorage a Supabase senza cambiare la UI.

/** Data in formato ISO "YYYY-MM-DD" (ora locale). */
export type ISODate = string;
/** Orario "HH:MM" (24h, ora locale). */
export type HHMM = string;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  baseName: string;
  base: GeoPoint;
}

export type DayKind = "viaggio" | "rally" | "turismo" | "misto";

export interface TripDay {
  date: ISODate;
  title: string;
  kind: DayKind;
  /** Luogo/base del giorno (es. "Alghero", "Traghetto"). */
  location: string;
  gearPresetId?: string;
  notes?: string;
  /** Prove scelte per la giornata ("il vostro piano"). */
  planStageIds?: string[];
}

export type EventType =
  | "sveglia"
  | "partenza"
  | "auto"
  | "parcheggio"
  | "piedi"
  | "spettatore"
  | "prova"
  | "rally"
  | "pasto"
  | "visita"
  | "spiaggia"
  | "panorama"
  | "traghetto"
  | "altro";

export interface TripEvent {
  id: string;
  date: ISODate;
  time: HHMM;
  title: string;
  type: EventType;
  /** Destinazione esplicita. Se assente si usa placeId / stageId. */
  point?: GeoPoint;
  address?: string;
  placeId?: string;
  stageId?: string;
  /** Orario consigliato di partenza per raggiungere la tappa. */
  departAt?: HHMM;
  driveMinutes?: number;
  walkMinutes?: number;
  distanceKm?: number;
  /** Orario limite (es. chiusura accessi). */
  deadline?: HHMM;
  roadClosure?: HHMM;
  notes?: string;
  /** Fuori dal piano del giorno: mostrata in un gruppo a parte, mai come "prossima". */
  optional?: boolean;
  /** Facoltativa anche se la sua prova è nel piano (es. secondo passaggio saltato per riposare). */
  skip?: boolean;
  /** Mete alternative tra cui scegliere (id dei luoghi); quella scelta è placeId. */
  choices?: string[];
  done: boolean;
}

export interface StagePass {
  label: string;
  time: HHMM;
  roadClosure?: HHMM;
}

export type Access = "facile" | "media" | "difficile";

export interface RallyStage {
  id: string;
  number: number;
  name: string;
  date: ISODate;
  firstCar: HHMM;
  /** Passaggi aggiuntivi (es. secondo passaggio pomeridiano). */
  passes: StagePass[];
  /** Se vuoto viene calcolato da chiusura strada, auto, piedi e margine. */
  departAt?: HHMM;
  parkingName?: string;
  parking?: GeoPoint;
  /** "access" = Access Point ufficiale (poi accesso segnalato), "parking" = parcheggio esatto. */
  parkingKind?: "access" | "parking";
  /** Ingresso ufficiale da cui passare per arrivare al parcheggio (percorso di accesso delle mappe ufficiali). */
  accessVia?: GeoPoint;
  lengthKm?: number;
  /** Scheda ufficiale della prova (asset statico in public/). */
  mapImage?: string;
  spectatorPointId?: string;
  driveMinutes?: number;
  walkMinutes?: number;
  walkKm?: number;
  elevationM?: number;
  roadClosure?: HHMM;
  access?: Access;
  gear?: string;
  notes?: string;
  seen: boolean;
}

export interface SpectatorPoint {
  id: string;
  stageId: string;
  name: string;
  point?: GeoPoint;
  /** Indirizzo/luogo per la navigazione quando mancano le coordinate. */
  address?: string;
  /** Access Point ufficiale da cui si raggiunge l'area (in auto). */
  access?: GeoPoint;
  /** Spettacolarità 1–5. */
  wow?: number;
  /** Da dove viene l'informazione. */
  source?: string;
  /** Tragitto a piedi dal parcheggio spettatori a questo punto. */
  walkRoute?: string;
  /** Parcheggio più adatto per quest'area (se diverso da quello della prova). */
  parking?: GeoPoint;
  parkingName?: string;
  /** Distanza parcheggio → area in linea d'aria (metri). */
  walkDistance?: number;
  /** Vista dall'alto dell'area (asset statico in public/). */
  image?: string;
  description?: string;
  notes?: string;
  position?: string;
  cornerType?: string;
  /** 1–5 */
  visibility?: number;
  /** 1–5 */
  safety?: number;
  roadDistanceM?: number;
  photoGear?: string;
  /** Area riservata RIS Experience (accessibile con il Pass Gold). */
  experienceArea?: boolean;
  photoIds: string[];
}

export type PlaceCategory =
  | "rally"
  | "parcheggio"
  | "spettatore"
  | "spiaggia"
  | "panorama"
  | "ristorante"
  | "bar"
  | "supermercato"
  | "distributore"
  | "attrazione"
  | "visitare"
  | "alloggio";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  point?: GeoPoint;
  address?: string;
  notes?: string;
  hours?: string;
  booking?: string;
  photoIds: string[];
  visited: boolean;
}

export interface GearItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface GearPreset {
  id: string;
  name: string;
  items: GearItem[];
}

export interface DiaryEntry {
  date: ISODate;
  places?: string;
  km?: number;
  restaurant?: string;
  spend?: number;
  favoritePhotoId?: string;
  /** 1–5 */
  rating?: number;
  note?: string;
}

export type MapsApp = "apple" | "google";
export type Theme = "dark" | "sun";

export interface Settings {
  mapsApp: MapsApp;
  theme: Theme;
  /** Margine (minuti) usato nel calcolo della partenza consigliata. */
  bufferMinutes: number;
}

export interface AppData {
  version: number;
  trip: Trip;
  days: TripDay[];
  events: TripEvent[];
  stages: RallyStage[];
  spectatorPoints: SpectatorPoint[];
  places: Place[];
  gearPresets: GearPreset[];
  diary: DiaryEntry[];
  settings: Settings;
}
