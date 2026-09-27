import type {
  AppData,
  EventType,
  GearPreset,
  GeoPoint,
  Place,
  RallyStage,
  SpectatorPoint,
  TripDay,
  TripEvent,
} from "./types";

// Dati iniziali del viaggio. Date e base sono definitive; prove speciali,
// orari WRC e coordinate sono ESEMPI da sostituire con il programma
// ufficiale direttamente dall'app (icona matita).

export const DATA_VERSION = 3;

/**
 * Giorni i cui dati iniziali sono cambiati in una versione: chi ha dati salvati
 * più vecchi riceve la nuova versione di quei giorni (attività e scheda giorno).
 */
export const SEED_UPDATES: Record<number, string[]> = {
  2: ["2026-09-29", "2026-09-30", "2026-10-07"], // biglietti Moby reali
  3: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], // Pass Gold RIS Experience 1–4/10
};

const ALGHERO: GeoPoint = { lat: 40.558, lng: 8.319 };

// Traghetto Moby (dai biglietti): Livorno → Olbia 29/09 22:00, Olbia → Livorno 07/10 22:00,
// cabina doppia interna C2, 2 adulti, auto al seguito. Dati personali (nomi, targa,
// codice prenotazione) NON vanno qui: il repository è pubblico, si inseriscono dall'app.
const LIVORNO_PORTO = "Stazione Marittima, Livorno";
const OLBIA_PORTO = "Porto di Olbia";
const DOCUMENTI = "All'imbarco serve la carta d'identità in originale di entrambi (indicato sul biglietto).";
const CHECKIN_VERIFICA =
  "Con l'auto: presentarsi circa 90 minuti prima della partenza (indicazione trovata su siti di viaggio, non sul biglietto: verificare sull'app o sul sito Moby).";

const DA_VERIFICARE = "ESEMPIO: verificare con il programma ufficiale WRC.";

// Pass Gold RIS Experience (dai biglietti): uno per persona per ciascun giorno 1–4 ottobre,
// sede indicata "Service Park Alghero, Lungomare Barcellona", orario sul biglietto 08:30.
// Contenuto del pass dal sito ufficiale: accesso alle Aree Experience lungo il percorso
// (punti spettacolari e tecnici delle prove speciali) + Welcome Box con T-shirt ufficiale.
const SERVICE_PARK = "Lungomare Barcellona, Alghero";
const PASS_GOLD_NOTE =
  "Pass Gold RIS Experience valido oggi (uno a testa, portarlo con sé): accesso alle Aree Experience delle prove speciali.";

function stage(s: Omit<RallyStage, "seen" | "passes"> & Partial<Pick<RallyStage, "passes">>): RallyStage {
  return { passes: [], seen: false, ...s };
}

