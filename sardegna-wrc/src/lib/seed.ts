import { haversineKm } from "./geo";
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

export const DATA_VERSION = 23;

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
  8: ["2026-10-04"], // Argentiera: punto con sfondo mare come principale
  9: [], // coordinate esatte da mappe interattive ufficiali (prove e aree)
  10: [], // immagini: vista dall'alto delle aree e schede ufficiali
  11: ["2026-09-29"], // pomeriggio a Livorno prima dell'imbarco
  12: ["2026-09-29", "2026-09-30"], // mete a scelta
  13: ["2026-09-29"], // Livorno a rischio zero: in fila all'imbarco alle 19:30
  14: ["2026-09-30"], // spesa per il rally (allergie: niente pesce né frutta secca)
  15: ["2026-09-29", "2026-10-07"], // limite check-in Moby alle 20:00 (dato dal proprietario)
  16: ["2026-09-29"], // partenza da casa alle 11, pranzo al Burger King di Manerba, arrivo ~16:15
  17: ["2026-09-29"], // NAVIGA ai parcheggi e all'imbarco Moby ufficiale (Via Donegani)
  18: ["2026-09-29"], // avviso ZTL di Livorno
  19: ["2026-09-29"], // Livorno senza città: uscita Porto, parcheggio P1, tutto a piedi, imbarco diretto
  20: [], // guida ufficiale alle PS per spettatori (rallyitaliasardegna.com): dettagli delle aree
  21: [], // guida ufficiale: Ittiri Arena (parcheggi lungo la NSA 167, accesso da est lato Tiesi)
  22: [], // guida ufficiale: Tula–Erula (accessi da Tula e da Erula)
  23: [], // guida ufficiale: Su Filigosu–Lerno (solo 4x4, divieto 30 min prima dello start)
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
// Imbarco Moby a Livorno dal sito ufficiale Moby (moby.it, porto di Livorno):
// "Imbarchi Stazione Marittima, Via Donegani, 57100 Livorno LI"; dall'uscita autostradale
// "Porto" seguire "Imbarco passeggeri", "Via Guido Donegani" e "MOBY"; check-in elettronico
// nel piazzale davanti alla nave.
const LIVORNO_PORTO = "Via Guido Donegani, 57100 Livorno";
const IMBARCO_LIVORNO =
  "Imbarco Moby: Stazione Marittima, Via Donegani (sito Moby). Seguite i cartelli \"Imbarco passeggeri\", \"Via Guido Donegani\" e \"MOBY\". Il check-in è elettronico nel piazzale davanti alla nave.";
// Parcheggio auto P1 del porto passeggeri (sito Porto di Livorno 2000): Piazza del Portuale,
// 111 posti, a pagamento (1 €/ora), accesso 24h dal Varco Donegani e 06–22 dal Varco Fortezza.
const PARCHEGGIO_PORTO = "Piazza del Portuale, 57100 Livorno";
// ZTL (Comune di Livorno e fonti di mobilità): centro 7:30–20:00 nei feriali; quartiere
// La Venezia 24 ore, con varchi in Via della Venezia (Via Borra), Piazza del Luogo Pio e
// Via Forte San Pietro. In Venezia Nuova si entra solo a piedi.
const ZTL_LIVORNO =
  "ZTL: in Venezia Nuova non entrate in auto (varchi con telecamere, attivi sempre); il centro è ZTL dalle 7:30 alle 20:00. Lasciate l'auto al parcheggio del porto e seguite i cartelli \"Porto\" e \"Imbarco passeggeri\", non le scorciatoie del navigatore nel centro.";
const OLBIA_PORTO = "Porto di Olbia";
const DOCUMENTI = "All'imbarco serve la carta d'identità in originale di entrambi (indicato sul biglietto).";
// Limite check-in all'andata: ore 20:00, 2 ore prima della partenza (indicato dal proprietario).
const CHECKIN_LIMITE = "Limite per il check-in: ore 20:00, 2 ore prima della partenza.";
const CHECKIN_RITORNO =
  "All'andata il limite era alle 20:00 (2 ore prima): qui si assume lo stesso, da verificare sull'app o sul sito Moby.";

