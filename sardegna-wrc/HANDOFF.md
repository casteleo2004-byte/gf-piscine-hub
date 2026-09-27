# Passaggio di consegne · Sardegna WRC Trip Hub

Aggiornato al 27/09/2026. Branch: `claude/sardegna-wrc-trip-hub-mpoh1o` (repo `casteleo2004-byte/gf-piscine-hub`,
app nella cartella `sardegna-wrc/`). Demo privata: https://claude.ai/artifact/CZ2M8bG2pQURm9jtJGf5AV
Leggi anche `CLAUDE.md` (regole e comandi).

## Messaggio da incollare in una nuova sessione
> Riprendi l'app Sardegna WRC Trip Hub nel repo casteleo2004-byte/gf-piscine-hub, branch
> claude/sardegna-wrc-trip-hub-mpoh1o, cartella sardegna-wrc. Leggi sardegna-wrc/CLAUDE.md e
> sardegna-wrc/HANDOFF.md, lancia i test, poi continua dalle "Cose da fare". Ripubblica la demo
> aggiornando l'Artifact https://claude.ai/artifact/CZ2M8bG2pQURm9jtJGf5AV.

## Cosa è fatto
- PWA completa e offline: Oggi (prossima tappa con NAVIGA, timeline, piano del giorno), WRC (prove,
  "Dove guardare", aree Pass Gold, guida "Primo rally? Come funziona"), Mappa (luoghi + ingressi,
  aggiunta rapida con GPS), Gear (checklist per tipo di giornata), Diario (+ riepilogo SARDEGNA 2026),
  Impostazioni (Apple/Google Maps, tema "Sole", margine partenza, base, backup JSON).
- Demo Artifact che usa ora e data reali del telefono (nessun orologio simulato: richiesta esplicita).
- 39 test verdi. Dati alla versione 9 con migrazioni.

## Dati del viaggio (verificati, non sensibili)
| Cosa | Dato | Fonte |
|---|---|---|
| Andata | Moby Livorno (Stazione Marittima) → Olbia, mar 29/09 **22:00**, cabina doppia interna C2, 2 adulti, auto | biglietto |
| Ritorno | Moby Olbia → Livorno, mer 07/10 **22:00**, arrivo 8/10 mattina | biglietto |
| Da verificare | sbarco a Olbia ~07:00; check-in con auto ~90 min prima (limite 20:30) | siti di viaggio |
| Alloggio | Redroom-house, Via Michelangelo, 07041 Alghero; 30/09–07/10; check-in 15:00–23:30, check-out 08:00–10:00 | prenotazione (numero civico non noto) |
| Pass Gold RIS Experience | uno a testa per 1, 2, 3, 4 ottobre; sede stampata "Service Park Alghero, Lungomare Barcellona", ore 08:30 | biglietti |
| Pass Gold include | accesso alle Aree Experience (punti più spettacolari delle prove) + Welcome Box con T-shirt | sito ufficiale |

Dati personali (nomi, targa, codici prenotazione, seriali/sigilli dei pass) **non** vanno nel repo.

## Rally: fonti ufficiali già integrate in `src/lib/seed.ts`
- **Timetable ufficiale V5.1 (14/09/2026)**: shakedown Monte Baranta (Olmedo) 09:01 (strade chiuse 06:00);
  SSS1 Ittiri Arena 16:05; ven SS2/5 Tula–Erula 08:01/14:31, SS3/6 Su Filigosu–Lerno 09:01/15:31,
  SS4/7 Monti di Alà–Sa Conchedda–Lerno 10:08/16:38; sab SS8/11 Lerno–Sa Conchedda–Monti di Alà 08:01/14:31,
  SS9/12 Coiluna–Loelle 09:11/15:41, SS10/13 Solorchè 10:07/16:37; dom SS14/16 Osilo–Tergu 08:31/11:38,
  SS15 Sassari–Argentiera 10:05, SS17 Wolf Power Stage 14:15; arrivo Alghero 15:15, podio 17:00.
  Le strade chiudono 3 ore prima della prima auto.
