import { describe, expect, it } from "vitest";
import { parsePoint } from "./geo";
import { navigationUrl } from "./maps";
import { createSeed } from "./seed";
import { activeDay, eventInfo, eventsOfDay, headline, nextEventIndex, stageTiming } from "./smart";
import { toMinutes } from "./time";

const data = createSeed();
const rally = eventsOfDay(data, "2026-10-02");
const at = (t: string) => toMinutes(t);

describe("nextEventIndex", () => {
  it("salta la sveglia passata e punta alla partenza", () => {
    const i = nextEventIndex(rally, at("06:00"), true);
    expect(rally[i].type).toBe("partenza");
    const info = eventInfo(rally[i], data);
    expect(headline(rally[i], info, at("06:00"), true).text).toBe("Partenza tra 15 min");
  });

  it("dopo il rally passa da sola alla cena", () => {
    const i = nextEventIndex(rally, at("20:00"), true);
    expect(rally[i].title).toBe("Cena");
  });

  it("le attività completate vengono saltate", () => {
    const events = rally.map((e, k) => (k < 3 ? { ...e, done: true } : e));
    const i = nextEventIndex(events, at("05:00"), true);
    expect(i).toBe(3);
  });

  it("giorno futuro: prima attività non fatta", () => {
    expect(nextEventIndex(rally, at("23:00"), false)).toBe(0);
  });

  it("fine giornata: nessuna prossima", () => {
    expect(nextEventIndex(rally, at("23:50"), true)).toBe(-1);
  });
});

describe("partenza", () => {
  it("partenza in ritardo segnalata", () => {
    const e = rally.find((x) => x.type === "partenza")!;
    const h = headline(e, eventInfo(e, data), at("06:30"), true);
    expect(h.urgency).toBe("late");
  });

  it("partenza consigliata calcolata all'indietro", () => {
    const s = { ...data.stages[1], departAt: undefined }; // chiusura 09:10, piedi 15, auto 105, margine 15
    expect(stageTiming(s, data).departAt).toBe("06:55");
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
