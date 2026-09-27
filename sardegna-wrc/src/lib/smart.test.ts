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

describe("prove 2026 (timetable ufficiale V5.1)", () => {
  it("shakedown + 17 prove speciali, Power Stage alle 14:15", () => {
    const ps = data.stages.filter((s) => s.number > 0);
    expect(ps.reduce((t, s) => t + 1 + s.passes.length, 0)).toBe(17);
    expect(data.stages.find((s) => s.id === "sd")).toMatchObject({ firstCar: "09:01", roadClosure: "06:00" });
    const arg = data.stages.find((s) => s.id === "ps-argentiera")!;
    expect(arg).toMatchObject({ firstCar: "10:05", roadClosure: "07:05" });
    expect(arg.passes[0]).toMatchObject({ label: "SS 17 · Wolf Power Stage", time: "14:15" });
  });
  it("orari dei passaggi come nel timetable", () => {
    const times = (d: string) => eventsOfDay(data, d).filter((e) => e.type === "prova").map((e) => e.time);
    expect(times("2026-10-02")).toEqual(["08:01", "09:01", "10:08", "14:31", "15:31", "16:38"]);
    expect(times("2026-10-03")).toEqual(["08:01", "09:11", "10:07", "14:31", "15:41", "16:37"]);
    expect(times("2026-10-04")).toEqual(["08:31", "10:05", "11:38", "14:15"]);
  });
  it("l'area Experience (Pass Gold) viene prima di una zona pubblico più WOW", () => {
    const st = data.stages.find((s) => s.id === "ps-coiluna")!;
    expect(spectatorPointOf(st, data)?.id).toBe("exp-budduso-arena");
  });
  it("NAVIGA dalla prova porta in auto all'Access Point ufficiale dell'area Gold", () => {
    const ev = eventsOfDay(data, "2026-10-02").find((x) => x.stageId === "ps-alalerno")!;
    expect(resolveTarget(ev, data)).toMatchObject({ point: { lat: 40.64873143094596, lng: 9.325989460877631 }, mode: "driving" });
  });
  it("nessuna coordinata inventata: le aree hanno solo Access Point ufficiali", () => {
    const official = new Set([
      "40.65178190753158,8.37644763855414", "40.79245974800601,8.941877463967668", "40.72751145540492,8.983330894154273",
      "40.79732777557003,8.972336269232184", "40.72157726858769,9.11652993606414", "40.64873143094596,9.325989460877631",
      "40.59673881468081,9.26669915829633", "40.58489772463757,9.242178693420435", "40.57065014718563,9.26940463215951",
      "40.64658431790494,9.324898123397684", "40.57164889280999,9.410081421503556", "40.56182559978122,9.083966853227492",
      "40.47387565711158,9.047585020643766", "40.81558864188334,8.742239797232767", "40.86468610938521,8.712213331312736",
      "40.81683533851673,8.626820580349746", "40.74863649450717,8.188445362031837",
    ]);
    for (const p of data.spectatorPoints) {
      expect(p.point).toBeUndefined();
      if (p.access) expect(official.has(`${p.access.lat},${p.access.lng}`)).toBe(true);
    }
    for (const s of data.stages) if (s.parking) expect(official.has(`${s.parking.lat},${s.parking.lng}`)).toBe(true);
  });
  it("domenica dopo pranzo la prossima è la Power Stage", () => {
    const ev = eventsOfDay(data, "2026-10-04");
    expect(ev[nextEventIndex(ev, at("13:45"), true)].title).toContain("Power Stage");
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
    expect(ev.find((x) => x.title.startsWith("Service Park"))).toMatchObject({ time: "08:30", address: "Lungomare Barcellona, Alghero" });
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

describe("aree Pass Gold", () => {
  it("un punto aggiunto a mano e marcato Gold scavalca le zone pubblico", () => {
    const st = data.stages.find((s) => s.id === "ps-filigosu")!;
    const mine = { id: "mio", stageId: "ps-filigosu", name: "Mio", photoIds: [], experienceArea: true, wow: 2 };
    expect(spectatorPointOf(st, { ...data, spectatorPoints: [...data.spectatorPoints, mine] })?.id).toBe("mio");
  });
});

describe("percorso parcheggio → punto", () => {
  it("link a piedi con partenza dal parcheggio", () => {
    const url = navigationUrl("google", { point: { lat: 40.6, lng: 9.1 } }, "walking", { lat: 40.59, lng: 9.12 });
    expect(url).toContain("origin=40.59%2C9.12");
    expect(url).toContain("travelmode=walking");
    expect(navigationUrl("apple", { point: { lat: 40.6, lng: 9.1 } }, "walking", { lat: 40.59, lng: 9.12 })).toContain("saddr=40.59%2C9.12");
  });
});

describe("piano del giorno (primo rally)", () => {
  const fri = eventsOfDay(data, "2026-10-02");
  it("venerdì alle 04:00 la prossima è la partenza per l'Alà Arena, non una prova fuori piano", () => {
    const e = fri[nextEventIndex(fri, at("04:00"), true)];
    expect(e.title).toBe("Partenza da Alghero verso Alà Arena");
    expect(e.time).toMatch(/^0[3-5]:\d{2}$/);
  });
  it("le prove fuori piano sono facoltative e non diventano mai la prossima", () => {
    expect(fri.filter((e) => e.optional).map((e) => e.stageId)).toEqual(["ps-tula", "ps-filigosu", "ps-tula", "ps-filigosu"]);
    for (const t of ["05:30", "08:00", "14:00", "15:00"]) expect(fri[nextEventIndex(fri, at(t), true)].optional).toBeFalsy();
  });
  it("la partenza segue la chiusura strade e il margine", () => {
    const d2 = { ...data, settings: { ...data.settings, bufferMinutes: 30 } };
    const a = eventsOfDay(data, "2026-10-02").find((e) => e.type === "partenza")!.time;
    const b = eventsOfDay(d2, "2026-10-02").find((e) => e.type === "partenza")!.time;
    expect(toMinutes(a) - toMinutes(b)).toBeGreaterThanOrEqual(10);
  });
});

describe("prova sul mare", () => {
  it("domenica il punto principale dell'Argentiera è Ebi Dozzi, area Gold sul mare", () => {
    const st = data.stages.find((s) => s.id === "ps-argentiera")!;
    expect(spectatorPointOf(st, data)).toMatchObject({ id: "exp-ebi-dozzi", experienceArea: true });
    expect(data.days.find((d) => d.date === "2026-10-04")?.planStageIds).toEqual(["ps-argentiera"]);
  });
});
