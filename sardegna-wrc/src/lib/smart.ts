import { estimateDrive, haversineKm } from "./geo";
import type { TravelMode } from "./maps";
import { formatRelative, fromMinutes, toMinutes } from "./time";
import type { AppData, GeoPoint, ISODate, RallyStage, SpectatorPoint, TripDay, TripEvent } from "./types";

// Logica "smart" della Home: niente AI, solo orari e stato delle attività.

export interface Target {
  point?: GeoPoint;
  address?: string;
  label: string;
  mode: TravelMode;
}

const WALK_TYPES = new Set(["piedi", "spettatore", "prova"]);
const INSTANT_TYPES = new Set(["sveglia"]);
const STALE_MINUTES = 60;
const LAST_STALE_MINUTES = 180;
const UNTIMED_WINDOW_MINUTES = 180;

/** Sigla della prova: "SD" per lo shakedown, altrimenti "PS n". */
export function stageCode(stage: Pick<RallyStage, "number">): string {
  return stage.number === 0 ? "SD" : `PS ${stage.number}`;
}

export function spectatorPointOf(stage: RallyStage | undefined, data: AppData): SpectatorPoint | undefined {
  if (!stage) return undefined;
  return (
    data.spectatorPoints.find((p) => p.id === stage.spectatorPointId) ??
    spectatorPointsOf(stage.id, data)[0]
  );
}

/** Punti spettatore di una prova: prima le aree Pass Gold, poi i più spettacolari. */
export function spectatorPointsOf(stageId: string, data: AppData): SpectatorPoint[] {
  return data.spectatorPoints
    .filter((p) => p.stageId === stageId)
    .sort((a, b) => Number(!!b.experienceArea) - Number(!!a.experienceArea) || (b.wow ?? 0) - (a.wow ?? 0));
}

/** Destinazione per il pulsante NAVIGA di un'attività. */
export function resolveTarget(event: TripEvent, data: AppData): Target | null {
  const walking = WALK_TYPES.has(event.type);
  if (event.point || event.address) {
    return { point: event.point, address: event.address, label: event.title, mode: walking ? "walking" : "driving" };
  }
  if (event.placeId) {
    const place = data.places.find((p) => p.id === event.placeId);
    if (place && (place.point || place.address)) {
      return { point: place.point, address: place.address, label: place.name, mode: "driving" };
    }
  }
  if (event.stageId) {
    const stage = data.stages.find((s) => s.id === event.stageId);
    if (!stage) return null;
    if (walking) {
      const sp = spectatorPointOf(stage, data);
      if (sp?.point) return { point: sp.point, label: sp.name, mode: "walking" };
      // Area senza coordinate interne: in auto all'Access Point ufficiale.
      if (sp?.access) return { point: sp.access, label: `${sp.name} · Access Point`, mode: "driving" };
      // Senza coordinate si naviga in auto verso il luogo di avvicinamento.
      if (sp?.address) return { address: sp.address, label: sp.name, mode: "driving" };
    }
    if (stage.parking) {
      return { point: stage.parking, label: stage.parkingName || `Parcheggio ${stageCode(stage)}`, mode: "driving" };
    }
  }
  return null;
}

export interface StageTiming {
  departAt?: string;
  departEstimated: boolean;
  driveMinutes?: number;
  driveEstimated: boolean;
}

/**
 * Partenza consigliata per una prova: se non inserita a mano si calcola
 * all'indietro da chiusura strada (o prima vettura − 45'), tempo a piedi,
 * margine e tempo in auto (stimato dalla distanza se mancante).
 */
