import type { AppData } from "../types";

/**
 * Punto di estensione per la persistenza. Oggi i dati vivono solo sul
 * dispositivo (localStorage); per aggiungere Supabase basta un adapter che
 * implementi questa interfaccia (es. salva in locale e sincronizza in
 * background quando c'è rete) senza toccare la UI.
 */
export interface StorageAdapter {
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}
