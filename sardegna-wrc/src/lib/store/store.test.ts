import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSeed } from "../seed";

describe("migrazione dati salvati", () => {
  beforeEach(() => vi.resetModules());

  it("aggiorna i giorni del traghetto e conserva il resto", async () => {
    const old = { ...createSeed(), version: 1 };
    old.places = old.places.filter((p) => p.id !== "pl-servicepark");
    old.stages = [
      ...old.stages.filter((x) => x.id !== "ps1"),
      { id: "ps3", number: 3, name: "Esempio", date: "2026-10-02", firstCar: "09:12", passes: [], seen: false },
    ];
    old.spectatorPoints = [{ id: "sp-micky", stageId: "ps-filigosu", name: "vecchio", photoIds: [] }];
    old.events = old.events.map((e) =>
      e.date === "2026-09-29" ? { ...e, time: "20:00", title: "vecchio" } : e.date === "2026-10-05" ? { ...e, done: true } : e,
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
    expect(s.version).toBe(8);
    expect(s.events.some((e) => e.title === "vecchio")).toBe(false);
    expect(s.events.find((e) => e.title === "Partenza Moby Livorno → Olbia")?.time).toBe("22:00");
    expect(s.events.filter((e) => e.date === "2026-10-05").every((e) => e.done)).toBe(true);
    expect(s.places.some((p) => p.id === "pl-servicepark")).toBe(true);
    expect(s.stages.some((x) => x.id === "ps1")).toBe(true);
    expect(s.stages.some((x) => x.id === "ps3")).toBe(false);
    expect(s.spectatorPoints.some((x) => x.id === "exp-ala-arena")).toBe(true);
    expect(s.spectatorPoints.some((x) => x.id === "sp-micky")).toBe(false);
    vi.unstubAllGlobals();
  });
});
