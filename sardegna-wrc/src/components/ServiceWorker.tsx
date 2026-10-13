"use client";

import { useEffect } from "react";
import { useData } from "@/lib/store/hooks";

/** Registra il service worker (offline) e applica il tema scelto. */
export function ServiceWorker() {
  const data = useData();
  const theme = data?.settings.theme;

  useEffect(() => {
    if (theme === "sun") document.documentElement.dataset.theme = "sun";
    else delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "sun" ? "#ffffff" : "#000000");
  }, [theme]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    // Chiede al browser di non cancellare i dati locali.
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}
