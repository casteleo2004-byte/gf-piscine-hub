import type { HHMM, ISODate } from "./types";

/** Data locale in formato YYYY-MM-DD. */
export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(date: ISODate, n: number): ISODate {
  const d = parseISODate(date);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

/** "HH:MM" → minuti dalla mezzanotte. Restituisce NaN se non valido. */
export function toMinutes(t: HHMM | undefined): number {
  if (!t) return NaN;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function fromMinutes(min: number): HHMM {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

export function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Durata leggibile: 80 → "1h 20 min", 22 → "22 min". */
export function formatDuration(min: number | undefined): string {
  if (min == null || !Number.isFinite(min)) return "—";
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r} min` : `${h}h`;
}

/** Tempo relativo: "tra 15 min", "tra 1h 5 min", "10 min fa", "adesso". */
export function formatRelative(diffMin: number): string {
  const d = Math.round(diffMin);
  if (d === 0) return "adesso";
  if (d > 0) return `tra ${formatDuration(d)}`;
  return `${formatDuration(-d)} fa`;
}

const weekdayFmt = new Intl.DateTimeFormat("it-IT", { weekday: "long" });
const dayFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric" });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatWeekday = (date: ISODate) => cap(weekdayFmt.format(parseISODate(date)));
export const formatDayMonth = (date: ISODate) => dayFmt.format(parseISODate(date));
export const formatShortDay = (date: ISODate) => cap(shortFmt.format(parseISODate(date)).replace(".", ""));
export const formatLongDate = (date: ISODate) => `${formatWeekday(date)} ${formatDayMonth(date)}`;