const stages: RallyStage[] = [
  stage({
    id: "ps1",
    number: 1,
    name: "Ittiri Arena Show",
    date: "2026-10-01",
    firstCar: "16:05",
    parkingName: "Ittiri Arena",
    notes:
      "2,08 km. Orario e nome dal percorso annunciato dagli organizzatori (ACI Sport, giugno 2026): verificare con il timetable definitivo. Parcheggio da definire.",
  }),
  stage({
    id: "ps3",
    number: 3,
    name: "Tula",
    date: "2026-10-02",
    firstCar: "09:12",
    passes: [{ label: "PS 7 · 2° passaggio", time: "15:10" }],
    departAt: "06:15",
    parkingName: "Parcheggio spettatori Tula",
    parking: { lat: 40.733, lng: 8.983 },
    spectatorPointId: "sp3",
    driveMinutes: 80,
    walkMinutes: 22,
    walkKm: 1.6,
    elevationM: 90,
    roadClosure: "08:00",
    access: "media",
    gear: "Nikon + 18-105, GoPro sul cappellino, impermeabile nello zaino",
    notes: DA_VERIFICARE,
  }),
  stage({
    id: "ps4",
    number: 4,
    name: "Coiluna – Loelle",
    date: "2026-10-02",
    firstCar: "10:25",
    parkingName: "Area spettatori Loelle",
    parking: { lat: 40.618, lng: 9.28 },
    spectatorPointId: "sp4",
    driveMinutes: 105,
    walkMinutes: 15,
    walkKm: 1,
    roadClosure: "09:10",
    access: "facile",
    notes: DA_VERIFICARE,
  }),
  stage({
    id: "ps10",
    number: 10,
    name: "Monte Lerno",
    date: "2026-10-03",
    firstCar: "08:40",
    passes: [{ label: "PS 14 · 2° passaggio", time: "14:30" }],
    parkingName: "Parcheggio Pattada",
    parking: { lat: 40.593, lng: 9.124 },
    spectatorPointId: "sp10",
    driveMinutes: 95,
    walkMinutes: 30,
    walkKm: 2.1,
    elevationM: 150,
    roadClosure: "07:30",
    access: "difficile",
    gear: "Scarpe da trekking, frontale (partenza col buio)",
    notes: `Salto famoso: arrivare presto. ${DA_VERIFICARE}`,
  }),
  stage({
    id: "ps11",
    number: 11,
    name: "Monti di Alà",
    date: "2026-10-03",
    firstCar: "09:55",
    parkingName: "Parcheggio Alà dei Sardi",
    parking: { lat: 40.647, lng: 9.228 },
    driveMinutes: 110,
    walkMinutes: 10,
    roadClosure: "08:40",
    access: "facile",
    notes: DA_VERIFICARE,
  }),
  stage({
    id: "ps16",
    number: 16,
    name: "Sedini – Castelsardo",
    date: "2026-10-04",
    firstCar: "08:15",
    parkingName: "Parcheggio Sedini",
    parking: { lat: 40.852, lng: 8.815 },
    spectatorPointId: "sp16",
    driveMinutes: 70,
    walkMinutes: 18,
    walkKm: 1.2,
    roadClosure: "07:00",
    access: "media",
    notes: DA_VERIFICARE,
  }),
  stage({
    id: "ps18",
    number: 18,
    name: "Tergu – Osilo · Power Stage",
    date: "2026-10-04",
    firstCar: "12:15",
    parkingName: "Parcheggio Tergu",
    parking: { lat: 40.868, lng: 8.715 },
    spectatorPointId: "sp18",
    driveMinutes: 55,
    walkMinutes: 25,
    walkKm: 1.8,
    elevationM: 60,
    roadClosure: "10:45",
    access: "media",
    notes: `Power Stage: molto affollata. ${DA_VERIFICARE}`,
  }),
];

function sp(s: Omit<SpectatorPoint, "photoIds">): SpectatorPoint {
  return { photoIds: [], ...s };
}

const spectatorPoints: SpectatorPoint[] = [
  sp({
    id: "sp3",
    stageId: "ps3",
    name: "Curva sx dopo dosso",
    point: { lat: 40.7265, lng: 8.971 },
    description: "Curva a sinistra dopo dosso. Visuale buona anche 50 metri prima. Possibilità foto frontale.",
    position: "Lato esterno, sul terrapieno rialzato",
    cornerType: "Sinistra dopo dosso",
    visibility: 4,
    safety: 4,
    roadDistanceM: 15,
    photoGear: "Nikon 18-105 a 70-105mm, tempi 1/1000",
  }),
  sp({
    id: "sp4",
    stageId: "ps4",
    name: "Tornante Loelle",
    point: { lat: 40.612, lng: 9.295 },
    description: "Tornante lento, buono per video con Osmo Pocket.",
    cornerType: "Tornante destro",
    visibility: 3,
    safety: 5,
  }),
  sp({
    id: "sp10",
    stageId: "ps10",
    name: "Salto Monte Lerno",
    point: { lat: 40.586, lng: 9.115 },
    description: "Zona del salto: arrivare molto presto, spazio limitato.",
    cornerType: "Salto su rettilineo",
    visibility: 5,
    safety: 3,
  }),
  sp({
    id: "sp16",
    stageId: "ps16",
    name: "Veloce in discesa",
    point: { lat: 40.86, lng: 8.8 },
    cornerType: "Destra veloce in discesa",
    visibility: 4,
    safety: 4,
  }),
  sp({
    id: "sp18",
    stageId: "ps18",
    name: "Power Stage – collina",
    point: { lat: 40.86, lng: 8.72 },
    description: "Collina con vista su più curve.",
    visibility: 5,
    safety: 4,
  }),
];

function place(p: Omit<Place, "photoIds" | "visited">): Place {
  return { photoIds: [], visited: false, ...p };
}