// Pass Gold RIS Experience (dai biglietti): uno per persona per ciascun giorno 1–4 ottobre,
// sede indicata "Service Park Alghero, Lungomare Barcellona", orario sul biglietto 08:30.
// Contenuto del pass dal sito ufficiale: accesso alle Aree Experience lungo il percorso
// (punti spettacolari e tecnici delle prove speciali) + Welcome Box con T-shirt ufficiale.
const SERVICE_PARK = "Lungomare Barcellona, Alghero";
const PASS = "Oggi serve il Pass Gold: uno a testa, sempre con voi.";
// Allergie dichiarate dal proprietario (dato non sensibile per il viaggio: niente nomi).
const ALLERGIE = "Allergie: niente pesce né frutta secca. Ditelo sempre al ristorante e leggete le etichette (anche \"può contenere tracce\").";

function stage(s: Omit<RallyStage, "seen" | "passes"> & Partial<Pick<RallyStage, "passes">>): RallyStage {
  return { passes: [], seen: false, ...s };
}

// Prove 2026 dal TIMETABLE UFFICIALE (V5.1, 14/09/2026) e dalla MAPPA ZONE SPETTATORI
// ufficiale: orari, chiusure strade, km, Access Point (coordinate esatte) e aree
// Experience del Pass Gold (cerchi blu numerati sulle mappe). Le coordinate precise di
// aree e parcheggi interni sono nelle mappe interattive ufficiali (Google My Maps /
// rlab.app): finché non sono inserite, NAVIGA porta all'Access Point ufficiale e da lì
// si segue l'accesso segnalato.
const FONTE = "Timetable ufficiale V5.1, mappa zone spettatori e mappe interattive ufficiali 2026";

/** Distanza in linea d'aria parcheggio → area, arrotondata (il percorso reale è più lungo). */
function aria(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineKm(a, b) * 1000 / 10) * 10;
}
const P = (lat: number, lng: number): GeoPoint => ({ lat, lng });
const ACCESSO =
  "NAVIGA porta al parcheggio indicato dalla mappa interattiva ufficiale. Arrivate dall'ingresso ufficiale per il pubblico (Access Point) seguendo i cartelli: alcune strade sono a senso unico o chiuse.";

