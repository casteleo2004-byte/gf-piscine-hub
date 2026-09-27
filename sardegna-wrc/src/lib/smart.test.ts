import { describe, expect, it } from "vitest";
import { parsePoint } from "./geo";
import { navigationUrl } from "./maps";
import { createSeed } from "./seed";
import { activeDay, eventInfo, eventsOfDay, headline, nextEventIndex, resolveTarget, spectatorPointOf, stageTiming } from "./smart";
import type { TripEvent } from "./types";
import { toMinutes } from "./time";

const data = createSeed();
const at = (t: string) => toMinutes(t);

// Giornata tipo costruita a mano (indipendente dai dati del viaggio).
let n = 0;
const e = (time: string, title: string, type: TripEvent["type"], extra: Partial<TripEvent> = {}): TripEvent => ({
  id: `t${++n}`,
  date: "2026-10-02",
  time,
  title,
  type,
  done: false,
  ...extra,
});
const day: TripEvent[] = [
  e("05:45", "Sveglia", "sveglia"),
  e("06:15", "Partenza", "partenza", { point: { lat: 40.7, lng: 9 } }),
  e("07:40", "Parcheggio", "parcheggio"),
  e("09:12", "Prima vettura", "prova"),
  e("12:30", "Pranzo", "pasto"),
  e("18:30", "Rientro", "auto"),
  e("20:30", "Cena", "pasto"),
];

describe("nextEventIndex", () => {
  it("salta la sveglia passata e punta alla partenza", () => {
    const i = nextEventIndex(day, at("06:00"), true);
    expect(day[i].title).toBe("Partenza");
    expect(headline(day[i], eventInfo(day[i], data), at("06:00"), true).text).toBe("Partenza tra 15 min");
  });

  it("dopo il rally passa da sola alla cena", () => {
    expect(day[nextEventIndex(day, at("20:00"), true)].title).toBe("Cena");
  });

  it("le attività completate vengono saltate", () => {
    const events = day.map((x, k) => (k < 3 ? { ...x, done: true } : x));
    expect(nextEventIndex(events, at("05:00"), true)).toBe(3);
  });

  it("giorno futuro: prima attività non fatta", () => {
    expect(nextEventIndex(day, at("23:00"), false)).toBe(0);
  });

  it("fine giornata: nessuna prossima", () => {
    expect(nextEventIndex(day, at("23:50"), true)).toBe(-1);
  });

  it("attività senza orario in cima, salvo un orario vicino", () => {
    const withUntimed = [e("", "PS senza orario", "prova"), ...day];
    expect(nextEventIndex(withUntimed, at("14:00"), true)).toBe(0);
    expect(withUntimed[nextEventIndex(withUntimed, at("18:00"), true)].title).toBe("Rientro");
  });

  it("partenza in ritardo segnalata", () => {
    const h = headline(day[1], eventInfo(day[1], data), at("06:30"), true);
    expect(h.urgency).toBe("late");
  });

  it("orario mancante", () => {
    const x = e("", "PS", "prova");
    expect(headline(x, eventInfo(x, data), at("08:00"), true).text).toBe("Orario da definire");
  });
});

describe("partenza consigliata", () => {
  it("calcolata all'indietro da chiusura strada, piedi, margine e auto", () => {
    const s = {
      ...data.stages[0],
      roadClosure: "09:10",
      walkMinutes: 15,
      driveMinutes: 105,
      departAt: undefined,
    };
    expect(stageTiming(s, data).departAt).toBe("06:55");
  });
});

describe("prove 2026", () => {
  it("17 prove su 9 tratte con la Power Stage alle 14:15", () => {
    expect(data.stages).toHaveLength(9);
    const passes = data.stages.reduce((t, s) => t + 1 + s.passes.length, 0);
    expect(passes).toBe(17);
    const ps = data.stages.find((s) => s.id === "ps-argentiera")!;
    expect(ps.passes[0]).toEqual({ label: "PS 17 · Wolf Power Stage", time: "14:15" });
  });
  it("il punto più spettacolare è il principale e si naviga verso il luogo", () => {
    const st = data.stages.find((s) => s.id === "ps-filigosu")!;
    expect(spectatorPointOf(st, data)?.name).toBe("Micky's Jump");
    const ev = eventsOfDay(data, "2026-10-02").find((x) => x.stageId === "ps-filigosu")!;
    expect(resolveTarget({ ...ev, type: "spettatore" }, data)).toMatchObject({ address: "Nuraghe Lerno, Pattada", mode: "driving" });
  });
  it("nessuna coordinata inventata sui punti spettatore", () => {
    expect(data.spectatorPoints.every((p) => !p.point)).toBe(true);
  });
  it("domenica alle 13:30 la prossima è la Power Stage", () => {
    const ev = eventsOfDay(data, "2026-10-04");
    expect(ev[nextEventIndex(ev, at("13:30"), true)].title).toContain("Power Stage");
  });
});

