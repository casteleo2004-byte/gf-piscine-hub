# Sardegna WRC Trip Hub — istruzioni per Claude Code

PWA mobile-first (Next.js 16 export statico, TypeScript, Tailwind 4) per un viaggio in Sardegna
dal 29/09 al 07/10/2026 con base ad Alghero, legato al WRC Rally Italia Sardegna 2026 (1–4 ottobre).
Uso reale: iPhone 16 Pro Max, all'aperto, con una mano, spesso senza rete.
Lo stato del lavoro e le cose in sospeso sono in **HANDOFF.md**: leggilo prima di iniziare.

## Regole del proprietario (non negoziabili)
- **Niente allucinazioni.** Orari, coordinate, luoghi e servizi entrano solo da fonti verificabili
  (biglietti, prenotazioni, documenti ufficiali del rally). Ciò che non è noto resta vuoto
  o è marcato "da verificare"/"stima". Mai inventare coordinate.
- **Il repository è pubblico**: nel codice niente nomi, targa, codici di prenotazione, seriali
  o sigilli dei biglietti. Quei dati li inserisce l'utente dall'app (restano sul telefono).
- **Chi usa l'app è al primo rally**: linguaggio semplice, niente gergo non spiegato,
  un piano chiaro al giorno. Le aree **Pass Gold (RIS Experience)** hanno la priorità.
- Mobile-first, pochi tocchi: NAVIGA sempre visibile, bottom nav a 5 sezioni
  (Oggi, WRC, Mappa, Gear, Diario), niente login, popup, onboarding o impostazioni inutili.
- L'app usa **sempre data e ora reali del dispositivo** (anche la demo: niente orologi simulati).
- Prima di aggiungere una funzione: rende più semplice la vacanza o solo l'app più complessa?

## Comandi
```bash
npm install
npm run dev        # sviluppo (senza service worker)
npm test           # vitest: logica smart, dati ufficiali, migrazioni, link mappe
npm run typecheck
npm run build      # export statico in out/ + out/sw.js (precache completo, offline)
npm run demo       # build + demo/dist/index.html (app intera in un file, per l'Artifact)
```
Dopo ogni modifica: `npx tsc --noEmit && npx vitest run`, poi `npm run demo` e ripubblica la demo
(Artifact https://claude.ai/artifact/CZ2M8bG2pQURm9jtJGf5AV, stesso file `demo/dist/index.html`).

## Architettura
- `src/lib/types.ts` modelli · `src/lib/seed.ts` dati iniziali (solo fonti verificate, con commenti sulla fonte)
- `src/lib/smart.ts` logica Home: prossima attività, partenza consigliata (da chiusura strade − piedi −
  margine − auto), piano del giorno, destinazioni NAVIGA, "cosa fare adesso"
- `src/lib/store/` store su localStorage dietro `StorageAdapter` (predisposto per Supabase);
  `store.ts` contiene le **migrazioni**
- `src/lib/photos.ts` foto in IndexedDB · `src/lib/maps.ts` link Apple Maps / Google Maps
- `src/components/*` UI per sezione; `ui/` primitivi (Button, NavButton, Sheet, fields, Photos)
- `scripts/build-sw.mjs` + `sw-template.js` service worker · `demo/` build a file singolo con shim di next/link e next/navigation

## Cambiare i dati iniziali
Chi ha già aperto l'app ha i dati salvati in locale. Quando modifichi `seed.ts`:
1. incrementa `DATA_VERSION`;
2. aggiungi in `SEED_UPDATES` le date i cui eventi/giorni vanno rinfrescati;
3. per prove/aree/checklist aggiorna la migrazione in `src/lib/store/store.ts` (oggi: `version < 20`
   sostituisce prove e punti spettatore con quelli del seed, tenendo quelli aggiunti dall'utente);
4. aggiorna i test in `src/lib/store/store.test.ts`.
