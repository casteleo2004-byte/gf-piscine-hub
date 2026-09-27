import type { AppData } from "../types";
import type { StorageAdapter } from "./adapter";

const KEY = "wrc-hub:data";

export const localAdapter: StorageAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Quota piena o storage bloccato: l'app continua a funzionare in memoria.
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  },
};
