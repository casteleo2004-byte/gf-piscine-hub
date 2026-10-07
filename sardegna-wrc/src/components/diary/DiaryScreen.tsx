"use client";

import { ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/lib/hooks/useNow";
import { useData } from "@/lib/store/hooks";
import { formatLongDate, toISODate } from "@/lib/time";
import type { DiaryEntry } from "@/lib/types";
import { PageHeader } from "../ui/PageHeader";
import { PhotoThumb } from "../ui/Photos";
import { DiaryEditor } from "./DiaryEditor";
import { Summary } from "./Summary";

export function DiaryScreen() {
  const data = useData();
  const now = useNow();
  const [editing, setEditing] = useState<string | null>(null);
  if (!data || !now) return <div className="h-[60vh]" aria-busy />;

  const today = toISODate(now);
  const days = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  const entry = (date: string): DiaryEntry => data.diary.find((e) => e.date === date) ?? { date };
  const editingDay = days.find((d) => d.date === editing);

  return (
    <div>
      <PageHeader title="Diario" subtitle="Facoltativo: due righe a fine giornata." />

      <ul className="space-y-3">
        {days.map((d) => {
          const e = entry(d.date);
          const filled = !!(e.note || e.km || e.restaurant || e.rating || e.places || e.favoritePhotoId);
          return (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => setEditing(d.date)}
                className={`flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left ${
                  d.date === today ? "ring-2 ring-accent" : ""
                }`}
              >
                {e.favoritePhotoId && <PhotoThumb id={e.favoritePhotoId} className="pointer-events-none h-16 w-16 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold uppercase tracking-wide text-muted">{formatLongDate(d.date)}</div>
                  <div className="text-[19px] font-bold leading-snug">{d.title}</div>
                  {filled ? (
                    <div className="mt-0.5 flex items-center gap-2 truncate text-[16px] font-semibold text-muted">
                      {e.rating && (
                        <span className="inline-flex items-center gap-0.5 text-hi">
                          <Star size={16} className="fill-accent" /> {e.rating}
                        </span>
                      )}
                      {e.km ? <span className="tnum">{e.km} km</span> : null}
                      {e.note && <span className="truncate">{e.note}</span>}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[16px] font-semibold text-muted/70">Tocca per scrivere</div>
                  )}
                </div>
                <ChevronRight className="shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <Summary data={data} />
      </div>

      {editingDay && <DiaryEditor entry={entry(editingDay.date)} day={editingDay} data={data} onClose={() => setEditing(null)} />}
    </div>
  );
}