- **Mappa zone spettatori 2026** (10 schede): aree Experience del Pass Gold (cerchi blu 1–16), zone
  pubblico (cerchi gialli), parcheggio verde "EXP/MEDIA/ORG", parcheggi spettatori, Access Point con
  coordinate esatte (usati come destinazione di NAVIGA ALL'INGRESSO).
- Incongruenze note: SS13 16:07 sulla mappa vs 16:37 nel timetable (usato il timetable);
  Ittiri 2,08 km sulla mappa vs 2,21 nel timetable.
- Correzione importante: nel 2026 **Su Filigosu non ha aree Experience**; i salti sono ad Alà Arena
  (Exp 7–8, con Water Splash), Lerno Jump (Exp 9) e Galoppatoio di Pattada (Exp 12–13).

## Piano proposto (modificabile dall'app, "Aggiungi al piano del giorno")
- Gio 1: shakedown (Exp 1–2, Olmedo) + Ittiri Arena (Exp 3), partenza per Ittiri suggerita 14:45
- Ven 2: Alà Arena (Exp 7–8), 10:08 e 16:38, strade chiuse 07:08
- Sab 3: Galoppatoio di Pattada (Exp 12–13), 10:07 e 16:37, strade chiuse 07:07 (alternativa Lerno Jump, Exp 9)
- Dom 4: Argentiera sul mare, **Exp 15 Ebi Dozzi = punto principale** (richiesta: prova sulla costa con
  sfondo mare), 10:05 e Power Stage 14:15, strade chiuse 07:05; poi podio ad Alghero 17:00

## Cose da fare
1. ~~Coordinate esatte~~ **Fatto (v9)**: dalle 10 mappe interattive ufficiali (Google My Maps, KML
   `https://www.google.com/maps/d/kml?mid=<ID>&forcekml=1`) sono inseriti aree Experience, zone pubblico e parcheggi
   (spettatori o "Parking Media" = P verde Experience dove la scheda PDF lo mostra). ID mappe:
   SD `1clSd0wgOU7mXw9b2YMD8qcgwvb40zMs`, SSS1 `1uOTQcsX27L4iuAO4KGlQN0IdSFDNA9I`, SS2/5 `1jUiJq_h1eQzvw_Nq-9Ex-wxLyNmzdTE`,
   SS3/6 `1L6rc9nVcTGvZ-5Qe4wX_JUsXWIfZ0Eg`, SS4/7 `1TfT6Znc1kTndpB774gtyWCAJFltbDzA`, SS8/11 `1aeZ039KRKmFkicOF0ZRL0M1pukbXG6s`,
   SS9/12 `1dVDHo8oiVt9sdYno2CIsNLDm9StNanY`, SS10/13 `1ywLWmiaqTGrJy1D3rOdqITWQNqm6QCY`, SS14/16 `1-UgCL8n1O6kso_L11HZcApgH0UtluEY`,
   SS15/17 `1g55gXtiUH4qmUn9LNWVy6vqOP6c0SCs`. Le mappe contengono anche le linee dei percorsi di accesso
   (non ancora usate) e i "Disability Point". Da verificare sul posto quale parcheggio è riservato al Pass Gold.
2. Tempi a piedi parcheggio → area: c'è solo la distanza in linea d'aria (calcolata dalle coordinate ufficiali).
3. Dove si ritira la Welcome Box del Pass Gold.
4. Ristoranti prenotati e altri piani di turismo (oggi 30/09 e 5–6/10 contengono suggerimenti, non prenotazioni).
5. Verificare orario di sbarco a Olbia e limite check-in Moby.
6. Deploy: Vercel con Root Directory `sardegna-wrc` (build `npm run build`, output `out`), su un sottodominio
   alla radice (es. wrc.gfpiscine.com); poi, se richiesto, link nella pagina hub `index.html` alla radice del repo.
7. Eventuali correzioni alle checklist dell'attrezzatura.
