import { createSeed, DATA_VERSION } from "../seed";
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
