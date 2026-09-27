"use client";

import { Check, ChevronDown, Pencil } from "lucide-react";
import { useState } from "react";
import { EVENT_TYPES, toneText } from "@/lib/meta";
import { eventInfo, spectatorPointOf } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import { formatDuration } from "@/lib/time";
import type { AppData, TripEvent } from "@/lib/types";
import { IconButton } from "../ui/Button";
import { ImageView } from "../ui/ImageView";
import { NavButton } from "../ui/NavButton";

/** Timeline verticale della giornata. Tap sul cerchio = fatto; tap sulla riga = dettagli. */
export function Timeline({
  data,
  events,
  nextIdx,
  onEdit,
}: {
  data: AppData;
  events: TripEvent[];
  nextIdx: number;
  onEdit: (e: TripEvent) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  if (!events.length) return null;

  const rows = events.map((e, i) => ({ e, i }));
  const main = rows.filter(({ e }) => !e.optional);
  const others = rows.filter(({ e }) => e.optional);

  const renderRow = ({ e, i }: { e: TripEvent; i: number }) => {
    const isNext = i === nextIdx;
    const past = !e.done && !e.optional && nextIdx >= 0 && i < nextIdx;
    const meta = EVENT_TYPES[e.type];
    const expanded = open === e.id;
    return (
      <li
        key={e.id}
        className={`border-b border-line last:border-b-0 ${isNext ? "bg-accent/10 shadow-[inset_6px_0_0_var(--accent)]" : ""}`}
      >
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setOpen(expanded ? null : e.id)}
            className="flex min-h-[68px] min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
          >
            <span
              className={`tnum w-[62px] shrink-0 text-[21px] font-extrabold ${
                e.done || past ? "text-muted line-through decoration-2" : isNext ? "text-hi" : "text-text"
              }`}
            >
              {e.time || "?"}
            </span>
            <span className="min-w-0 flex-1">
              {isNext && <span className="block text-[13px] font-extrabold uppercase tracking-wider text-hi">Prossima</span>}
              <span className={`block text-[19px] font-bold leading-snug ${e.done ? "text-muted line-through" : ""}`}>
                {e.title}
              </span>
              <span className={`flex items-center gap-1 text-[15px] font-semibold ${toneText[meta.tone]}`}>
                <meta.Icon size={16} /> {meta.label}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={e.done ? "Segna da fare" : "Segna fatto"}
            aria-pressed={e.done}
            onClick={() => actions.toggleEventDone(e.id)}
            className="flex w-[72px] shrink-0 items-center justify-center"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] ${
                e.done ? "border-ok bg-ok text-bg" : "border-line text-transparent"
              }`}
            >
              <Check size={26} strokeWidth={3.5} />
            </span>
          </button>
        </div>
        {expanded && <EventDetails data={data} event={e} onEdit={() => onEdit(e)} />}
      </li>
    );
  };

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">Il programma di oggi</h2>
      {main.length > 0 && <ol className="overflow-hidden rounded-3xl bg-surface">{main.map(renderRow)}</ol>}

      {others.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowOthers(!showOthers)}
            className="flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 border-line px-4 text-left text-[17px] font-bold text-muted"
          >
            <span>
              Altro in programma oggi ({others.length})
              <span className="block text-[14px] font-semibold">Prove ed eventi fuori dal vostro piano</span>
            </span>
            <ChevronDown size={22} className={showOthers ? "rotate-180" : ""} />
          </button>
          {showOthers && <ol className="mt-2 overflow-hidden rounded-3xl bg-surface opacity-90">{others.map(renderRow)}</ol>}
        </div>
      )}
    </section>
  );
}

function EventDetails({ data, event, onEdit }: { data: AppData; event: TripEvent; onEdit: () => void }) {
  const info = eventInfo(event, data);
  const view = info.stage ? spectatorPointOf(info.stage, data) : undefined;
  const facts = [
    info.departAt && `Partenza ${info.departAt}`,
    info.driveMinutes != null && `Auto ${formatDuration(info.driveMinutes)}`,
    info.walkMinutes != null && `A piedi ${formatDuration(info.walkMinutes)}`,
    info.deadline && `Limite ${info.deadline}`,
    info.roadClosure && `Chiusura ${info.roadClosure}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-3 px-4 pb-4">
      {facts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {facts.map((f) => (
            <span key={f} className="tnum rounded-lg bg-surface-2 px-2.5 py-1 text-[16px] font-semibold">
              {f}
            </span>
          ))}
        </div>
      )}
      {info.target && <p className="text-[17px] font-semibold text-muted">→ {info.target.label}</p>}
      {view?.image && <ImageView src={view.image} alt={`Vista dall'alto: ${view.name}`} caption="La vostra visuale · tocca per ingrandire" />}
      {event.notes && <p className="whitespace-pre-line text-[17px]">{event.notes}</p>}
      <div className="flex gap-3">
        {info.target && (
          <NavButton
            size="lg"
            className="flex-1"
            point={info.target.point}
            address={info.target.address}
            label={info.target.label}
            mode={info.target.mode}
          />
        )}
        <IconButton label="Modifica" onClick={onEdit} className="h-14 w-14">
          <Pencil size={22} />
        </IconButton>
      </div>
    </div>
  );
}