const places: Place[] = [
  place({
    id: "pl-servicepark",
    name: "Service Park Alghero",
    category: "rally",
    address: SERVICE_PARK,
    notes: "Parco assistenza WRC, sede indicata sul Pass Gold.",
  }),
  place({ id: "pl-centro", name: "Centro storico e Bastioni", category: "visitare", point: { lat: 40.559, lng: 8.313 }, address: "Bastioni Marco Polo, Alghero" }),
  place({ id: "pl-capocaccia", name: "Belvedere Capo Caccia", category: "panorama", point: { lat: 40.569, lng: 8.163 }, notes: "Tramonto spettacolare." }),
  place({ id: "pl-nettuno", name: "Grotta di Nettuno", category: "attrazione", point: { lat: 40.5625, lng: 8.1625 }, notes: "Escala del Cabirol: 654 gradini. Verificare orari e mare." }),
  place({ id: "pl-palmavera", name: "Nuraghe di Palmavera", category: "attrazione", point: { lat: 40.593, lng: 8.243 } }),
  place({ id: "pl-mugoni", name: "Spiaggia di Mugoni", category: "spiaggia", point: { lat: 40.597, lng: 8.207 } }),
  place({ id: "pl-pelosa", name: "Spiaggia La Pelosa", category: "spiaggia", point: { lat: 40.964, lng: 8.209 }, booking: "Accesso a numero chiuso: verificare se serve prenotazione in ottobre." }),
  place({ id: "pl-bosa", name: "Bosa", category: "visitare", point: { lat: 40.298, lng: 8.498 } }),
  place({ id: "pl-castelsardo", name: "Castelsardo", category: "visitare", point: { lat: 40.914, lng: 8.713 } }),
  place({ id: "pl-cena", name: "Ristorante per cena (da scegliere)", category: "ristorante", notes: "Aggiungere indirizzo e prenotazione." }),
];

let seq = 0;
function ev(
  date: string,
  time: string,
  title: string,
  type: EventType,
  extra: Partial<TripEvent> = {},
): TripEvent {
  seq += 1;
  return { id: `ev${seq}`, date, time, title, type, done: false, ...extra };
}

function rallyDay(date: string, first: RallyStage, second: RallyStage | null, wake: string): TripEvent[] {
  const list: TripEvent[] = [
    ev(date, wake, "Sveglia", "sveglia"),
    ev(date, first.departAt ?? "", `Partenza da Alghero → PS ${first.number}`, "partenza", { stageId: first.id }),
  ];
  // Orari derivati dalla prova: arrivo, camminata, prima vettura.
  const arrive = timeMinus(first.roadClosure ?? first.firstCar, 20 + (first.walkMinutes ?? 0));
  list.push(
    ev(date, arrive, "Arrivo parcheggio WRC", "parcheggio", { stageId: first.id }),
    ev(date, timePlus(arrive, 20), "Partenza a piedi", "piedi", { stageId: first.id }),
    ev(date, timePlus(arrive, 20 + (first.walkMinutes ?? 0)), "Punto spettatore", "spettatore", { stageId: first.id }),
    ev(date, first.firstCar, `PS ${first.number} ${first.name} · prima vettura`, "prova", { stageId: first.id }),
  );
  if (second) {
    list.push(
      ev(date, second.firstCar, `PS ${second.number} ${second.name} · prima vettura`, "prova", { stageId: second.id }),
    );
  }
  return list.map((e) => (e.time ? e : { ...e, time: timeMinus(arrive, first.driveMinutes ?? 60) }));
}

