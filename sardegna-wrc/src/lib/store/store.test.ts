import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSeed } from "../seed";

describe("migrazione dati salvati", () => {
  beforeEach(() => vi.resetModules());

  it("aggiorna i giorni del traghetto e conserva il resto", async () => {
    const old = { ...createSeed(), version: 1 };
    old.places = old.places.filter((p) => p.id !== "pl-servicepark");
    old.gearPresets = old.gearPresets.filter((g) => g.id !== "spesa");
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
    expect(s.version).toBe(32);
    expect(s.gearPresets.some((g) => g.id === "spesa")).toBe(true);
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

  it("id delle attività sempre unici: spuntare una riga non tocca un altro giorno", async () => {
    // Dati salvati con la vecchia numerazione (ev1, ev2, …): il 30/09 aveva id che
    // dopo i rinfreschi del 29/09 venivano riusati per nuove attività di quel giorno.
    const old = { ...createSeed(), version: 16 };
    old.events = old.events.map((e, i) => ({ ...e, id: `ev${i + 1}` }));
    old.events.find((e) => e.date === "2026-09-30")!.id = "ev1";
    old.places = old.places.filter((p) => p.id !== "pl-cajo");
    old.events = old.events.filter((e) => !e.title.startsWith("Ritiro Pass Gold") && !e.id.startsWith("ev-rientro-"));
    old.events = old.events.map((e) =>
      e.date === "2026-09-30" && e.type === "pasto" && e.choices
        ? { ...e, time: "20:30", title: "Cena", placeId: "pl-cena", choices: undefined, notes: undefined }
        : e,
    );
    const stored: Record<string, string> = { "wrc-hub:data": JSON.stringify(old) };
    vi.stubGlobal("window", { addEventListener: () => {} });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => stored[k] ?? null,
      setItem: (k: string, v: string) => (stored[k] = v),
      removeItem: (k: string) => delete stored[k],
    });
    const { getState } = await import("./store");
    const { actions } = await import("./actions");
    const ids = getState().events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const wed = getState().events.find((e) => e.date === "2026-09-30")!;
    actions.toggleEventDone(wed.id);
    expect(getState().events.find((e) => e.id === wed.id)?.done).toBe(true);
    expect(getState().events.filter((e) => e.done)).toHaveLength(1);
    const cena = getState().events.find((e) => e.date === "2026-09-30" && e.type === "pasto" && e.choices);
    expect(cena).toMatchObject({ time: "19:30", placeId: "pl-samesa" });
    expect(getState().places.some((p) => p.id === "pl-cajo")).toBe(true);
    expect(getState().events.filter((e) => e.title.startsWith("Ritiro Pass Gold"))).toHaveLength(1);
    expect(getState().events.filter((e) => e.id.startsWith("ev-rientro-"))).toHaveLength(3);
    for (const g of getState().gearPresets) expect(new Set(g.items.map((x) => x.id)).size).toBe(g.items.length);
    vi.unstubAllGlobals();
  });
});
