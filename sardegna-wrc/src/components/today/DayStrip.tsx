"use client";

import { useEffect, useRef } from "react";
import { formatShortDay } from "@/lib/time";
import type { TripDay } from "@/lib/types";

/** Riga di giorni scorrevole: un tocco per vedere un altro giorno. */
export function DayStrip({
  days,
  selected,
  today,
  onSelect,
}: {
  days: TripDay[];
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);

  return (
    <div ref={ref} className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
      {[...days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => {
          const on = d.date === selected;
          const isToday = d.date === today;
          return (
            <button
              key={d.date}
              type="button"
              data-selected={on}
              onClick={() => onSelect(d.date)}
              className={`tnum min-h-12 shrink-0 rounded-xl px-3.5 text-[16px] font-bold ${
                on ? "bg-text text-bg" : "bg-surface text-text"
              } ${d.kind === "rally" && !on ? "border-b-4 border-rally" : ""}`}
            >
              {isToday ? "Oggi" : formatShortDay(d.date)}
            </button>
          );
        })}
    </div>
  );
}
