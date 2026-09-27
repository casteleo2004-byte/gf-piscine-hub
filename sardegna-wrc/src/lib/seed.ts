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

export const DATA_VERSION = 7;

/**
 * Giorni i cui dati iniziali sono cambiati in una versione: chi ha dati salvati
 * più vecchi riceve la nuova versione di quei giorni (attività e scheda giorno).
 */
export const SEED_UPDATES: Record<number, string[]> = {
  2: ["2026-09-29", "2026-09-30", "2026-10-07"], // biglietti Moby reali
  3: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], // Pass Gold RIS Experience 1–4/10
  4: ["2026-09-30", "2026-10-02", "2026-10-03", "2026-10-07"], // alloggio Redroom-house
  5: ["2026-10-02", "2026-10-03", "2026-10-04"], // prove reali 2026 al posto degli esempi
  6: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], // timetable e mappe ufficiali
  7: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], // piano del giorno per chi è al primo rally
};

/** Prove e punti spettatore d'esempio delle prime versioni, rimossi dalla v5. */
export const EXAMPLE_IDS = {
  stages: ["ps3", "ps4", "ps10", "ps11", "ps16", "ps18"],
  spectatorPoints: [
    "sp3", "sp4", "sp10", "sp16", "sp18",
    // candidati da fonti web (v5), sostituiti dalle aree ufficiali (v6)
    "sp-ittiri", "sp-micky", "sp-lerno-rocce", "sp-coiluna-jump", "sp-budduso-arena", "sp-nurage", "sp-argentiera-guado",
  ],
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
const PASS = "Oggi serve il Pass Gold: uno a testa, sempre con voi.";

function stage(s: Omit<RallyStage, "seen" | "passes"> & Partial<Pick<RallyStage, "passes">>): RallyStage {
  return { passes: [], seen: false, ...s };
}

// Prove 2026 dal TIMETABLE UFFICIALE (V5.1, 14/09/2026) e dalla MAPPA ZONE SPETTATORI
// ufficiale: orari, chiusure strade, km, Access Point (coordinate esatte) e aree
// Experience del Pass Gold (cerchi blu numerati sulle mappe). Le coordinate precise di
// aree e parcheggi interni sono nelle mappe interattive ufficiali (Google My Maps /
// rlab.app): finché non sono inserite, NAVIGA porta all'Access Point ufficiale e da lì
// si segue l'accesso segnalato.
const FONTE = "Timetable ufficiale V5.1 e mappa zone spettatori 2026";
const P = (lat: number, lng: number): GeoPoint => ({ lat, lng });
const ACCESSO =
  "NAVIGA porta all'Access Point ufficiale: da lì seguire l'accesso segnalato fino al parcheggio. Il parcheggio del Pass Gold è quello verde \"EXP / MEDIA / ORG\" vicino alle aree Experience.";

const stages: RallyStage[] = [
  stage({
    id: "sd",
    number: 0,
    name: "Shakedown · Monte Baranta",
    date: "2026-10-01",
    firstCar: "09:01",
    roadClosure: "06:00",
    lengthKm: 3.27,
    parkingKind: "access",
    parkingName: "Ingresso Olmedo",
    parking: P(40.65178190753158, 8.37644763855414),
    notes: `Ex Miniera di Bauxite, vicino a Olmedo. Aree Experience 1 e 2 alla partenza, con parcheggio Experience. ${ACCESSO}`,
  }),
  stage({
    id: "ps1",
    number: 1,
    name: "Ittiri Arena Show",
    date: "2026-10-01",
    firstCar: "16:05",
    roadClosure: "06:00",
    departAt: "14:45",
    lengthKm: 2.08,
    parkingName: "Ittiri Arena",
    notes:
      "Partenza da Alghero suggerita alle 14:45, per arrivare con un'ora di anticipo (la chiusura delle 06:00 riguarda il tracciato). Super speciale in arena (km 2,08 sulla mappa, 2,21 nel timetable). Area Experience 3 accanto al salto, RIS Hospitality. Parcheggi spettatori lungo la strada a nord, con percorso pedonale segnalato.",
  }),
  stage({
    id: "ps-tula",
    number: 2,
    name: "Tula – Erula",
    date: "2026-10-02",
    firstCar: "08:01",
    roadClosure: "05:01",
    passes: [{ label: "SS 5 · 2° passaggio", time: "14:31", roadClosure: "12:31" }],
    lengthKm: 18.77,
    parkingKind: "access",
    parkingName: "Ingresso Experience e disabili (solo auto)",
    parking: P(40.79732777557003, 8.972336269232184),
    notes:
      "Aree Experience 4, 5 e 6 tra Turrina Manna e Sa Mela. Accesso Experience e disabili riservato alle auto; da Tula accesso a senso unico fino allo start della prova, dopo lo start solo in uscita. Da Erula c'è il bus navetta (Bus IN/OUT Point) con punto ristoro.",
  }),
  stage({
    id: "ps-filigosu",
    number: 3,
    name: "Su Filigosu – Lerno",
    date: "2026-10-02",
    firstCar: "09:01",
    roadClosure: "06:01",
    passes: [{ label: "SS 6 · 2° passaggio", time: "15:31", roadClosure: "13:31" }],
    lengthKm: 17.83,
    parkingKind: "access",
    parkingName: "Ingresso Oschiri",
    parking: P(40.72157726858769, 9.11652993606414),
    notes: "Nessuna area Experience su questa prova. Unica zona pubblico: Filigosu (area 5) vicino alla partenza, ultimo tratto solo 4x4.",
  }),
  stage({
    id: "ps-alalerno",
    number: 4,
    name: "Monti di Alà – Sa Conchedda – Lerno",
    date: "2026-10-02",
    firstCar: "10:08",
    roadClosure: "07:08",
    passes: [{ label: "SS 7 · 2° passaggio", time: "16:38", roadClosure: "14:38" }],
    lengthKm: 23.23,
    parkingKind: "access",
    parkingName: "Ingresso Alà dei Sardi (Alà Arena)",
    parking: P(40.64873143094596, 9.325989460877631),
    notes: `Alà Arena alla partenza: aree Experience 7 e 8, salto e Water Splash, RIS Hospitality, parcheggio Experience e parcheggio spettatori. Altre zone pubblico: Altopiano (7) e Sos Vanzos (8), accessi da Buddusò. ${ACCESSO}`,
  }),
  stage({
    id: "ps-lernoala",
    number: 8,
    name: "Lerno – Sa Conchedda – Monti di Alà",
    date: "2026-10-03",
    firstCar: "08:01",
    roadClosure: "05:01",
    passes: [{ label: "SS 11 · 2° passaggio", time: "14:31", roadClosure: "12:31" }],
    lengthKm: 24.14,
    parkingKind: "access",
    parkingName: "Ingresso Buddusò (verso Tandalò e Sa Jone)",
    parking: P(40.58489772463757, 9.242178693420435),
    notes: `Lerno Jump alla partenza: area Experience 9 con parcheggio Experience, e zona pubblico 9. Altre zone: Sa Jone (10, con parcheggio spettatori), Tandalò Paddock (11), Centrale Elettrica (12). ${ACCESSO}`,
  }),
  stage({
    id: "ps-coiluna",
    number: 9,
    name: "Coiluna – Loelle",
    date: "2026-10-03",
    firstCar: "09:11",
    roadClosure: "06:11",
    passes: [{ label: "SS 12 · 2° passaggio", time: "15:41", roadClosure: "13:41" }],
    lengthKm: 24.83,
    parkingKind: "access",
    parkingName: "Ingresso Buddusò (Nuraghe Loelle / Buddusò Arena)",
    parking: P(40.57065014718563, 9.26940463215951),
    notes: `Aree Experience 10 (Buddusò Arena, con parcheggio Experience) e 11 (Nuraghe Loelle). Coiluna Jump (zona 13) solo pubblico, accesso 4x4/SUV da Alà dei Sardi o Mamone. ${ACCESSO}`,
  }),
  stage({
    id: "ps-solorche",
    number: 10,
    name: "Solorchè",
    date: "2026-10-03",
    firstCar: "10:07",
    roadClosure: "07:07",
    passes: [{ label: "SS 13 · 2° passaggio", time: "16:37", roadClosure: "14:37" }],
    lengthKm: 12.86,
    parkingKind: "access",
    parkingName: "Ingresso Pattada (Galoppatoio)",
    parking: P(40.56182559978122, 9.083966853227492),
    notes: `Galoppatoio di Pattada all'arrivo: aree Experience 12 e 13 con salto, RIS Hospitality, parcheggio Experience e spettatori. Sulla mappa SS 13 è indicata alle 16:07, nel timetable ufficiale alle 16:37: vale il timetable. Zone Casa Betania Nord/Sud (16–17) con accesso da Bultei. ${ACCESSO}`,
  }),
  stage({
    id: "ps-osilo",
    number: 14,
    name: "Osilo – Tergu",
    date: "2026-10-04",
    firstCar: "08:31",
    roadClosure: "05:31",
    passes: [{ label: "SS 16 · 2° passaggio", time: "11:38", roadClosure: "05:31" }],
    lengthKm: 23.71,
    parkingKind: "access",
    parkingName: "Ingresso Osilo (Quadrivio)",
    parking: P(40.81558864188334, 8.742239797232767),
    notes: `Quadrivio: area Experience 14 con parcheggio Experience, zona pubblico 19. Altre zone: Tanca Noa (20) e Tergu (21), accesso da Tergu. ${ACCESSO}`,
  }),
  stage({
    id: "ps-argentiera",
    number: 15,
    name: "Sassari – Argentiera · Power Stage",
    date: "2026-10-04",
    firstCar: "10:05",
    roadClosure: "07:05",
    passes: [{ label: "SS 17 · Wolf Power Stage", time: "14:15", roadClosure: "07:05" }],
    lengthKm: 7.1,
    parkingKind: "access",
    parkingName: "Ingresso Palmadula",
    parking: P(40.74863649450717, 8.188445362031837),
    notes:
      "Sul mare: aree Experience 15 (Ebi Dozzi) e 16 (Porto Palmas, arrivo), RIS Hospitality. Da Palmadula accesso pedonale alla zona 22; parcheggi spettatori verso l'Argentiera per le zone sul mare (23). Strade chiuse dalle 07:05 fino alla Power Stage.",
  }),
];

function sp(s: Omit<SpectatorPoint, "photoIds">): SpectatorPoint {
  return { photoIds: [], ...s };
}

// Aree Experience del Pass Gold (e poche zone pubblico notevoli) dalla mappa ufficiale.
// WOW = mia valutazione in base a ciò che la mappa segnala (salti, guadi, arene, mare).
const DA_MYMAPS = "Coordinate precise dell'area: nella mappa interattiva ufficiale della prova (QR \"Interactive MyMaps\").";

const spectatorPoints: SpectatorPoint[] = [
  sp({
    id: "exp-sd",
    stageId: "sd",
    name: "Experience 1–2 · Ex Miniera Bauxite",
    access: P(40.65178190753158, 8.37644763855414),
    experienceArea: true,
    wow: 4,
    cornerType: "Tornanti e salto alla partenza",
    walkRoute: "Dall'Access Point di Olmedo seguire l'accesso segnalato fino all'Ex Miniera: parcheggio Experience accanto alla partenza.",
    description: "Shakedown a pochi km da Alghero: le auto passano più volte, ottimo per iniziare e provare foto e video.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-ittiri",
    stageId: "ps1",
    name: "Experience 3 · Ittiri Arena",
    address: "Ittiri Arena, Ittiri",
    experienceArea: true,
    wow: 4,
    cornerType: "Arena con salto e water splash",
    walkRoute: "Dai parcheggi spettatori lungo la strada a nord, percorso pedonale segnalato fino all'arena. Area Experience 3 accanto al salto.",
    description: "Tutto il tracciato sotto gli occhi, auto vicinissime: il modo perfetto per il primo rally.",
    source: FONTE,
  }),
  sp({
    id: "exp-tula-6",
    stageId: "ps-tula",
    name: "Experience 6 · Sa Mela",
    access: P(40.79732777557003, 8.972336269232184),
    experienceArea: true,
    wow: 4,
    walkRoute:
      "Accesso Experience e disabili (solo auto) dall'Access Point indicato, fino al parcheggio Experience vicino all'area 6. In alternativa bus navetta da Erula (Bus IN/OUT Point).",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-tula-4",
    stageId: "ps-tula",
    name: "Experience 4–5 · Turrina Manna",
    access: P(40.72751145540492, 8.983330894154273),
    experienceArea: true,
    wow: 4,
    walkRoute:
      "Da Tula accesso a senso unico fino allo start della prova (dopo lo start solo in uscita), fino ai parcheggi vicino all'area 4. Parcheggio Experience accanto.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "zona-filigosu",
    stageId: "ps-filigosu",
    name: "Zona pubblico 5 · Filigosu",
    access: P(40.72157726858769, 9.11652993606414),
    wow: 3,
    walkRoute: "Da Oschiri accesso segnalato; ultimo tratto solo con 4x4.",
    description: "Nessuna area Experience su questa prova.",
    source: FONTE,
  }),
  sp({
    id: "exp-ala-arena",
    stageId: "ps-alalerno",
    name: "Experience 7–8 · Alà Arena",
    access: P(40.64873143094596, 9.325989460877631),
    experienceArea: true,
    wow: 5,
    cornerType: "Salto e Water Splash",
    walkRoute:
      "Dall'Access Point di Alà dei Sardi seguire l'accesso segnalato fino all'Alà Arena: parcheggio Experience e parcheggio spettatori accanto all'area, RIS Hospitality.",
    description: "Arena alla partenza con salto e Water Splash: le auto passano due volte (10:08 e 16:38).",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-lerno-jump",
    stageId: "ps-lernoala",
    name: "Experience 9 · Lerno Jump",
    access: P(40.58489772463757, 9.242178693420435),
    experienceArea: true,
    wow: 5,
    cornerType: "Salto",
    walkRoute:
      "Dall'Access Point di Buddusò seguire l'accesso segnalato verso Tandalò e Sa Jone fino alla partenza: parcheggio Experience accanto al Lerno Jump.",
    description: "Il salto di Lerno alla partenza della prova, con area Experience dedicata.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-budduso-arena",
    stageId: "ps-coiluna",
    name: "Experience 10 · Buddusò Arena",
    access: P(40.57065014718563, 9.26940463215951),
    experienceArea: true,
    wow: 4,
    walkRoute: "Da Buddusò accesso segnalato fino alla Buddusò Arena: parcheggio Experience accanto.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-nuraghe-loelle",
    stageId: "ps-coiluna",
    name: "Experience 11 · Nuraghe Loelle",
    access: P(40.57065014718563, 9.26940463215951),
    experienceArea: true,
    wow: 4,
    walkRoute: "Da Buddusò stesso accesso della Buddusò Arena, area poco prima.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "zona-coiluna-jump",
    stageId: "ps-coiluna",
    name: "Zona pubblico 13 · Coiluna Jump",
    access: P(40.57164889280999, 9.410081421503556),
    wow: 5,
    cornerType: "Salto",
    walkRoute: "Accesso da Mamone (o da Alà dei Sardi); ultimo tratto solo 4x4/SUV.",
    description: "Non è un'area Experience: solo pubblico.",
    source: FONTE,
  }),
  sp({
    id: "exp-galoppatoio",
    stageId: "ps-solorche",
    name: "Experience 12–13 · Galoppatoio Pattada",
    access: P(40.56182559978122, 9.083966853227492),
    experienceArea: true,
    wow: 5,
    cornerType: "Salto all'arrivo",
    walkRoute:
      "Dall'Access Point di Pattada seguire l'accesso segnalato fino al Galoppatoio: parcheggio Experience e spettatori accanto all'area, RIS Hospitality.",
    description: "Anello finale con salto al Galoppatoio di Pattada: prova nuova del 2026.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-quadrivio",
    stageId: "ps-osilo",
    name: "Experience 14 · Quadrivio",
    access: P(40.81558864188334, 8.742239797232767),
    experienceArea: true,
    wow: 4,
    walkRoute: "Dall'Access Point indicato seguire l'accesso segnalato fino al Quadrivio: parcheggio Experience accanto all'area.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-ebi-dozzi",
    stageId: "ps-argentiera",
    name: "Experience 15 · Ebi Dozzi (sul mare)",
    access: P(40.74863649450717, 8.188445362031837),
    experienceArea: true,
    wow: 5,
    cornerType: "Tratto a bordo mare",
    walkRoute: "Accesso dal lato Argentiera / Porto Palmas; parcheggi spettatori verso l'Argentiera. Da Palmadula solo accesso pedonale alla zona 22.",
    description: "Le auto corrono sul mare: lo scenario più spettacolare del rally, dove si decide il mondiale.",
    source: FONTE,
    notes: DA_MYMAPS,
  }),
  sp({
    id: "exp-porto-palmas",
    stageId: "ps-argentiera",
    name: "Experience 16 · Porto Palmas (arrivo)",
    access: P(40.74863649450717, 8.188445362031837),
    experienceArea: true,
    wow: 5,
    walkRoute: "All'arrivo della prova, accanto alla RIS Hospitality.",
    source: FONTE,
    notes: DA_MYMAPS,
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

    // 01/10 — giovedì. Piano: shakedown (Olmedo) + Ittiri Arena. Orari: timetable ufficiale.
    ev("2026-10-01", "", "Partenza da Alghero verso lo shakedown (Olmedo)", "partenza", { stageId: "sd" }),
    ev("2026-10-01", "06:00", "Strade chiuse allo shakedown", "parcheggio", { stageId: "sd", roadClosure: "06:00" }),
    ev("2026-10-01", "09:01", "Shakedown · passano le prime auto", "prova", { stageId: "sd", roadClosure: "06:00" }),
    ev("2026-10-01", "12:30", "Pranzo", "pasto"),
    ev("2026-10-01", "", "Partenza da Alghero verso Ittiri Arena", "partenza", { stageId: "ps1" }),
    ev("2026-10-01", "16:05", "PS 1 · Ittiri Arena Show", "prova", { stageId: "ps1" }),
    ev("2026-10-01", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),
    ev("2026-10-01", "08:30", "Service Park Alghero (orario sul Pass Gold)", "rally", {
      address: SERVICE_PARK,
      optional: true,
      notes: "Orario e sede stampati sul Pass Gold. Dove si ritira la Welcome Box: da verificare con l'organizzazione.",
    }),
    ev("2026-10-01", "15:00", "Partenza ufficiale del rally · Alghero", "rally", { address: SERVICE_PARK, optional: true }),

    // 02/10 — venerdì. Piano: Alà Arena (Experience 7–8), due passaggi.
    ev("2026-10-02", "", "Partenza da Alghero verso Alà Arena", "partenza", { stageId: "ps-alalerno" }),
    ev("2026-10-02", "07:08", "Strade chiuse: da ora non si entra più", "parcheggio", { stageId: "ps-alalerno", roadClosure: "07:08" }),
    ev("2026-10-02", "10:08", "PS 4 · 1° passaggio all'Alà Arena", "prova", { stageId: "ps-alalerno", roadClosure: "07:08" }),
    ev("2026-10-02", "12:30", "Pranzo", "pasto", { notes: "Portare cibo e acqua: in zona i servizi possono essere pochi." }),
    ev("2026-10-02", "16:38", "PS 7 · 2° passaggio all'Alà Arena", "prova", { stageId: "ps-alalerno", roadClosure: "14:38" }),
    ev("2026-10-02", "17:45", "Rientro all'alloggio", "auto", {
      placeId: ALLOGGIO,
      notes: "Si riparte quando la strada riapre, dopo l'ultima auto: l'orario è indicativo.",
    }),
    ev("2026-10-02", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),
    ev("2026-10-02", "08:01", "PS 2 · Tula – Erula 1", "prova", { stageId: "ps-tula", roadClosure: "05:01", optional: true }),
    ev("2026-10-02", "09:01", "PS 3 · Su Filigosu – Lerno 1", "prova", { stageId: "ps-filigosu", roadClosure: "06:01", optional: true }),
    ev("2026-10-02", "14:31", "PS 5 · Tula – Erula 2", "prova", { stageId: "ps-tula", roadClosure: "12:31", optional: true }),
    ev("2026-10-02", "15:31", "PS 6 · Su Filigosu – Lerno 2", "prova", { stageId: "ps-filigosu", roadClosure: "13:31", optional: true }),

    // 03/10 — sabato. Piano: Galoppatoio di Pattada (Experience 12–13), due passaggi.
    ev("2026-10-03", "", "Partenza da Alghero verso il Galoppatoio di Pattada", "partenza", { stageId: "ps-solorche" }),
    ev("2026-10-03", "07:07", "Strade chiuse: da ora non si entra più", "parcheggio", { stageId: "ps-solorche", roadClosure: "07:07" }),
    ev("2026-10-03", "10:07", "PS 10 · 1° passaggio al Galoppatoio", "prova", { stageId: "ps-solorche", roadClosure: "07:07" }),
    ev("2026-10-03", "12:30", "Pranzo", "pasto", { notes: "Portare cibo e acqua: in zona i servizi possono essere pochi." }),
    ev("2026-10-03", "16:37", "PS 13 · 2° passaggio al Galoppatoio", "prova", { stageId: "ps-solorche", roadClosure: "14:37" }),
    ev("2026-10-03", "17:45", "Rientro all'alloggio", "auto", {
      placeId: ALLOGGIO,
      notes: "Si riparte quando la strada riapre, dopo l'ultima auto: l'orario è indicativo.",
    }),
    ev("2026-10-03", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),
    ev("2026-10-03", "08:01", "PS 8 · Lerno – Sa Conchedda – Monti di Alà 1", "prova", { stageId: "ps-lernoala", roadClosure: "05:01", optional: true }),
    ev("2026-10-03", "09:11", "PS 9 · Coiluna – Loelle 1", "prova", { stageId: "ps-coiluna", roadClosure: "06:11", optional: true }),
    ev("2026-10-03", "14:31", "PS 11 · Lerno – Sa Conchedda – Monti di Alà 2", "prova", { stageId: "ps-lernoala", roadClosure: "12:31", optional: true }),
    ev("2026-10-03", "15:41", "PS 12 · Coiluna – Loelle 2", "prova", { stageId: "ps-coiluna", roadClosure: "13:41", optional: true }),

    // 04/10 — domenica. Piano: Argentiera sul mare (Experience 15–16) e podio.
    ev("2026-10-04", "", "Partenza da Alghero verso l'Argentiera", "partenza", { stageId: "ps-argentiera" }),
    ev("2026-10-04", "07:05", "Strade chiuse: da ora non si entra più", "parcheggio", { stageId: "ps-argentiera", roadClosure: "07:05" }),
    ev("2026-10-04", "10:05", "PS 15 · 1° passaggio all'Argentiera", "prova", { stageId: "ps-argentiera", roadClosure: "07:05" }),
    ev("2026-10-04", "12:30", "Pranzo", "pasto", { notes: "Portare cibo e acqua: le strade restano chiuse fino alla Power Stage." }),
    ev("2026-10-04", "14:15", "PS 17 · Power Stage: si decide il mondiale", "prova", { stageId: "ps-argentiera", roadClosure: "07:05" }),
    ev("2026-10-04", "17:00", "Podio · Alghero", "rally", { notes: "Festa finale con le premiazioni." }),
    ev("2026-10-04", "20:30", "Cena", "pasto", { placeId: "pl-cena" }),
    ev("2026-10-04", "08:31", "PS 14 · Osilo – Tergu 1", "prova", { stageId: "ps-osilo", roadClosure: "05:31", optional: true }),
    ev("2026-10-04", "11:38", "PS 16 · Osilo – Tergu 2", "prova", { stageId: "ps-osilo", roadClosure: "05:31", optional: true }),
    ev("2026-10-04", "15:15", "Arrivo del rally · Alghero", "rally", { optional: true, notes: "Parc Fermé di Alghero." }),

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
  { date: "2026-10-01", title: "Rally · Shakedown e Ittiri Arena", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS, planStageIds: ["sd", "ps1"] },
  { date: "2026-10-02", title: "Rally · Alà Arena", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS, planStageIds: ["ps-alalerno"] },
  { date: "2026-10-03", title: "Rally · Galoppatoio di Pattada", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS, planStageIds: ["ps-solorche"] },
  { date: "2026-10-04", title: "Rally · Argentiera e podio", kind: "rally", location: "Alghero", gearPresetId: "rally", notes: PASS, planStageIds: ["ps-argentiera"] },
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
  "Scarpe comode da sterrato",
  "Cappellino e crema solare",
  "Pranzo al sacco per tutta la giornata",
  "Contanti",
  "Mappe offline della zona scaricate",
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
