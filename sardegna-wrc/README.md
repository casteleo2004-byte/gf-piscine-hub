# Sardegna WRC Trip Hub

PWA mobile-first per il viaggio in Sardegna (29/09 – 07/10/2026, base Alghero) legato al WRC.
Pensata per iPhone: si apre direttamente su **Oggi**, funziona offline e non richiede login.

## Sezioni

| Sezione | A cosa serve |
|---|---|
| **Oggi** | Prossima tappa con countdown ("Partenza tra 15 min"), NAVIGA, timeline del giorno (tap sul cerchio = fatto), cambio giorno |
| **WRC** | Prove speciali: prima vettura, partenza consigliata (calcolata se non inserita), auto/piedi, chiusura strada, NAVIGA AL PARCHEGGIO, punto spettatore con foto, checklist |
| **Mappa** | Luoghi salvati + parcheggi e punti spettatore, filtri, distanza dalla base o "vicino a me", aggiunta rapida con GPS |
| **Gear** | Checklist per tipo di giornata (Rally, Rally pioggia, Turismo, Foto/Video, Serata): tap sulla riga, reset, aggiungi/rimuovi |
| **Diario** | Nota, voto, km, spesa, ristorante, foto preferita; riepilogo "SARDEGNA 2026" |

Tutto è modificabile dall'app (icona matita). Impostazioni (icona in alto a destra su Oggi):
Apple Mappe / Google Maps, tema "Sole" ad alto contrasto, margine sulla partenza, base, backup JSON.

> Le prove WRC, gli orari e le coordinate iniziali sono **esempi**: vanno aggiornati con il programma
> ufficiale direttamente dall'app. Date del viaggio e base sono quelle definitive.

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:3000 (senza service worker)
npm test           # test logica smart / coordinate / link mappe
npm run build      # export statico in out/ + generazione out/sw.js
npm start          # serve out/ per provare PWA e offline
```

## Deploy

Export statico (`out/`): qualsiasi hosting statico HTTPS va bene.
Su Vercel: nuovo progetto da questo repository con **Root Directory = `sardegna-wrc`**
(build `npm run build`, output `out`). L'app va servita alla radice di un dominio/sottodominio
(es. `wrc.gfpiscine.com`).

Installazione su iPhone: apri il sito in Safari → Condividi → **Aggiungi alla schermata Home**.
Alla prima apertura il service worker salva tutta l'app: da lì funziona anche senza rete.

## Architettura

```
src/
  app/                 pagine (Oggi, wrc, mappa, gear, diario) + layout PWA
  components/          UI per sezione + ui/ (pulsanti, campi, sheet, foto)
  lib/
    types.ts           modelli: Trip, TripDay, TripEvent, RallyStage, SpectatorPoint,
                       Place, GearPreset, GearItem, DiaryEntry, Settings
    seed.ts            dati iniziali del viaggio
    smart.ts           logica Home: prossima attività, partenza consigliata, destinazioni
    store/             store locale (localStorage) dietro l'interfaccia StorageAdapter
    photos.ts          foto/screenshot in IndexedDB (ridimensionate)
    maps.ts            link di navigazione Apple Maps / Google Maps
scripts/build-sw.mjs   genera il service worker con il precache di tutti i file
```

I dati restano sul telefono (localStorage + IndexedDB per le foto). Per aggiungere Supabase in futuro
basta implementare `StorageAdapter` (`src/lib/store/adapter.ts`) senza toccare la UI.
