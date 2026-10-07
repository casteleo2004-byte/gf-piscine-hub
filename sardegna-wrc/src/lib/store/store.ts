import { createSeed, DATA_VERSION, EXAMPLE_IDS, SEED_UPDATES } from "../seed";
import type { AppData } from "../types";
import type { StorageAdapter } from "./adapter";
import { localAdapter } from "./localAdapter";

// Store minimale: un unico oggetto AppData in memoria, salvato ad ogni
// modifica. Lettura sincrona all'avvio → la Home appare subito.

type Listener = () => void;

let adapter: StorageAdapter = localAdapter;
let state: AppData | null = null;
const listeners = new Set<Listener>();

function migrate(data: AppData): AppData {
  const seed = createSeed();
  // Aggiorna i giorni cambiati nei dati iniziali dopo il salvataggio dell'utente.
  const stale = new Set(
    Object.entries(SEED_UPDATES)
      .filter(([v]) => Number(v) > (data.version ?? 1))
      .flatMap(([, dates]) => dates),
  );
  if ((data.version ?? 1) < 5) {
    // Via le prove d'esempio: sostituite dalle prove reali 2026.
    data = {
      ...data,
      stages: data.stages.filter((x) => !EXAMPLE_IDS.stages.includes(x.id)),
      spectatorPoints: data.spectatorPoints.filter((x) => !EXAMPLE_IDS.spectatorPoints.includes(x.id)),
    };
  }
  if ((data.version ?? 1) < 30) {
    // Prove e aree dai documenti ufficiali (ultima revisione: guida alle PS per spettatori):
    // sostituiscono quelle dei dati iniziali precedenti,
    // mantenendo ciò che l'utente ha aggiunto a mano.
    const seedStages = new Set(seed.stages.map((x) => x.id));
    const seedPoints = new Set(seed.spectatorPoints.map((x) => x.id));
    data = {
      ...data,
      stages: [...seed.stages, ...data.stages.filter((x) => !seedStages.has(x.id))],
      spectatorPoints: [
        ...seed.spectatorPoints,
        ...data.spectatorPoints.filter((x) => !seedPoints.has(x.id) && !EXAMPLE_IDS.spectatorPoints.includes(x.id)),
      ],
    };
  }
  if ((data.version ?? 1) < 34) {
    // Imbarco di Olbia: indirizzo ufficiale Moby e punto del terminal, senza toccare le spunte.
    const ref = seed.events.find((e) => e.date === "2026-10-07" && e.point && e.address);
    data = {
      ...data,
      events: data.events.map((e) =>
        ref && e.date === "2026-10-07" && e.address === "Porto di Olbia" ? { ...e, address: ref.address, point: ref.point } : e,
      ),
    };
  }
  if ((data.version ?? 1) < 28) {
    // Rientri ad Alghero dopo le prove (giovedì e domenica), aggiunti senza toccare le spunte.
    const rientri = seed.events.filter((e) => e.id.startsWith("ev-rientro-"));
    data = { ...data, events: [...data.events, ...rientri.filter((r) => !data.events.some((e) => e.id === r.id))] };
  }
  if ((data.version ?? 1) < 27) {
    // Ritiro dei Pass Gold oggi: nuova attività del 30/09 e note aggiornate, senza toccare le spunte.
    const ritiro = seed.events.find((e) => e.date === "2026-09-30" && e.type === "rally");
    const sp = seed.places.find((p) => p.id === "pl-servicepark");
    const sp830 = seed.events.find((e) => e.date === "2026-10-01" && e.time === "08:30");
    data = {
      ...data,
      places: data.places.map((p) => (sp && p.id === sp.id ? { ...p, notes: sp.notes } : p)),
      events: [
        ...data.events.map((e) =>
          sp830 && e.date === "2026-10-01" && e.time === "08:30" && e.type === "rally" ? { ...e, notes: sp830.notes } : e,
        ),
        ...(ritiro && !data.events.some((e) => e.id === ritiro.id) ? [ritiro] : []),
      ],
    };
  }
  if ((data.version ?? 1) < 26) {
    // Ristoranti ad Alghero: nuovi luoghi e cena di stasera a scelta, senza rinfrescare
    // tutto il 30/09 (le spunte già messe oggi restano).
    const cena = seed.events.find((e) => e.date === "2026-09-30" && e.type === "pasto" && e.choices);
    data = {
      ...data,
      places: [...data.places, ...seed.places.filter((p) => !data.places.some((x) => x.id === p.id))],
      events: data.events.map((e) =>
        cena && e.date === "2026-09-30" && e.type === "pasto" && e.placeId === "pl-cena"
          ? { ...cena, id: e.id, done: e.done }
          : e,
      ),
    };
  }
  if ((data.version ?? 1) < 17) {
    // Luoghi di Livorno riscritti (parcheggi, cena senza pesce): si prendono dal seed.
    const fresh = new Map(seed.places.filter((p) => p.id.startsWith("pl-livorno-")).map((p) => [p.id, p]));
    data = { ...data, places: data.places.map((p) => fresh.get(p.id) ?? p) };
  }
  if (stale.size) {
    data = {
      ...data,
      events: [...data.events.filter((e) => !stale.has(e.date)), ...seed.events.filter((e) => stale.has(e.date))],
      days: data.days.map((d) => (stale.has(d.date) ? (seed.days.find((x) => x.date === d.date) ?? d) : d)),
      // Nuovi luoghi e prove dei dati iniziali (per id), senza toccare quelli esistenti.
      places: [...data.places, ...seed.places.filter((p) => !data.places.some((x) => x.id === p.id))],
      stages: [...data.stages, ...seed.stages.filter((p) => !data.stages.some((x) => x.id === p.id))],
      spectatorPoints: [
        ...data.spectatorPoints,
        ...seed.spectatorPoints.filter((p) => !data.spectatorPoints.some((x) => x.id === p.id)),
      ],
      gearPresets: [
        ...data.gearPresets.map((g) => {
          const items = g.items.map((i) => (i.name === "Pass WRC" ? { ...i, name: "Pass Gold RIS Experience (2)" } : i));
          // Oggetti nuovi dei dati iniziali, aggiunti senza toccare quelli esistenti.
          const extra = (seed.gearPresets.find((x) => x.id === g.id)?.items ?? []).filter(
            (i) => !items.some((x) => x.name === i.name),
          );
          return { ...g, items: [...items, ...extra] };
        }),
        // Checklist nuove dei dati iniziali (es. "Spesa rally").
        ...seed.gearPresets.filter((g) => !data.gearPresets.some((x) => x.id === g.id)),
      ],
    };
  }
  // Id delle attività sempre unici: con la vecchia numerazione (ev1, ev2, …) i rinfreschi
  // di un giorno potevano riusare id di altri giorni e la spunta finiva sull'attività sbagliata.
  const seen = new Set<string>();
  data = {
    ...data,
    events: data.events.map((e, i) => {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        return e;
      }
      const id = `${e.id}-${e.date}-${i}`;
      seen.add(id);
      return { ...e, id };
    }),
  };
  // Stesso controllo per gli oggetti delle checklist (quelli aggiunti dal seed nelle
  // migrazioni possono avere lo stesso id di oggetti già presenti).
  data = {
    ...data,
    gearPresets: data.gearPresets.map((g) => {
      const ids = new Set<string>();
      return {
        ...g,
        items: g.items.map((it, i) => {
          const id = ids.has(it.id) ? `${it.id}-${i}` : it.id;
          ids.add(id);
          return id === it.id ? it : { ...it, id };
        }),
      };
    }),
  };
  // Completa eventuali campi aggiunti in versioni successive.
  return {
    ...seed,
    ...data,
    settings: { ...seed.settings, ...data.settings },
    trip: { ...seed.trip, ...data.trip },
    version: DATA_VERSION,
  };
}

export function getState(): AppData {
  if (!state) {
    const loaded = typeof window === "undefined" ? null : adapter.load();
    state = loaded ? migrate(loaded) : createSeed();
    if (!loaded && typeof window !== "undefined") adapter.save(state);
  }
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn();
}

/** Applica una modifica su una copia dei dati e salva. */
export function update(recipe: (draft: AppData) => void): void {
  const draft = structuredClone(getState());
  recipe(draft);
  state = draft;
  adapter.save(draft);
  emit();
}

export function replaceAll(data: AppData): void {
  state = migrate(data);
  adapter.save(state);
  emit();
}

export function resetToSeed(): void {
  state = createSeed();
  adapter.save(state);
  emit();
}

export function setAdapter(next: StorageAdapter): void {
  adapter = next;
  state = null;
  emit();
}

// Sincronizza più schede/finestre aperte sullo stesso dispositivo.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "wrc-hub:data") {
      state = null;
      emit();
    }
  });
}
