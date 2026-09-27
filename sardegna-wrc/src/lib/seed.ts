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

// Dati iniziali del viaggio, solo da fonti verificabili: biglietti, prenotazioni,
// percorso ufficiale del rally. Ciò che non è noto resta vuoto o "da verificare".

export const DATA_VERSION = 5;

/**
 * Giorni i cui dati iniziali sono cambiati in una versione: chi ha dati salvati
 * più vecchi riceve la nuova versione di quei giorni (attività e scheda giorno).
 */
export const SEED_UPDATES: Record<number, string[]> = {
  2: ["2026-09-29", "2026-09-30", "2026-10-07"], // biglietti Moby reali
  3: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], // Pass Gold RIS Experience 1–4/10
  4: ["2026-09-30", "2026-10-02", "2026-10-03", "2026-10-07"], // alloggio Redroom-house
  5: ["2026-10-02", "2026-10-03", "2026-10-04"], // prove reali 2026 al posto degli esempi
};

/** Prove e punti spettatore d'esempio delle prime versioni, rimossi dalla v5. */
export const EXAMPLE_IDS = {
  stages: ["ps3", "ps4", "ps10", "ps11", "ps16", "ps18"],
  spectatorPoints: ["sp3", "sp4", "sp10", "sp16", "sp18"],
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

// Prove 2026: nomi, lunghezze e giorni dal percorso ufficiale (17 PS, 309,36 km, 1–4 ottobre).
// Noti solo due orari: PS 1 Ittiri 16:05 e PS 17 Wolf Power Stage 14:15. Numerazione di
// venerdì-domenica dedotta dall'ordine annunciato. Il resto arriva col timetable ufficiale.
const TIMETABLE = "Orari dei passaggi: dal timetable ufficiale (non ancora inseriti).";
const NUMERO_DEDOTTO = "Numero PS dedotto dall'ordine annunciato: verificare col timetable.";

const stages: RallyStage[] = [
  stage({
    id: "ps1",
    number: 1,
    name: "Ittiri Arena Show",
    date: "2026-10-01",
    firstCar: "16:05",
    parkingName: "Ittiri Arena",
    notes: "2,08 km, super speciale in arena. Nome e orario dal percorso annunciato dagli organizzatori.",
  }),
  stage({
    id: "ps-tula",
    number: 2,
    name: "Tula – Erula",
    date: "2026-10-02",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 5)", time: "" }],
    notes: `18,14 km, due passaggi. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-filigosu",
    number: 3,
    name: "Su Filigosu – Lerno",
    date: "2026-10-02",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 6)", time: "" }],
    notes: `Due passaggi. Qui c'è Micky's Jump, il salto più famoso del rally. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-alalerno",
    number: 4,
    name: "Monti di Alà – Conchedda – Lerno",
    date: "2026-10-02",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 7)", time: "" }],
    notes: `Due passaggi. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-lernoala",
    number: 8,
    name: "Lerno – Sa Conchedda – Monti di Alà",
    date: "2026-10-03",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 11)", time: "" }],
    notes: `24,42 km, due passaggi. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-coiluna",
    number: 9,
    name: "Coiluna – Loelle",
    date: "2026-10-03",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 12)", time: "" }],
    notes: `24,83 km, due passaggi. Coiluna's Jump, Buddusò Arena e il tornante "Nurage". ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-solorche",
    number: 10,
    name: "Solorché",
    date: "2026-10-03",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 13)", time: "" }],
    notes: `13,13 km, prova nuova nella zona di Pattada: sconosciuta anche ai piloti. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-osilo",
    number: 14,
    name: "Osilo – Tergu",
    date: "2026-10-04",
    firstCar: "",
    passes: [{ label: "2° passaggio (PS 16)", time: "" }],
    notes: `23,71 km, due passaggi. ${TIMETABLE} ${NUMERO_DEDOTTO}`,
  }),
  stage({
    id: "ps-argentiera",
    number: 15,
    name: "Sassari – Argentiera · Power Stage",
    date: "2026-10-04",
    firstCar: "",
    passes: [{ label: "PS 17 · Wolf Power Stage", time: "14:15" }],
    notes:
      "7,10 km. Ultimo tratto a bordo costa con il mare sullo sfondo, arrivo a Porto Palmas. La Power Stage (PS 17) è alle 14:15; orario del primo passaggio dal timetable.",
  }),
];

