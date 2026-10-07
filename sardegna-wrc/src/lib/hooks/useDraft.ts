"use client";

import { useCallback, useState } from "react";

/** Copia modificabile di un oggetto per i form di modifica. */
export function useDraft<T extends object>(initial: T) {
  const [draft, setDraft] = useState<T>(() => structuredClone(initial));
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((d) => {
      const next = { ...d };
      if (value === undefined || (value as unknown) === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);
  return [draft, set, setDraft] as const;
}
