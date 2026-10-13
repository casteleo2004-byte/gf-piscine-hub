// Genera out/sw.js dopo `next build`: precache di TUTTI i file dell'export
// statico (pagine, JS, CSS, icone, payload di navigazione) così l'app
// funziona interamente offline dopo la prima apertura.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
})(OUT);

const hash = crypto.createHash("sha256");
const urls = new Set();
for (const file of files.sort()) {
  const rel = "/" + path.relative(OUT, file).split(path.sep).join("/");
  if (rel === "/sw.js" || rel.endsWith(".map") || rel.startsWith("/404") || rel.startsWith("/_not-found")) continue;
  hash.update(rel).update(fs.readFileSync(file));
  if (rel.endsWith("/index.html")) urls.add(rel.slice(0, -"index.html".length));
  else urls.add(rel);
}

const version = hash.digest("hex").slice(0, 12);
const template = fs.readFileSync(path.resolve("scripts/sw-template.js"), "utf8");
const sw = template
  .replace("__VERSION__", version)
  .replace("__PRECACHE__", JSON.stringify([...urls].sort(), null, 0));
fs.writeFileSync(path.join(OUT, "sw.js"), sw);
console.log(`sw.js: ${urls.size} file in precache, versione ${version}`);
