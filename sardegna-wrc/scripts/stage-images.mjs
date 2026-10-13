// Genera le immagini "La vostra visuale" in public/stages/:
//  - vista satellitare ravvicinata di ogni area, con sopra i dati delle mappe interattive
//    ufficiali (scripts/official/*.kml): prova in rosso, aree Experience in blu, zone
//    pubblico in giallo, parcheggi "P";
//  - le schede ufficiali della mappa zone spettatori (PNG già renderizzati, se forniti).
// Uso: node scripts/stage-images.mjs [cartella-png-schede]
// Richiede rete (tile satellitari Esri World Imagery) e curl.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/stages");
const KML_DIR = path.resolve("scripts/official");
const TILE_CACHE = path.resolve(".cache/tiles");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TILE_CACHE, { recursive: true });

const W = 1000;
const H = 640;

// Area → mappa, poligono da evidenziare, parcheggio scelto (stessi dati di src/lib/seed.ts).
const AREAS = [
  { id: "exp-sd", kml: "SD", area: /^01 - Experience$/, label: "1", parking: [40.660558, 8.39582] },
  { id: "exp-ittiri", kml: "SSS1", area: /^03 - Experience$/, label: "3", parking: [40.586806, 8.566995] },
  { id: "exp-tula-6", kml: "SS2-5", area: /^06 - Experience$/, label: "6", parking: [40.780709, 8.975162] },
  { id: "exp-tula-4", kml: "SS2-5", area: /^04 - Experience$/, label: "4", parking: [40.765139, 8.963501] },
  { id: "zona-filigosu", kml: "SS3-6", area: /^05 - Spectator$/, label: "5" },
  { id: "exp-ala-arena", kml: "SS4-7", area: /^07\s+- Experience$/, label: "7", parking: [40.670986, 9.294639] },
  { id: "exp-lerno-jump", kml: "SS8-11", area: /^09\s+- Experience$/, label: "9", parking: [40.608137, 9.184611] },
  { id: "exp-budduso-arena", kml: "SS9-12", area: /^10 - Experience$/, label: "10", parking: [40.565698, 9.326432] },
  { id: "exp-nuraghe-loelle", kml: "SS9-12", area: /^11 - Experience$/, label: "11", parking: [40.565698, 9.326432] },
  { id: "zona-coiluna-jump", kml: "SS9-12", area: /^13 - Spectator$/, label: "13", parking: [40.596437, 9.367404] },
  { id: "exp-galoppatoio", kml: "SS10-13", area: /^12 - Experience$/, label: "12", parking: [40.545519, 9.09484] },
  { id: "exp-quadrivio", kml: "SS14-16", area: /^14 - Experience$/, label: "14", parking: [40.814591, 8.700295] },
  { id: "exp-ebi-dozzi", kml: "SS15-17", area: /^15\s+- Experience$/, label: "15", parking: [40.7463634, 8.1611638] },
  { id: "exp-porto-palmas", kml: "SS15-17", area: /^16\s+- Experience$/, label: "16", parking: [40.7463634, 8.1611638] },
];

// Scheda ufficiale (pagina della mappa zone spettatori) per prova.
const MAP_PAGES = { sd: 1, ps1: 2, "ps-tula": 3, "ps-filigosu": 4, "ps-alalerno": 5, "ps-lernoala": 6, "ps-coiluna": 7, "ps-solorche": 8, "ps-osilo": 9, "ps-argentiera": 10 };

function parseKml(file) {
  const s = fs.readFileSync(file, "utf8");
  const items = [];
  for (const fm of s.matchAll(/<Folder>\s*<name>([\s\S]*?)<\/name>([\s\S]*?)<\/Folder>/g)) {
    const folder = fm[1];
    for (const pm of fm[2].matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)) {
      const p = pm[1];
      const name = (p.match(/<name>([\s\S]*?)<\/name>/)?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const coords = (tag) =>
        (p.match(new RegExp(`<${tag}>[\\s\\S]*?<coordinates>([\\s\\S]*?)</coordinates>`))?.[1] ?? "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((c) => {
            const [lng, lat] = c.split(",").map(Number);
            return [lat, lng];
          });
      if (p.includes("<Polygon>")) items.push({ folder, name, type: "poly", pts: coords("outerBoundaryIs") });
      else if (p.includes("<LineString>")) items.push({ folder, name, type: "line", pts: coords("LineString") });
      else if (p.includes("<Point>")) items.push({ folder, name, type: "point", pts: coords("Point") });
    }
  }
  return items;
}

// Web Mercator
const TILE = 256;
const project = (lat, lng, z) => {
  const n = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return [x, y];
};

function tile(z, x, y) {
  const f = path.join(TILE_CACHE, `${z}-${x}-${y}.jpg`);
  if (!fs.existsSync(f)) {
    execFileSync("curl", ["-s", "-f", "-m", "30", "-o", f, `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`]);
  }
  return f;
}