export function stageTiming(stage: RallyStage, data: AppData): StageTiming {
  let drive = stage.driveMinutes;
  let driveEstimated = false;
  if (drive == null && stage.parking) {
    drive = Math.round(estimateDrive(data.trip.base, stage.parking).minutes);
    driveEstimated = true;
  }
  if (stage.departAt) {
    return { departAt: stage.departAt, departEstimated: false, driveMinutes: drive, driveEstimated };
  }
  const closure = toMinutes(stage.roadClosure);
  const first = toMinutes(stage.firstCar);
  const mustBeThere = Number.isFinite(closure) ? closure : first - 45;
  if (!Number.isFinite(mustBeThere) || drive == null) {
    return { departEstimated: true, driveMinutes: drive, driveEstimated };
  }
  const depart = mustBeThere - (stage.walkMinutes ?? 0) - data.settings.bufferMinutes - drive;
  // Arrotonda ai 5 minuti precedenti.
  return {
    departAt: fromMinutes(Math.floor(depart / 5) * 5),
    departEstimated: true,
    driveMinutes: drive,
    driveEstimated,
  };
}

export interface EventInfo {
  target: Target | null;
  stage?: RallyStage;
  departAt?: string;
  driveMinutes?: number;
  driveEstimated: boolean;
  walkMinutes?: number;
  distanceKm?: number;
  distanceEstimated: boolean;
  deadline?: string;
  roadClosure?: string;
}

/** Informazioni complete di un'attività, completando i dati mancanti dalla prova collegata. */
export function eventInfo(event: TripEvent, data: AppData): EventInfo {
  const target = resolveTarget(event, data);
  const stage = event.stageId ? data.stages.find((s) => s.id === event.stageId) : undefined;
  const timing = stage ? stageTiming(stage, data) : undefined;
  const isDrive = target?.mode === "driving";

  let driveMinutes = event.driveMinutes;
  let driveEstimated = false;
  if (driveMinutes == null && isDrive && stage) {
    driveMinutes = timing?.driveMinutes;
    driveEstimated = !!timing?.driveEstimated;
  }

  let distanceKm = event.distanceKm;
  let distanceEstimated = false;
  if (distanceKm == null && target?.point) {
    if (isDrive) {
      const km = estimateDrive(data.trip.base, target.point).km;
      // Destinazione = base (es. rientro): la distanza dalla base non dice nulla.
      distanceKm = km >= 0.5 ? km : undefined;
    } else {
      distanceKm = stage?.walkKm ?? undefined;
    }
    distanceEstimated = isDrive;
  }

  let walkMinutes = event.walkMinutes;
  if (walkMinutes == null && stage && (event.type === "parcheggio" || event.type === "piedi")) {
    walkMinutes = stage.walkMinutes;
  }

  let departAt = event.departAt;
  // Un'attività "Partenza" è essa stessa l'orario di partenza.
  if (!departAt && event.type === "partenza") departAt = event.time || timing?.departAt;
  if (!departAt && event.type !== "partenza" && driveMinutes != null && isDrive && !event.stageId) {
    departAt = fromMinutes(toMinutes(event.time) - driveMinutes);
  }

  return {
    target,
    stage,
    departAt,
    driveMinutes,
    driveEstimated,
    walkMinutes,
    distanceKm,
    distanceEstimated,
    deadline: event.deadline,
    roadClosure: event.roadClosure ?? stage?.roadClosure,
  };
}

/** Minuti per l'ordinamento: le attività senza orario ("da definire") vanno in cima. */
const sortMinutes = (t: string | undefined) => {
  const m = toMinutes(t);
  return Number.isFinite(m) ? m : -1;
};