function timeMinus(t: string, min: number): string {
  const [h, m] = t.split(":").map(Number);
  const v = (((h * 60 + m - min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
const timePlus = (t: string, min: number) => timeMinus(t, -min);

function buildEvents(): TripEvent[] {
  seq = 0;
  const byId = (id: string) => stages.find((s) => s.id === id)!;
  const [ps3, ps4, ps10, ps11, ps16, ps18] = ["ps3", "ps4", "ps10", "ps11", "ps16", "ps18"].map(byId);
  return [
    // 29/09 — partenza (Moby, dal biglietto)
    ev("2026-09-29", "20:30", "Check-in al porto di Livorno", "traghetto", {
      address: LIVORNO_PORTO,
      deadline: "20:30",
      notes: `${CHECKIN_VERIFICA}\n${DOCUMENTI}\nCodice prenotazione: aggiungilo qui con la matita.`,
    }),
    ev("2026-09-29", "22:00", "Partenza Moby Livorno → Olbia", "traghetto", {
      address: LIVORNO_PORTO,
      notes: "Cabina doppia interna (C2) · 2 adulti · auto al seguito.",
    }),

    // 30/09 — arrivo
    ev("2026-09-30", "07:00", "Sbarco a Olbia", "traghetto", {
      address: OLBIA_PORTO,
      notes: "Orario indicativo: circa 07:00 secondo i siti di viaggio. Non è scritto sul biglietto: da verificare.",
    }),
    ev("2026-09-30", "07:30", "Trasferimento Olbia → Alghero", "auto", { point: ALGHERO }),
    ev("2026-09-30", "10:00", "Check-in alloggio / deposito bagagli", "altro", { notes: "Orario da confermare con l'alloggio." }),
    ev("2026-09-30", "11:00", "Centro storico e Bastioni", "visita", { placeId: "pl-centro" }),
    ev("2026-09-30", "13:00", "Pranzo", "pasto"),
    ev("2026-09-30", "17:30", "Capo Caccia al tramonto", "panorama", { placeId: "pl-capocaccia", driveMinutes: 35 }),
    ev("2026-09-30", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 01/10 — turismo + preparazione rally
    ev("2026-10-01", "08:30", "Service Park Alghero · primo giorno Pass Gold", "rally", {
      address: SERVICE_PARK,
      notes:
        "Orario e sede sono quelli stampati sul Pass Gold. Dove si ritira la Welcome Box (T-shirt ufficiale): da verificare con l'organizzazione.",
    }),
    ev("2026-10-01", "09:01", "Shakedown", "rally", {
      notes: "Orario annunciato dagli organizzatori; luogo ancora da comunicare.",
    }),
    ev("2026-10-01", "16:05", "PS 1 Ittiri Arena Show · prima vettura", "prova", { stageId: "ps1" }),
    ev("2026-10-01", "18:30", "Preparare zaino e batterie per domani", "altro", {
      notes: "Caricare Nikon, GoPro, Osmo Pocket, powerbank. Svuotare schede.",
    }),
    ev("2026-10-01", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 02/10 — WRC giorno 1
    ...rallyDay("2026-10-02", ps3, ps4, "05:45"),
    ev("2026-10-02", "12:30", "Pranzo", "pasto"),
    ev("2026-10-02", "18:30", "Rientro ad Alghero", "auto", { point: ALGHERO }),
    ev("2026-10-02", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 03/10 — WRC giorno 2
    ...rallyDay("2026-10-03", ps10, ps11, "04:45"),
    ev("2026-10-03", "12:30", "Pranzo", "pasto"),
    ev("2026-10-03", "18:30", "Rientro ad Alghero", "auto", { point: ALGHERO }),
    ev("2026-10-03", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 04/10 — WRC giorno 3
    ...rallyDay("2026-10-04", ps16, ps18, "04:30"),
    ev("2026-10-04", "15:00", "Castelsardo", "visita", { placeId: "pl-castelsardo" }),
    ev("2026-10-04", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 05/10 — Stintino
    ev("2026-10-05", "09:30", "Partenza per Stintino", "partenza", { placeId: "pl-pelosa", driveMinutes: 55 }),
    ev("2026-10-05", "10:30", "Spiaggia La Pelosa", "spiaggia", { placeId: "pl-pelosa" }),
    ev("2026-10-05", "13:00", "Pranzo", "pasto"),
    ev("2026-10-05", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 06/10 — Bosa
    ev("2026-10-06", "09:30", "Strada panoramica Alghero → Bosa", "panorama", { placeId: "pl-bosa", driveMinutes: 50, notes: "SP105 lungo la costa: soste foto." }),
    ev("2026-10-06", "11:00", "Bosa", "visita", { placeId: "pl-bosa" }),
    ev("2026-10-06", "13:00", "Pranzo", "pasto"),
    ev("2026-10-06", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 07/10 — rientro (Moby, dal biglietto)
    ev("2026-10-07", "09:00", "Check-out e carico auto", "altro", { notes: "Orario di check-out da confermare con l'alloggio." }),
    ev("2026-10-07", "18:00", "Partenza da Alghero verso Olbia", "partenza", {
      address: OLBIA_PORTO,
      notes: "Orario suggerito: controllare il tempo su Maps e tenere margine per il check-in.",
    }),
    ev("2026-10-07", "20:30", "Check-in al porto di Olbia", "traghetto", {
      address: OLBIA_PORTO,
      deadline: "20:30",
      notes: `${CHECKIN_VERIFICA}\n${DOCUMENTI}`,
    }),
    ev("2026-10-07", "22:00", "Partenza Moby Olbia → Livorno", "traghetto", {
      address: OLBIA_PORTO,
      notes: "Cabina doppia interna (C2) · 2 adulti · auto al seguito. Arrivo a Livorno la mattina dell'8 ottobre.",
    }),
  ];
}

const days: TripDay[] = [
  { date: "2026-09-29", title: "Traghetto Livorno → Olbia", kind: "viaggio", location: "Livorno", gearPresetId: "serata" },
  { date: "2026-09-30", title: "Sbarco a Olbia e arrivo ad Alghero", kind: "turismo", location: "Olbia → Alghero", gearPresetId: "turismo" },
  { date: "2026-10-01", title: "WRC · Giovedì · Shakedown e Ittiri Arena", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS_GOLD_NOTE },
  { date: "2026-10-02", title: "WRC · Venerdì", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS_GOLD_NOTE },
  { date: "2026-10-03", title: "WRC · Sabato", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS_GOLD_NOTE },
  { date: "2026-10-04", title: "WRC · Domenica · Power Stage", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS_GOLD_NOTE },
  { date: "2026-10-05", title: "Stintino e La Pelosa", kind: "turismo", location: "Alghero", gearPresetId: "turismo" },
  { date: "2026-10-06", title: "Bosa e costa ovest", kind: "turismo", location: "Alghero", gearPresetId: "foto" },
  { date: "2026-10-07", title: "Rientro: traghetto Olbia → Livorno", kind: "viaggio", location: "Alghero → Olbia" },
];

function preset(id: string, name: string, items: string[]): GearPreset {
  return {
    id,
    name,
    items: items.map((n, i) => ({ id: `${id}-${i}`, name: n, checked: false })),
  };
}

const RALLY_BASE = [
  "Pass Gold RIS Experience (2)",
  "iPhone 16 Pro Max",
  "Powerbank + cavo",
  "Nikon D3200 + 18-105",
  "Batterie cariche",
  "GoPro Hero 11",
  "DJI Osmo Pocket 3",
  "Acqua",
  "Snack",
  "Frontale",
  "Impermeabile",
  "Zaino",
];

const gearPresets: GearPreset[] = [
  preset("rally", "Rally", RALLY_BASE),
  preset("pioggia", "Rally pioggia", [
    ...RALLY_BASE,
    "Guscio impermeabile",
    "Sovrapantaloni",
    "Protezione fotocamera",
    "Cambio calze",
    "Sacchetto stagno per elettronica",
  ]),
  preset("turismo", "Turismo", [
    "iPhone 16 Pro Max",
    "Powerbank",
    "Acqua",
    "Occhiali da sole",
    "Crema solare",
    "Costume e telo",
    "Zaino",
  ]),
  preset("foto", "Foto/Video", [
    "Nikon D3200",
    "Obiettivo 18-105",
    "Batterie Nikon",
    "Schede SD vuote",
    "GoPro Hero 11 + batterie",
    "Supporti GoPro",
    "DJI Osmo Pocket 3",
    "DJI Mic (Creator Combo)",
    "Powerbank + cavi",
    "Panno pulizia lenti",
    "Protezione pioggia fotocamera",
  ]),
  preset("serata", "Serata", ["iPhone", "Portafoglio e documenti", "Chiavi auto", "Giacca leggera"]),
];

export function createSeed(): AppData {
  return {
    version: DATA_VERSION,
    trip: {
      id: "sardegna-2026",
      name: "Sardegna 2026",
      startDate: "2026-09-29",
      endDate: "2026-10-07",
      baseName: "Alghero",
      base: ALGHERO,
    },
    days: structuredClone(days),
    events: buildEvents(),
    stages: structuredClone(stages),
    spectatorPoints: structuredClone(spectatorPoints),
    places: structuredClone(places),
    gearPresets: structuredClone(gearPresets),
    diary: [],
    settings: { mapsApp: "apple", theme: "dark", bufferMinutes: 15 },
  };
}
