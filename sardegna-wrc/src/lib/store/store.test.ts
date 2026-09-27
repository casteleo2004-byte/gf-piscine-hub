import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSeed } from "../seed";

describe("migrazione dati salvati", () => {
  beforeEach(() => vi.resetModules());

  it("aggiorna i giorni del traghetto e conserva il resto", async () => {
    const old = { ...createSeed(), version: 1 };
    old.events = old.events.map((e) =>
      e.date === "2026-09-29" ? { ...e, time: "20:00", title: "vecchio" } : e.date === "2026-10-02" ? { ...e, done: true } : e,
    );
    const stored: Record<string, string> = { "wrc-hub:data": JSON.stringify(old) };
    vi.stubGlobal("window", { addEventListener: () => {} });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => stored[k] ?? null,
      setItem: (k: string, v: string) => (stored[k] = v),
      removeItem: (k: string) => delete stored[k],
    });
    const { getState } = await import("./store");
    const s = getState();
    expect(s.version).toBe(2);
    expect(s.events.some((e) => e.title === "vecchio")).toBe(false);
    expect(s.events.find((e) => e.title === "Partenza Moby Livorno → Olbia")?.time).toBe("22:00");
    expect(s.events.filter((e) => e.date === "2026-10-02").every((e) => e.done)).toBe(true);
    vi.unstubAllGlobals();
  });
});