export function eventsOfDay(data: AppData, date: ISODate): TripEvent[] {
  return data.events
    .filter((e) => e.date === date)
    .sort((a, b) => sortMinutes(a.time) - sortMinutes(b.time) || a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function stagesOfDay(data: AppData, date: ISODate): RallyStage[] {
  return data.stages
    .filter((s) => s.date === date)
    .sort((a, b) => a.number - b.number);
}

/**
 * Prossima attività: la prima non completata, saltando quelle ormai
 * superate (un'attività successiva è già iniziata). Così dopo il rally la
 * Home passa da sola al ristorante anche se nessuno ha spuntato nulla.
 * Un'attività iniziata da più di un'ora lascia il posto alla successiva.
 * Se la giornata non è quella corrente (futura) si parte dalla prima.
 */
export function nextEventIndex(events: TripEvent[], nowMin: number, isToday: boolean): number {
  const timed = (e: TripEvent) => Number.isFinite(toMinutes(e.time));
  if (!isToday) return events.findIndex((e) => !e.done);

  let next = -1;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.done || !timed(e)) continue;
    // Attività istantanee (sveglia) già passate: non restano "in corso".
    const later = events.slice(i + 1).filter(timed);
    if (INSTANT_TYPES.has(e.type) && toMinutes(e.time) < nowMin && later.length) continue;
    const superseded = later.some((l) => toMinutes(l.time) <= nowMin);
    if (superseded) continue;
    // Attività iniziata da tempo: meglio mostrare la successiva (o nulla a fine giornata).
    const elapsed = nowMin - toMinutes(e.time);
    if (elapsed > (later.length ? STALE_MINUTES : LAST_STALE_MINUTES)) continue;
    next = i;
    break;
  }
  // Attività senza orario ancora da fare (es. prove prima del timetable): hanno la
  // precedenza, a meno che un'attività con orario sia vicina (entro 3 ore) o in corso.
  const untimed = events.findIndex((e) => !e.done && !timed(e));
  if (untimed >= 0 && (next < 0 || toMinutes(events[next].time) - nowMin > UNTIMED_WINDOW_MINUTES)) {
    return untimed;
  }
  return next;
}

export type Urgency = "calm" | "soon" | "now" | "late";

export interface Headline {
  text: string;
  urgency: Urgency;
}

/** Messaggio principale della card "Prossima tappa". */
export function headline(event: TripEvent, info: EventInfo, nowMin: number, isToday: boolean): Headline {
  const start = toMinutes(event.time);
  if (!Number.isFinite(start)) return { text: "Orario da definire", urgency: "calm" };
  if (!isToday) return { text: `Alle ${event.time}`, urgency: "calm" };
  const depart = toMinutes(info.departAt);
  const rel = formatRelative;
  if (Number.isFinite(depart) && (nowMin < start || depart === start)) {
    const d = depart - nowMin;
    if (d > 0) return { text: `Partenza ${rel(d)}`, urgency: d <= 15 ? "now" : d <= 45 ? "soon" : "calm" };
    if (d === 0) return { text: "Partire adesso", urgency: "now" };
    return { text: `Partenza prevista ${rel(d)}`, urgency: "late" };
  }
  const d = start - nowMin;
  if (d > 0) return { text: rel(d).replace(/^t/, "T"), urgency: d <= 15 ? "now" : d <= 45 ? "soon" : "calm" };
  if (d === 0) return { text: "Adesso", urgency: "now" };
  return { text: `In corso · iniziata ${rel(d)}`, urgency: "now" };
}

/** Giorno da mostrare in Home: oggi se dentro il viaggio, altrimenti primo/ultimo. */
export function activeDay(data: AppData, today: ISODate): { day: TripDay; status: "before" | "during" | "after" } {
  const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  const found = sorted.find((d) => d.date === today);
  if (found) return { day: found, status: "during" };
  if (today < sorted[0].date) return { day: sorted[0], status: "before" };
  if (today > sorted[sorted.length - 1].date) return { day: sorted[sorted.length - 1], status: "after" };
  // Giorno dentro l'intervallo ma senza scheda: il più vicino precedente.
  const prev = [...sorted].reverse().find((d) => d.date < today) ?? sorted[0];
  return { day: prev, status: "during" };
}

/** Distanza in linea d'aria dalla base (per la Mappa). */
export function distanceFromBase(data: AppData, point?: GeoPoint): number | undefined {
  return point ? haversineKm(data.trip.base, point) : undefined;
}
