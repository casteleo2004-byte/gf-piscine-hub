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
      gearPresets: data.gearPresets.map((g) => ({
        ...g,
        items: g.items.map((i) => (i.name === "Pass WRC" ? { ...i, name: "Pass Gold RIS Experience (2)" } : i)),
      })),
    };
  }
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