function sp(s: Omit<SpectatorPoint, "photoIds">): SpectatorPoint {
  return { photoIds: [], ...s };
}

// Punti più spettacolari citati dalle fonti. Senza coordinate: la posizione esatta e le
// zone pubblico/RIS Experience vanno prese dalla guida spettatori ufficiale 2026.
const DA_GUIDA = "Posizione esatta, parcheggio e accesso a piedi: dalla guida spettatori ufficiale 2026 (scheda della prova).";

const spectatorPoints: SpectatorPoint[] = [
  sp({
    id: "sp-ittiri",
    stageId: "ps1",
    name: "Ittiri Arena",
    address: "Ittiri Arena, Ittiri",
    wow: 4,
    description:
      "Super speciale in arena: auto vicinissime e tutto il tracciato sotto gli occhi. Perfetta per il primo rally della vita.",
    source: "Percorso ufficiale 2026 (ACI Sport)",
    notes: DA_GUIDA,
  }),
  sp({
    id: "sp-micky",
    stageId: "ps-filigosu",
    name: "Micky's Jump",
    address: "Nuraghe Lerno, Pattada",
    wow: 5,
    cornerType: "Salto (km 5,5 nelle edizioni passate)",
    description:
      "Il salto più famoso del Rally Italia Sardegna: le auto volano per decine di metri. Atmosfera incredibile, da vedere assolutamente la prima volta.",
    position:
      "Accesso descritto da WRC.com: dalla SS 389 svolta per Nuraghe Lerno, dopo 160 m a destra, prosegui 4,8 km, poi a destra in salita su sterrato. Parcheggia dove puoi e sali a piedi: anche un paio di km se arrivi tardi.",
    source: "WRC.com Stage Guide · Rally Italia Sardegna",
    notes: `Arrivare molto presto: è la zona più affollata. ${DA_GUIDA}`,
  }),
  sp({
    id: "sp-lerno-rocce",
    stageId: "ps-filigosu",
    name: "Curve tra i graniti · vista Lago Lerno",
    wow: 4,
    description: "Circa 600 m dopo Micky's Jump: serie di curve tra enormi rocce di granito con il Lago Lerno sullo sfondo. Scenario da cartolina.",
    source: "WRC.com Stage Guide · Rally Italia Sardegna",
    notes: DA_GUIDA,
  }),
  sp({
    id: "sp-coiluna-jump",
    stageId: "ps-coiluna",
    name: "Coiluna's Jump",
    wow: 5,
    cornerType: "Salto",
    description: "Salto amatissimo dai fotografi, vicino al lago di Sa Coiluna: le auto decollano appena dopo la partenza della prova.",
    source: "WRC.com / guide alle prove 2026",
    notes: `Indicato come zona pubblico. ${DA_GUIDA}`,
  }),
  sp({
    id: "sp-budduso-arena",
    stageId: "ps-coiluna",
    name: "Buddusò Arena",
    wow: 4,
    description: "Zona pubblico organizzata lungo la Coiluna – Loelle.",
    source: "Guide alle prove 2026",
    notes: DA_GUIDA,
  }),
  sp({
    id: "sp-nurage",
    stageId: "ps-coiluna",
    name: "Tornante \"Nurage\"",
    wow: 4,
    cornerType: "Tornante molto veloce",
    description: "Famoso tornantone veloce e spettacolare: traversi e sterrato che vola.",
    source: "Guide alle prove 2026",
    notes: DA_GUIDA,
  }),
  sp({
    id: "sp-argentiera-guado",
    stageId: "ps-argentiera",
    name: "Guado sulla spiaggia dell'Argentiera",
    address: "Argentiera, Sassari",
    wow: 5,
    cornerType: "Guado",
    description:
      "Zona pubblico lungo una delle spiagge più belle della Sardegna: guado, mare e l'ex villaggio minerario. Qui si decide il mondiale con la Power Stage.",
    source: "Guide alle prove 2026",
    notes: `Power Stage alle 14:15: arrivare con largo anticipo. ${DA_GUIDA}`,
  }),
];

