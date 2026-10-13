"use client";

import { useSyncExternalStore } from "react";
import type { AppData } from "../types";
import { getState, subscribe } from "./store";

const getServerSnapshot = () => null;

/** Dati dell'app; null solo durante il pre-render statico. */
export function useData(): AppData | null {
  return useSyncExternalStore(subscribe, getState, getServerSnapshot);
}