describe("activeDay", () => {
  it("prima del viaggio mostra il primo giorno", () => {
    expect(activeDay(data, "2026-09-27")).toMatchObject({ status: "before", day: { date: "2026-09-29" } });
  });
  it("durante il viaggio mostra oggi", () => {
    expect(activeDay(data, "2026-10-03").day.date).toBe("2026-10-03");
  });
});

describe("parsePoint", () => {
  it.each([
    ["40.5580, 8.3190", 40.558],
    ["40,5580 8,3190", 40.558],
    ["https://www.google.com/maps/place/X/@40.5580,8.3190,15z", 40.558],
    ["https://maps.apple.com/?ll=40.5580,8.3190&q=X", 40.558],
    ["https://www.google.com/maps/place/X/data=!3d40.558!4d8.319", 40.558],
  ])("%s", (input, lat) => {
    expect(parsePoint(input)?.lat).toBeCloseTo(lat);
  });
  it("rifiuta testo non valido", () => {
    expect(parsePoint("Alghero")).toBeNull();
    expect(parsePoint("120.0, 8.0")).toBeNull();
  });
});

describe("navigationUrl", () => {
  const p = { lat: 40.5, lng: 8.3 };
  it("Apple Maps a piedi", () => {
    expect(navigationUrl("apple", { point: p }, "walking")).toBe("https://maps.apple.com/?daddr=40.5%2C8.3&dirflg=w");
  });
  it("Google Maps in auto", () => {
    expect(navigationUrl("google", { point: p })).toContain("destination=40.5%2C8.3&travelmode=driving");
  });
  it("nessuna destinazione", () => {
    expect(navigationUrl("google", {})).toBeNull();
  });
});

describe("traghetto", () => {
  it("andata Moby Livorno → Olbia alle 22:00 del 29/09", () => {
    const e = eventsOfDay(data, "2026-09-29").find((x) => x.title.startsWith("Partenza Moby"));
    expect(e?.time).toBe("22:00");
    expect(resolveTarget(e!, data)?.address).toBe("Stazione Marittima, Livorno");
  });
  it("ritorno Olbia → Livorno alle 22:00 del 07/10", () => {
    const e = eventsOfDay(data, "2026-10-07").find((x) => x.title.startsWith("Partenza Moby"));
    expect(e?.time).toBe("22:00");
  });
});

describe("Pass Gold", () => {
  it("giovedì 1/10 è giornata di rally con Service Park e PS 1 Ittiri", () => {
    expect(data.days.find((d) => d.date === "2026-10-01")?.kind).toBe("rally");
    const ev = eventsOfDay(data, "2026-10-01");
    expect(ev[0]).toMatchObject({ time: "08:30", address: "Lungomare Barcellona, Alghero" });
    expect(data.stages.find((s) => s.id === "ps1")).toMatchObject({ date: "2026-10-01", firstCar: "16:05" });
  });
  it("nota del pass sui quattro giorni di rally", () => {
    const withPass = data.days.filter((d) => d.notes?.includes("Pass Gold")).map((d) => d.date);
    expect(withPass).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  });
});

describe("alloggio", () => {
  it("check-in 30/09 alle 15:00 con limite 23:30 e navigazione all'indirizzo", () => {
    const e = eventsOfDay(data, "2026-09-30").find((x) => x.title === "Check-in Redroom-house")!;
    expect(e).toMatchObject({ time: "15:00", deadline: "23:30" });
    expect(resolveTarget(e, data)?.address).toBe("Via Michelangelo, 07041 Alghero");
  });
  it("check-out 07/10 entro le 10:00", () => {
    expect(eventsOfDay(data, "2026-10-07")[0]).toMatchObject({ title: "Check-out Redroom-house", deadline: "10:00" });
  });
});
