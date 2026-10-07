// Router in memoria per la demo a pagina singola (sostituisce next/navigation e next/link).
import { useSyncExternalStore } from "react";

let url = new URL("/", "https://demo.local");
const listeners = new Set<() => void>();

export function push(href: string) {
  url = new URL(href, url);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useUrl(): URL {
  return useSyncExternalStore(subscribe, () => url);
}