function place(p: Omit<Place, "photoIds" | "visited">): Place {
  return { photoIds: [], visited: false, ...p };
}

// Alloggio (dalla prenotazione): 30/09–07/10, check-in 15:00–23:30, check-out 08:00–10:00.
const ALLOGGIO = "pl-alloggio";

const places: Place[] = [
  place({
    id: ALLOGGIO,
    name: "Redroom-house",
    category: "alloggio",
    address: "Via Michelangelo, 07041 Alghero",
    hours: "Check-in 15:00–23:30 · Check-out 08:00–10:00",
    notes: "Soggiorno dal 30/09 al 07/10. Comunicare all'host l'orario di arrivo dall'app di prenotazione.",
  }),
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

function buildEvents(): TripEvent[] {
  seq = 0;
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
    ev("2026-09-30", "15:00", "Check-in Redroom-house", "altro", {
      placeId: ALLOGGIO,
      deadline: "23:30",
      notes: "Check-in dalle 15:00 alle 23:30. Fino ad allora i bagagli restano in auto.",
    }),
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

    // 02/10 — venerdì: orari delle prove non ancora noti (vuoti = "da definire")
    ev("2026-10-02", "", "PS 2 / PS 5 · Tula – Erula", "prova", { stageId: "ps-tula" }),
    ev("2026-10-02", "", "PS 3 / PS 6 · Su Filigosu – Lerno (Micky's Jump)", "prova", { stageId: "ps-filigosu" }),
    ev("2026-10-02", "", "PS 4 / PS 7 · Monti di Alà – Conchedda – Lerno", "prova", { stageId: "ps-alalerno" }),
    ev("2026-10-02", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 03/10 — sabato
    ev("2026-10-03", "", "PS 8 / PS 11 · Lerno – Sa Conchedda – Monti di Alà", "prova", { stageId: "ps-lernoala" }),
    ev("2026-10-03", "", "PS 9 / PS 12 · Coiluna – Loelle (Coiluna's Jump)", "prova", { stageId: "ps-coiluna" }),
    ev("2026-10-03", "", "PS 10 / PS 13 · Solorché", "prova", { stageId: "ps-solorche" }),
    ev("2026-10-03", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),

    // 04/10 — domenica
    ev("2026-10-04", "", "PS 14 / PS 16 · Osilo – Tergu", "prova", { stageId: "ps-osilo" }),
    ev("2026-10-04", "", "PS 15 · Sassari – Argentiera (1° passaggio)", "prova", { stageId: "ps-argentiera" }),
    ev("2026-10-04", "14:15", "PS 17 · Wolf Power Stage Sassari – Argentiera", "prova", {
      stageId: "ps-argentiera",
      notes: "Ultima prova: si decide il mondiale. Orario annunciato dagli organizzatori.",
    }),
    ev("2026-10-04", "", "Arrivo finale e podio ad Alghero", "rally", {
      notes: "Arrivo cerimoniale sotto i Bastioni di Alghero. Orario da verificare.",
    }),
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
    ev("2026-10-07", "09:00", "Check-out Redroom-house", "altro", {
      placeId: ALLOGGIO,
      deadline: "10:00",
      notes: "Check-out dalle 08:00 alle 10:00. Poi giornata libera fino alla partenza per Olbia.",
    }),
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
