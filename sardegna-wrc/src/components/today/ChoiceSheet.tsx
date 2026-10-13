"use client";

import { Check } from "lucide-react";
import { PLACE_CATEGORIES, toneText } from "@/lib/meta";
import { actions } from "@/lib/store/actions";
import type { AppData, TripEvent } from "@/lib/types";
import { Sheet } from "../ui/Sheet";

/** Scelta rapida della meta di un'attività tra le opzioni proposte. */
export function ChoiceSheet({ event, data, onClose }: { event: TripEvent; data: AppData; onClose: () => void }) {
  const options = (event.choices ?? [])
    .map((id) => data.places.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Sheet title={`${event.time} · Dove andiamo?`} onClose={onClose}>
      <ul className="space-y-3">
        {options.map((p) => {
          const meta = PLACE_CATEGORIES[p.category];
          const chosen = p.id === event.placeId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  actions.chooseEventPlace(event.id, p.id);
                  onClose();
                }}
                className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ${chosen ? "border-2 border-accent bg-surface" : "bg-surface"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-wide ${toneText[meta.tone]}`}>
                    <meta.Icon size={16} /> {meta.label}
                  </span>
                  <span className="mt-0.5 block text-[20px] font-bold leading-snug">{p.name}</span>
                  {p.notes && <span className="mt-1 block text-[16px] leading-snug text-muted">{p.notes}</span>}
                </span>
                <span
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] ${
                    chosen ? "border-accent bg-accent text-accent-ink" : "border-line text-transparent"
                  }`}
                >
                  <Check size={20} strokeWidth={3.5} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
