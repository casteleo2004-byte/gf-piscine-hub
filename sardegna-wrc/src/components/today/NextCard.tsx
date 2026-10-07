"use client";

import { AlertTriangle, Info, ListChecks, Moon, Shuffle } from "lucide-react";
import { useState } from "react";
import { ChoiceSheet } from "./ChoiceSheet";
import { EVENT_TYPES, toneText } from "@/lib/meta";
import { eventInfo, headline, spectatorPointOf, whatToDo } from "@/lib/smart";
import { formatDuration } from "@/lib/time";
import { formatKm } from "@/lib/geo";
import type { AppData, TripDay, TripEvent } from "@/lib/types";
import { buttonClass } from "../ui/Button";
import { ImageView } from "../ui/ImageView";
import { NavButton } from "../ui/NavButton";
import { Stat } from "../ui/Stat";

const urgencyCls = {
  calm: "text-text",
  soon: "text-hi",
  now: "text-hi",
  late: "text-danger",
};

/** La card principale: cosa fare adesso e dove andare. */
export function NextCard({
  data,
  event,
  day,
  nowMin,
  isToday,
  dayOver,
  tomorrowFirst,
  onDetails,
}: {
  data: AppData;
  event: TripEvent | null;
  day: TripDay;
  nowMin: number;
  isToday: boolean;
  dayOver: boolean;
  tomorrowFirst?: TripEvent;
  onDetails: (e: TripEvent) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  if (!event) {
    return (
      <section className="rounded-3xl bg-surface p-5">
        <div className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-wider text-muted">
          <Moon size={20} /> {dayOver ? "Giornata conclusa" : "Nessuna attività"}
        </div>
        {tomorrowFirst ? (
          <p className="mt-2 text-[22px] font-bold">
            Domani: <span className="tnum text-hi">{tomorrowFirst.time}</span> {tomorrowFirst.title}
          </p>
        ) : (
          <p className="mt-2 text-[20px] font-semibold text-muted">Aggiungi un&apos;attività qui sotto.</p>
        )}
      </section>
    );
  }

  const info = eventInfo(event, data);
  const h = headline(event, info, nowMin, isToday);
  const hint = whatToDo(event, info);
  const view = info.stage ? spectatorPointOf(info.stage, data) : undefined;
  const meta = EVENT_TYPES[event.type];
  const presetId = day.gearPresetId;

  return (
    <section className={`rounded-3xl border-2 bg-surface p-5 ${h.urgency === "late" ? "border-danger" : "border-accent"}`}>
      <div className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-hi">Prossima tappa</div>
      <div className={`mt-1 text-[30px] font-extrabold leading-tight ${urgencyCls[h.urgency]}`}>{h.text}</div>

      <h3 className="mt-3 text-[26px] font-bold leading-tight">{event.title}</h3>
      <div className={`mt-1 flex items-center gap-1.5 text-[17px] font-semibold ${toneText[meta.tone]}`}>
        <meta.Icon size={20} className="shrink-0" /> <span className="shrink-0">{meta.label}</span>
      </div>
      {info.target && info.target.label !== event.title && (
        <div className="mt-0.5 text-[16px] font-semibold text-muted">→ {info.target.label}</div>
      )}
      {(event.choices?.length ?? 0) > 1 && (
        <button type="button" onClick={() => setChoosing(true)} className={buttonClass("secondary", "md", "mt-3 w-full")}>
          <Shuffle size={20} /> Cambia meta ({event.choices!.length} opzioni)
        </button>
      )}
      {choosing && <ChoiceSheet event={event} data={data} onClose={() => setChoosing(false)} />}
      {hint && <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2.5 text-[17px] font-semibold leading-snug">{hint}</p>}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {event.time && <Stat label="Orario" value={event.time} />}
        {info.departAt && info.departAt !== event.time && <Stat label="Partenza" value={info.departAt} tone="accent" />}
        {info.driveMinutes != null && (
          <Stat label="Auto" value={formatDuration(info.driveMinutes)} hint={info.driveEstimated ? "≈" : undefined} />
        )}
        {info.distanceKm != null && (
          <Stat label="Distanza" value={formatKm(info.distanceKm)} hint={info.distanceEstimated ? "≈" : undefined} />
        )}
        {info.walkMinutes != null && <Stat label="A piedi" value={formatDuration(info.walkMinutes)} />}
        {info.deadline && <Stat label="Orario limite" value={info.deadline} tone="warn" />}
      </div>

      {info.roadClosure && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rally/15 px-3 py-2.5 text-[18px] font-bold text-rally">
          <AlertTriangle size={22} /> Strade chiuse dalle {info.roadClosure}
        </div>
      )}

      {info.target && (
        <NavButton
          className="mt-5 w-full"
          point={info.target.point}
          address={info.target.address}
          label={info.target.label}
          mode={info.target.mode}
          via={info.target.via}
        >
          {info.target.mode === "walking" ? "NAVIGA A PIEDI" : "NAVIGA"}
        </NavButton>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <a href={presetId ? `/gear/?p=${presetId}` : "/gear/"} className={buttonClass("secondary", "lg")}>
          <ListChecks size={22} /> Checklist
        </a>
        <button type="button" className={buttonClass("secondary", "lg")} onClick={() => onDetails(event)}>
          <Info size={22} /> Dettagli
        </button>
      </div>
      {view?.image && (
        <ImageView className="mt-4" src={view.image} alt={`Vista dall'alto: ${view.name}`} caption={`La vostra visuale · ${view.name}`} />
      )}
    </section>
  );
}