const stages: RallyStage[] = [
  stage({
    id: "sd",
    number: 0,
    name: "Shakedown · Monte Baranta",
    date: "2026-10-01",
    firstCar: "09:01",
    roadClosure: "06:00",
    lengthKm: 3.27,
    notes: `Ex Miniera di Bauxite, vicino a Olmedo. Aree Experience 1 e 2 alla partenza, con parcheggio Experience. ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Ex Miniera Bauxite",
    parking: P(40.660558, 8.39582),
    mapImage: "stages/map-sd.jpg",
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
    notes:
      "Partenza da Alghero suggerita alle 14:45, per arrivare con un'ora di anticipo (la chiusura delle 06:00 riguarda il tracciato). Super speciale in arena (km 2,08 sulla mappa, 2,21 nel timetable): le auto partono due alla volta e fanno 2 giri inseguendosi, con due salti e un guado (water splash). Area Experience 3 accanto al salto, RIS Hospitality. Parcheggi (guida ufficiale): ai lati della Nuova Strada ANAS 167 di Ittiri (NSA 167), con accesso da est, lato Tiesi; poi ingresso pedonale segnalato all'arena.",
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Ittiri Arena",
    parking: P(40.586806, 8.566995),
    mapImage: "stages/map-ps1.jpg",
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
    notes:
      "Aree Experience 4, 5 e 6 tra Turrina Manna e Sa Mela. Accesso Experience e disabili riservato alle auto; da Tula accesso a senso unico fino allo start della prova, dopo lo start solo in uscita. Da Erula c'è il bus navetta (Bus IN/OUT Point) con punto ristoro. Guida ufficiale: parte centrale nel parco eolico di Sa Turrina Manna (salti e compressioni), finale stretto e tecnico nel bosco di Coghinas. Parcheggi ampi sia sul lato Tula sia sul lato Erula; da Erula si accede dalla zona del cimitero comunale. Non bloccate la strada da Tula: è via di evacuazione e percorso alternativo dei concorrenti.",
    parkingKind: "parking",
    parkingName: "Parcheggio Sa Mela (auto Experience e disabili)",
    parking: P(40.780709, 8.975162),
    mapImage: "stages/map-ps-tula.jpg",
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
    notes: "Nessuna area Experience su questa prova. Unica zona pubblico: Filigosu (area 5), su una fascia tagliafuoco del cantiere forestale, con tratto molto veloce e ottima visibilità. Guida ufficiale: parcheggio e accesso in auto SOLO con 4x4 o auto alte da terra; senza, arrivare con largo anticipo a piedi seguendo il personale. Nei 30 minuti prima dello start sono vietati transito pedonale e accesso al percorso.",
    mapImage: "stages/map-ps-filigosu.jpg",
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
    notes: `Alà Arena alla partenza: aree Experience 7 e 8, salto e Water Splash, RIS Hospitality, parcheggio Experience e parcheggio spettatori. Altre zone pubblico: Altopiano (7) e Sos Vanzos (8), accessi da Buddusò. ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Alà Arena",
    parking: P(40.670986, 9.294639),
    mapImage: "stages/map-ps-alalerno.jpg",
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
    notes: `Lerno Jump alla partenza: area Experience 9 con parcheggio Experience, e zona pubblico 9. Altre zone: Sa Jone (10, con parcheggio spettatori), Tandalò Paddock (11), Centrale Elettrica (12). ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Lerno",
    parking: P(40.608137, 9.184611),
    mapImage: "stages/map-ps-lernoala.jpg",
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
    notes: `Aree Experience 10 (Buddusò Arena, con parcheggio Experience) e 11 (Nuraghe Loelle). Coiluna Jump (zona 13) solo pubblico, accesso 4x4/SUV da Alà dei Sardi o Mamone. ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio · Buddusò Arena",
    parking: P(40.565698, 9.326432),
    mapImage: "stages/map-ps-coiluna.jpg",
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
    notes: `Galoppatoio di Pattada all'arrivo: aree Experience 12 e 13 con salto, RIS Hospitality, parcheggio Experience e spettatori. Sulla mappa SS 13 è indicata alle 16:07, nel timetable ufficiale alle 16:37: vale il timetable. Zone Casa Betania Nord/Sud (16–17) con accesso da Bultei. ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Galoppatoio di Pattada",
    parking: P(40.545519, 9.09484),
    mapImage: "stages/map-ps-solorche.jpg",
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
    notes: `Quadrivio: area Experience 14 con parcheggio Experience, zona pubblico 19. Altre zone: Tanca Noa (20) e Tergu (21), accesso da Tergu. ${ACCESSO}`,
    parkingKind: "parking",
    parkingName: "Parcheggio Experience (P verde) · Quadrivio",
    parking: P(40.814591, 8.700295),
    mapImage: "stages/map-ps-osilo.jpg",
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
    spectatorPointId: "exp-ebi-dozzi",
    notes:
      "Sul mare: aree Experience 15 (Ebi Dozzi) e 16 (Porto Palmas, arrivo), RIS Hospitality. Da Palmadula accesso pedonale alla zona 22; parcheggi spettatori verso l'Argentiera per le zone sul mare (23). Strade chiuse dalle 07:05 fino alla Power Stage.",
    parkingKind: "parking",
    parkingName: "Parcheggio spettatori · Argentiera",
    parking: P(40.7463634, 8.1611638),
    mapImage: "stages/map-ps-argentiera.jpg",
  }),
];

function sp(s: Omit<SpectatorPoint, "photoIds">): SpectatorPoint {
  return { photoIds: [], ...s };
}

// Aree Experience del Pass Gold (e poche zone pubblico notevoli) dalla mappa ufficiale.
// WOW = mia valutazione in base a ciò che la mappa segnala (salti, guadi, arene, mare).
const DA_MYMAPS = "Coordinate dell'area e del parcheggio dalla mappa interattiva ufficiale della prova.";

const spectatorPoints: SpectatorPoint[] = [
  sp({
    id: "exp-sd",
    stageId: "sd",
    name: "Experience 1–2 · Ex Miniera Bauxite",
    access: P(40.65178190753158, 8.37644763855414),
    experienceArea: true,
    wow: 4,
    cornerType: "Tornanti e salto alla partenza",
    walkRoute: "Dall'Access Point di Olmedo seguire l'accesso segnalato fino all'Ex Miniera: parcheggio Experience accanto alla partenza. La guida ufficiale indica ampia disponibilità di parcheggi e chiede di seguire scrupolosamente segnaletica e indicazioni.",
    description: "Dentro la miniera di bauxite di Olmedo: nel piazzale principale ampi traversi, cambi di direzione e un salto. Dalle tribune naturali rialzate ai margini del piazzale si seguono a lungo le auto. È l'unica zona aperta al pubblico dello shakedown (guida ufficiale). Le auto passano più volte: ottimo per iniziare e provare foto e video.",
    source: FONTE,
    notes: DA_MYMAPS,
    point: P(40.659268, 8.397047),
    parking: P(40.660558, 8.39582),
    parkingName: "Parcheggio spettatori · Ex Miniera Bauxite",
    walkDistance: aria(P(40.660558, 8.39582), P(40.659268, 8.397047)),
    image: "stages/exp-sd.jpg",
  }),
  sp({
    id: "exp-ittiri",
    stageId: "ps1",
    name: "Experience 3 · Ittiri Arena",
    address: "Ittiri Arena, Ittiri",
    experienceArea: true,
    wow: 4,
    cornerType: "Arena con salto e water splash",
    walkRoute: "Parcheggio ai lati della Nuova Strada ANAS 167 (NSA 167), con accesso da est, lato Tiesi (guida ufficiale): se Maps vi fa arrivare da un'altra parte, seguite i cartelli. Poi ingresso pedonale segnalato fino all'arena. Area Experience 3 accanto al salto.",
    description: "Le auto partono due alla volta e si inseguono per 2 giri, con due salti e un guado: si segue quasi tutta la gara da un unico punto. Dalle gradinate naturali intorno all'arena la visuale è ampia e rialzata. Il modo perfetto per il primo rally.",
    source: FONTE,
    point: P(40.586, 8.564584),
    parking: P(40.586806, 8.566995),
    parkingName: "Parcheggio spettatori · Ittiri Arena",
    walkDistance: aria(P(40.586806, 8.566995), P(40.586, 8.564584)),
    image: "stages/exp-ittiri.jpg",
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
    point: P(40.7795393, 8.9746602),
    parking: P(40.780709, 8.975162),
    parkingName: "Parcheggio Sa Mela (auto Experience e disabili)",
    walkDistance: aria(P(40.780709, 8.975162), P(40.7795393, 8.9746602)),
    image: "stages/exp-tula-6.jpg",
  }),
  sp({
    id: "exp-tula-4",
    stageId: "ps-tula",
    name: "Experience 4–5 · Turrina Manna",
    access: P(40.72751145540492, 8.983330894154273),
    experienceArea: true,
    wow: 4,
    walkRoute:
      "Due accessi (guida ufficiale). Da Tula: strada in salita a senso unico, percorribile fino allo start della prova; dopo la partenza diventa a senso unico in discesa. Non bloccate la strada: è via di evacuazione. Da Erula: dalla zona del cimitero comunale. Parcheggi ampi su entrambi i lati; parcheggio Experience accanto all'area 4.",
    description: "Dentro il parco eolico di Sa Turrina Manna, lungo una fascia tagliafuoco: tratto velocissimo con salti e compressioni di grande impatto.",
    source: FONTE,
    notes: DA_MYMAPS,
    point: P(40.762394, 8.9658306),
    parking: P(40.765139, 8.963501),
    parkingName: "Parcheggio spettatori · Turrina Manna",
    walkDistance: aria(P(40.765139, 8.963501), P(40.762394, 8.9658306)),
    image: "stages/exp-tula-4.jpg",
  }),
  sp({
    id: "zona-filigosu",
    stageId: "ps-filigosu",
    name: "Zona pubblico 5 · Filigosu",
    access: P(40.72157726858769, 9.11652993606414),
    wow: 3,
    walkRoute: "Da Oschiri accesso segnalato. Accesso in auto e parcheggio solo per 4x4 o auto alte da terra (guida ufficiale); senza, arrivare con largo anticipo e seguire il personale. Nei 30 minuti prima dello start è vietato anche il transito a piedi.",
    description: "Fascia tagliafuoco del cantiere forestale di Filigosu: spazio ampio e aperto, ottima visibilità su un tratto veloce. Nessuna area Experience su questa prova.",
    source: FONTE,
    point: P(40.700626, 9.151407),
    image: "stages/zona-filigosu.jpg",
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
    point: P(40.670099, 9.292726),
    parking: P(40.670986, 9.294639),
    parkingName: "Parcheggio spettatori · Alà Arena",
    walkDistance: aria(P(40.670986, 9.294639), P(40.670099, 9.292726)),
    image: "stages/exp-ala-arena.jpg",
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
    point: P(40.603697, 9.178533),
    parking: P(40.608137, 9.184611),
    parkingName: "Parcheggio spettatori · Lerno",
    walkDistance: aria(P(40.608137, 9.184611), P(40.603697, 9.178533)),
    image: "stages/exp-lerno-jump.jpg",
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
    point: P(40.568983, 9.332695),
    parking: P(40.565698, 9.326432),
    parkingName: "Parcheggio · Buddusò Arena",
    walkDistance: aria(P(40.565698, 9.326432), P(40.568983, 9.332695)),
    image: "stages/exp-budduso-arena.jpg",
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
    point: P(40.568285, 9.318051),
    parking: P(40.565698, 9.326432),
    parkingName: "Parcheggio · Buddusò Arena",
    walkDistance: aria(P(40.565698, 9.326432), P(40.568285, 9.318051)),
    image: "stages/exp-nuraghe-loelle.jpg",
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
    point: P(40.595968, 9.363383),
    parking: P(40.596437, 9.367404),
    parkingName: "Parcheggio Coiluna (solo 4x4)",
    walkDistance: aria(P(40.596437, 9.367404), P(40.595968, 9.363383)),
    image: "stages/zona-coiluna-jump.jpg",
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
    point: P(40.545812, 9.092092),
    parking: P(40.545519, 9.09484),
    parkingName: "Parcheggio spettatori · Galoppatoio di Pattada",
    walkDistance: aria(P(40.545519, 9.09484), P(40.545812, 9.092092)),
    image: "stages/exp-galoppatoio.jpg",
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
    point: P(40.815248, 8.701731),
    parking: P(40.814591, 8.700295),
    parkingName: "Parcheggio Experience (P verde) · Quadrivio",
    walkDistance: aria(P(40.814591, 8.700295), P(40.815248, 8.701731)),
    image: "stages/exp-quadrivio.jpg",
  }),
  sp({
    id: "exp-ebi-dozzi",
    stageId: "ps-argentiera",
    name: "Experience 15 · Ebi Dozzi (sul mare)",
    access: P(40.74863649450717, 8.188445362031837),
    experienceArea: true,
    wow: 5,
    cornerType: "Tratto a bordo mare: le auto con il mare alle spalle",
    photoGear:
      "Guardando verso il mare si è rivolti a ovest: al passaggio delle 10:05 il sole è alle spalle (luce migliore), alle 14:15 è più laterale e verso il mare.",
    walkRoute: "Accesso dal lato Argentiera / Porto Palmas; parcheggi spettatori verso l'Argentiera. Da Palmadula solo accesso pedonale alla zona 22.",
    description: "Le auto corrono sul mare: lo scenario più spettacolare del rally, dove si decide il mondiale.",
    source: FONTE,
    notes: DA_MYMAPS,
    point: P(40.757951, 8.160377),
    parking: P(40.7463634, 8.1611638),
    parkingName: "Parcheggio spettatori · Argentiera",
    walkDistance: aria(P(40.7463634, 8.1611638), P(40.757951, 8.160377)),
    image: "stages/exp-ebi-dozzi.jpg",
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
    point: P(40.750907, 8.157676),
    parking: P(40.7463634, 8.1611638),
    parkingName: "Parcheggio spettatori · Argentiera",
    walkDistance: aria(P(40.7463634, 8.1611638), P(40.750907, 8.157676)),
    image: "stages/exp-porto-palmas.jpg",
  }),
];

function place(p: Omit<Place, "photoIds" | "visited">): Place {
  return { photoIds: [], visited: false, ...p };
}

// Alloggio (dalla prenotazione): 30/09–07/10, check-in 15:00–23:30, check-out 08:00–10:00.
const ALLOGGIO = "pl-alloggio";

const places: Place[] = [
  // Livorno, martedì 29/09 prima dell'imbarco (indirizzi: NAVIGA li cerca su Maps).
  place({
    id: "pl-livorno-venezia",
    name: "Quartiere Venezia Nuova e Fortezza Vecchia",
    category: "visitare",
    address: PARCHEGGIO_PORTO,
    hours: "Parcheggio P1 del porto: 24h dal Varco Donegani, 06–22 dal Varco Fortezza",
    notes: "NAVIGA porta al parcheggio P1 del porto (Piazza del Portuale, 1 €/ora), a due passi a piedi. Il quartiere dei canali (fossi medicei), ponti e palazzi sull'acqua; a pochi passi la Fortezza Vecchia sul porto mediceo. Da girare a piedi.",
  }),
  place({
    id: "pl-livorno-mascagni",
    name: "Terrazza Mascagni",
    category: "panorama",
    address: "Viale Italia 36, 57127 Livorno",
    notes: "NAVIGA porta al parcheggio a pagamento della Terrazza Mascagni (Viale Italia 36). Se è pieno: parcheggio di Via Forte dei Cavalleggeri 49, a circa 500 m. Il grande belvedere a scacchiera sul mare.",
  }),
  place({
    id: "pl-livorno-montenero",
    name: "Santuario di Montenero",
    category: "panorama",
    address: "Santuario di Montenero, Livorno",
    notes: "Santuario in collina con vista su Livorno e sul mare, circa 15 minuti d'auto dal centro (stima, senza traffico).",
  }),
  place({
    id: "pl-livorno-acquario",
    name: "Acquario di Livorno",
    category: "attrazione",
    address: "Acquario di Livorno, Piazzale Mascagni, Livorno",
    notes: "Parcheggio proprio davanti all'Acquario (circa 120 posti, dal sito dell'Acquario). Accanto alla Terrazza Mascagni: buona alternativa se piove. Orari e biglietti da verificare.",
  }),
  place({
    id: "pl-livorno-cena",
    name: "Cena in Venezia Nuova",
    category: "ristorante",
    address: PARCHEGGIO_PORTO,
    hours: "Parcheggio P1 del porto: 24h dal Varco Donegani, 06–22 dal Varco Fortezza",
    notes: `NAVIGA porta al parcheggio P1 del porto (Piazza del Portuale): lasciate lì l'auto e andate a piedi in Venezia Nuova, accanto alla Fortezza Vecchia. Per qualcosa di veloce e senza pesce: il "5 e 5" (torta di ceci nel pane). ${ALLERGIE}`,
  }),
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
    // 29/09 — partenza (Moby, dal biglietto). Orari di viaggio indicati dal proprietario
    // (partenza 11:00, pranzo veloce al Burger King di Manerba); tempi di guida = stime.
    // Rischio zero: dalle 18:00 si resta a pochi minuti dall'imbarco e in fila alle 19:30
    // (30 min prima del limite delle 20:00).
    ev("2026-09-29", "11:00", "Partenza da casa", "partenza", {
      address: "Burger King, Manerba del Garda",
      notes: "Prima tappa: pranzo al Burger King di Manerba (circa 40 minuti sulla Gardesana, stima).",
    }),
    ev("2026-09-29", "11:40", "Pranzo al Burger King · Manerba", "pasto", {
      address: "Burger King, Manerba del Garda",
      deadline: "12:15",
      notes: `Pranzo veloce: ripartite entro le 12:15. Chiedete la tabella degli allergeni: fritti in olio separato dai prodotti di pesce? Evitate dolci e gelati con topping.\n${ALLERGIE}`,
    }),
    ev("2026-09-29", "12:15", "Partenza per il parcheggio del porto di Livorno", "partenza", {
      address: PARCHEGGIO_PORTO,
      notes: "Circa 3 ore e mezza con una pausa. Niente città: in autostrada prendete l'uscita \"Porto\" e seguite \"Imbarco passeggeri\" e \"Via Guido Donegani\": NAVIGA porta al parcheggio P1 del porto (Piazza del Portuale, 1 €/ora, 24h dal Varco Donegani). L'auto è carica di bagagli: alle soste, niente in vista.",
    }),
    ev("2026-09-29", "16:15", "Passeggiata in Venezia Nuova e Fortezza Vecchia", "visita", {
      placeId: "pl-livorno-venezia",
      choices: ["pl-livorno-venezia", "pl-livorno-mascagni", "pl-livorno-acquario"],
      notes: "Auto al parcheggio P1 del porto e tutto a piedi: Venezia Nuova è accanto (in auto è ZTL). Terrazza Mascagni e Acquario sono alternative in auto, sul lungomare: solo se arrivate presto, ripartendo entro le 17:45.",
    }),
    ev("2026-09-29", "18:00", "Cena vicino al porto", "pasto", {
      placeId: "pl-livorno-cena",
      deadline: "19:00",
      notes: `NAVIGA porta al parcheggio P1 del porto passeggeri (Piazza del Portuale, 1 €/ora, non custodito: niente in vista). Da lì a piedi in Venezia Nuova per cena, poi di nuovo all'auto: l'imbarco è nello stesso porto.\n${ZTL_LIVORNO}`,
    }),
    ev("2026-09-29", "19:00", "Dal parcheggio all'imbarco Moby", "partenza", {
      address: LIVORNO_PORTO,
      deadline: "19:15",
      notes: `Non serve passare dalla biglietteria: con il biglietto andate direttamente all'imbarco. Pagate il parcheggio e seguite i cartelli. ${IMBARCO_LIVORNO} Tenete pronti biglietto e carte d'identità in originale. Obiettivo: in fila alle 19:30.`,
    }),
    ev("2026-09-29", "19:30", "In fila per l'imbarco", "traghetto", {
      address: LIVORNO_PORTO,
      deadline: "20:00",
      notes: `${IMBARCO_LIVORNO}\nArrivando alle 19:30 avete 30 minuti di margine sul limite delle 20:00.\n${CHECKIN_LIMITE}\n${DOCUMENTI}\nCodice prenotazione: aggiungilo qui con la matita.`,
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
    ev("2026-09-30", "11:00", "Centro storico e Bastioni", "visita", {
      placeId: "pl-centro",
      choices: ["pl-centro", "pl-palmavera", "pl-mugoni"],
    }),
    ev("2026-09-30", "13:00", "Pranzo", "pasto"),
    ev("2026-09-30", "16:00", "Spesa per il rally", "altro", {
      notes: `Acqua e cibo per i giorni di rally: si parte prima che aprano i negozi e nelle aree i servizi possono essere pochi. Lista da spuntare: Gear → Spesa rally. Giovedì pomeriggio, ad Alghero, si può fare un secondo giro per il weekend.\n${ALLERGIE}`,
    }),
    ev("2026-09-30", "17:30", "Capo Caccia al tramonto", "panorama", {
      placeId: "pl-capocaccia",
      choices: ["pl-capocaccia", "pl-centro"],
    }),
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
    ev("2026-10-07", "17:00", "Partenza da Alghero verso Olbia", "partenza", {
      address: OLBIA_PORTO,
      notes: "Orario suggerito per essere al porto verso le 19:00, con un'ora di margine sul check-in: controllare il tempo su Maps.",
    }),
    ev("2026-10-07", "19:00", "In fila per l'imbarco a Olbia", "traghetto", {
      address: OLBIA_PORTO,
      deadline: "20:00",
      notes: `${CHECKIN_RITORNO}\n${DOCUMENTI}`,
    }),
    ev("2026-10-07", "22:00", "Partenza Moby Olbia → Livorno", "traghetto", {
      address: OLBIA_PORTO,
      notes: "Cabina doppia interna (C2) · 2 adulti · auto al seguito. Arrivo a Livorno la mattina dell'8 ottobre.",
    }),
  ];
}

const days: TripDay[] = [
  {
    date: "2026-09-29",
    title: "Viaggio a Livorno e traghetto per Olbia",
    kind: "viaggio",
    location: "Livorno",
    gearPresetId: "serata",
    notes: "Livorno senza traffico cittadino: uscita \"Porto\", parcheggio P1 del porto, poi tutto a piedi. Occhio alle ZTL: in Venezia Nuova solo a piedi, il centro è ZTL dalle 7:30 alle 20:00. All'imbarco si va direttamente, check-in nel piazzale davanti alla nave. Piano B: se alle 17:30 non siete ancora a Livorno, niente visite: cena vicino al porto e in fila alle 19:30. Il traghetto non aspetta, una visita sì.",
  },
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
  // Per 2 persone e 4 giorni di rally. Niente pesce né frutta secca (allergie).
  preset("spesa", "Spesa rally", [
    "Acqua: 4 litri al giorno in due (di più se fa caldo)",
    "Scorta d'acqua da lasciare in auto",
    "Bottigliette o borracce per lo zaino",
    "Pane o panini (il carasau dura a lungo)",
    "Formaggio stagionato",
    "Salumi o prosciutto",
    "Frutta resistente (mele, banane)",
    "Crackers o grissini",
    "Barrette e biscotti SENZA frutta secca",
    "Cioccolato (controllare: senza nocciole né tracce)",
    "Colazione per le partenze all'alba",
    "Borsa frigo e siberini",
    "Sacchetti per la spazzatura",
    "Salviette, fazzoletti e carta igienica",
    "Farmaci per le allergie",
    "Etichette controllate: niente pesce né frutta secca",
  ]),
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
