"use client";

import { useEffect, useState } from "react";
import { countPhotos } from "@/lib/photos";
import { daysBetween } from "@/lib/time";
import type { AppData } from "@/lib/types";

const splitList = (s?: string) =>
  (s ?? "")
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Riepilogo "SARDEGNA 2026" calcolato da diario, prove viste e luoghi. */
export function Summary({ data }: { data: AppData }) {
  const [photos, setPhotos] = useState<number | null>(null);
  useEffect(() => {
    countPhotos().then(setPhotos).catch(() => setPhotos(null));
  }, [data]);

  const days = daysBetween(data.trip.startDate, data.trip.endDate) + 1;
  const km = data.diary.reduce((t, e) => t + (e.km ?? 0), 0);
  const spend = data.diary.reduce((t, e) => t + (e.spend ?? 0), 0);
  const stages = data.stages.filter((s) => s.seen).length;
  const placeNames = new Set([
    ...data.places.filter((p) => p.visited).map((p) => p.name.toLowerCase()),
    ...data.diary.flatMap((e) => splitList(e.places).map((x) => x.toLowerCase())),
  ]);
  const restaurants = new Set([
    ...data.places.filter((p) => p.visited && p.category === "ristorante").map((p) => p.name.toLowerCase()),
    ...data.diary.flatMap((e) => splitList(e.restaurant).map((x) => x.toLowerCase())),
  ]);
  const ratings = data.diary.map((e) => e.rating).filter((r): r is number => !!r);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const stats: [string, string][] = [
    ["Giorni viaggio", String(days)],
    ["Km percorsi", km ? km.toLocaleString("it-IT") : "—"],
    ["Prove WRC viste", String(stages)],
    ["Luoghi visitati", String(placeNames.size)],
    ["Ristoranti", String(restaurants.size)],
    ["Foto salvate", photos == null ? "—" : String(photos)],
    ["Spesa", spend ? `${spend.toLocaleString("it-IT")} €` : "—"],
    ["Voto medio", avg ? `${avg.toFixed(1).replace(".", ",")} ★` : "—"],
  ];

  return (
    <section className="rounded-3xl border-2 border-rally bg-surface p-5">
      <h2 className="text-[26px] font-extrabold tracking-wide">{data.trip.name.toUpperCase()}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[14px] font-bold uppercase tracking-wide text-muted">{k}</dt>
            <dd className="tnum text-[30px] font-extrabold leading-tight">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