async function satellite(center, z) {
  const [cx, cy] = project(center[0], center[1], z);
  const left = cx - W / 2;
  const top = cy - H / 2;
  const tx0 = Math.floor(left / TILE);
  const ty0 = Math.floor(top / TILE);
  const tx1 = Math.floor((left + W) / TILE);
  const ty1 = Math.floor((top + H) / TILE);
  const comps = [];
  for (let tx = tx0; tx <= tx1; tx++)
    for (let ty = ty0; ty <= ty1; ty++) comps.push({ input: tile(z, tx, ty), left: (tx - tx0) * TILE, top: (ty - ty0) * TILE });
  const canvasW = (tx1 - tx0 + 1) * TILE;
  const canvasH = (ty1 - ty0 + 1) * TILE;
  const big = await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: "#222" } })
    .composite(comps)
    .png()
    .toBuffer();
  const offX = Math.round(left - tx0 * TILE);
  const offY = Math.round(top - ty0 * TILE);
  const img = await sharp(big).extract({ left: offX, top: offY, width: W, height: H }).toBuffer();
  const toPx = (lat, lng) => {
    const [x, y] = project(lat, lng, z);
    return [x - left, y - top];
  };
  return { img, toPx };
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function overlay(items, cfg, toPx) {
  const pts = (arr) => arr.map(([la, ln]) => toPx(la, ln).map((v) => v.toFixed(1)).join(",")).join(" ");
  let svg = "";
  // Prova
  for (const it of items.filter((i) => i.type === "line" && /km/i.test(i.name) && !/Route/i.test(i.name) && i.pts.length > 20)) {
    svg += `<polyline points="${pts(it.pts)}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="11" stroke-linejoin="round"/>`;
    svg += `<polyline points="${pts(it.pts)}" fill="none" stroke="#ff3b1f" stroke-width="6" stroke-linejoin="round"/>`;
  }
  // Aree
  for (const it of items.filter((i) => i.type === "poly" && i.folder === "Areas")) {
    const exp = /Experience/i.test(it.name);
    const spec = /Spectator/i.test(it.name);
    if (!exp && !spec) continue;
    const mine = cfg.area.test(it.name);
    const color = exp ? "#2f7bff" : "#ffd60a";
    svg += `<polygon points="${pts(it.pts)}" fill="${color}" fill-opacity="${mine ? 0.55 : 0.28}" stroke="${mine ? "#fff" : color}" stroke-width="${mine ? 4 : 2}"/>`;
  }
  // Parcheggi ufficiali (punti)
  for (const it of items.filter((i) => i.type === "point" && i.folder === "Parking" && /Parking/i.test(i.name))) {
    const [x, y] = toPx(...it.pts[0]);
    if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
    svg += `<g><rect x="${x - 13}" y="${y - 13}" width="26" height="26" rx="5" fill="#ffd60a" stroke="#000" stroke-width="2"/><text x="${x}" y="${y + 7}" font-size="19" font-weight="800" text-anchor="middle" font-family="Arial, sans-serif">P</text></g>`;
  }
  // Parcheggio scelto
  if (cfg.parking) {
    const [x, y] = toPx(...cfg.parking);
    svg += `<g><rect x="${x - 20}" y="${y - 20}" width="40" height="40" rx="8" fill="#ffd60a" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y + 10}" font-size="28" font-weight="900" text-anchor="middle" font-family="Arial, sans-serif">P</text></g>`;
  }
  // Etichetta area
  const area = items.find((i) => i.type === "poly" && cfg.area.test(i.name));
  if (area) {
    const c = area.pts.reduce((a, p) => [a[0] + p[0] / area.pts.length, a[1] + p[1] / area.pts.length], [0, 0]);
    const [x, y] = toPx(c[0], c[1]);
    svg += `<g><circle cx="${x}" cy="${y}" r="24" fill="#2f7bff" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y + 9}" font-size="25" font-weight="900" fill="#fff" text-anchor="middle" font-family="Arial, sans-serif">${esc(cfg.label)}</text></g>`;
  }
  svg += `<rect x="0" y="${H - 26}" width="${W}" height="26" fill="#000" fill-opacity=".6"/><text x="${W - 10}" y="${H - 8}" font-size="15" fill="#fff" text-anchor="end" font-family="Arial, sans-serif">Immagini © Esri, Maxar, Earthstar Geographics · Dati: mappe ufficiali Rally Italia Sardegna 2026</text>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`);
}

// Zoom massimo che fa stare area e parcheggio nell'immagine con margine.
function fit(points) {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const center = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  for (let z = 18; z >= 13; z--) {
    const xy = points.map(([a, b]) => project(a, b, z));
    const w = Math.max(...xy.map((p) => p[0])) - Math.min(...xy.map((p) => p[0]));
    const h = Math.max(...xy.map((p) => p[1])) - Math.min(...xy.map((p) => p[1]));
    if (w < W * 0.7 && h < H * 0.7) return { center, z };
  }
  return { center, z: 13 };
}

for (const cfg of AREAS) {
  const items = parseKml(path.join(KML_DIR, `${cfg.kml}.kml`));
  const area = items.find((i) => i.type === "poly" && cfg.area.test(i.name));
  if (!area) throw new Error(`Area non trovata: ${cfg.id}`);
  const { center, z } = fit([...area.pts, ...(cfg.parking ? [cfg.parking] : [])]);
  const { img, toPx } = await satellite(center, Math.min(z, 18));
  await sharp(img)
    .composite([{ input: overlay(items, cfg, toPx) }])
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(OUT, `${cfg.id}.jpg`));
  console.log("ok", cfg.id, "z", z);
}

// Schede ufficiali (opzionale): cartella con zones-p1.png … zones-p10.png
const pagesDir = process.argv[2];
if (pagesDir) {
  for (const [stage, page] of Object.entries(MAP_PAGES)) {
    const src = path.join(pagesDir, `zones-p${page}.png`);
    if (!fs.existsSync(src)) continue;
    await sharp(src).resize({ width: 1200 }).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(OUT, `map-${stage}.jpg`));
    console.log("ok scheda", stage);
  }
}
