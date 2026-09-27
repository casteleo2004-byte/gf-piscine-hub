"use client";

import { Pencil, Plus, Settings2, Ticket } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/lib/hooks/useNow";
import { newId } from "@/lib/id";
import { activeDay, eventsOfDay, nextEventIndex } from "@/lib/smart";
import { useData } from "@/lib/store/hooks";
import { daysBetween, formatDayMonth, formatLongDate, formatWeekday, nowMinutes, toISODate } from "@/lib/time";
import type { TripEvent } from "@/lib/types";
import { Button, IconButton } from "../ui/Button";
import { OnlineBadge } from "../ui/OnlineBadge";
import { DayEditor } from "./DayEditor";
import { DayStrip } from "./DayStrip";
import { EventEditor } from "./EventEditor";
import { NextCard } from "./NextCard";
import { SettingsSheet } from "./SettingsSheet";
import { Timeline } from "./Timeline";
import { RallyGuide, RallyGuideButton } from "../wrc/RallyGuide";

export function TodayScreen() {
  const data = useData();
  const now = useNow();
  const [picked, setPicked] = useState<string | null>(null);
  const [editing, setEditing] = useState<TripEvent | null>(null);
  const [dayEdit, setDayEdit] = useState(false);
  const [settings, setSettings] = useState(false);
  const [guide, setGuide] = useState(false);

  if (!data || !now) return <div className="h-[60vh]" aria-busy />;

  const today = toISODate(now);
  const { day: autoDay, status } = activeDay(data, today);
  const day = data.days.find((d) => d.date === picked) ?? autoDay;
  const isToday = day.date === today;
  const events = eventsOfDay(data, day.date);
  const nowMin = nowMinutes(now);
  const nextIdx = day.date < today ? -1 : nextEventIndex(events, nowMin, isToday);
  const tomorrow = data.days.find((d) => d.date > day.date);
  const tomorrowFirst = tomorrow ? eventsOfDay(data, tomorrow.date)[0] : undefined;

  const newEvent = (): TripEvent => ({
    id: newId("ev"),
    date: day.date,
    time: "",
    title: "",
    type: "altro",
    done: false,
  });

  return (
    <div>
      <header className="flex items-start gap-2 pb-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[32px] font-extrabold leading-tight">{formatWeekday(today)}</h1>
            <OnlineBadge />
          </div>
          <div className="text-[19px] font-semibold text-muted">
            {formatDayMonth(today)} · {status === "during" ? autoDay.location : status === "before" ? "prima della partenza" : "viaggio concluso"}
          </div>
        </div>
        <IconButton label="Impostazioni" onClick={() => setSettings(true)}>
          <Settings2 size={24} />
        </IconButton>
      </header>

      <DayStrip days={data.days} selected={day.date} today={today} onSelect={(d) => setPicked(d === autoDay.date ? null : d)} />

      {status === "before" && !picked && (
        <p className="mb-3 rounded-2xl bg-surface px-4 py-3 text-[18px] font-semibold">
          Partenza tra <span className="text-hi">{daysBetween(today, data.trip.startDate)} giorni</span>: ecco il
          primo giorno.
        </p>
      )}
      {!isToday && (picked || status !== "before") && (
        <button
          type="button"
          onClick={() => setPicked(null)}
          className="mb-3 w-full rounded-2xl border-2 border-line px-4 py-3 text-left text-[17px] font-semibold text-muted"
        >
          Stai guardando un altro giorno · <span className="text-hi">torna a oggi</span>
        </button>
      )}

      <div className="mb-4 flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-[21px] font-bold">
          {!isToday && <span className="block text-[16px] font-bold uppercase tracking-wide text-hi">{formatLongDate(day.date)}</span>}
          {day.title}
        </h2>
        <IconButton label="Modifica giornata" onClick={() => setDayEdit(true)}>
          <Pencil size={20} />
        </IconButton>
      </div>

      {day.notes && (
        <p className="mb-4 flex gap-2 whitespace-pre-line rounded-2xl border-2 border-line px-4 py-3 text-[17px] font-semibold">
          <Ticket size={22} className="mt-0.5 shrink-0 text-hi" />
          <span>{day.notes}</span>
        </p>
      )}

      <NextCard
        data={data}
        event={nextIdx >= 0 ? events[nextIdx] : null}
        day={day}
        nowMin={nowMin}
        isToday={isToday}
        dayOver={events.length > 0 && nextIdx < 0}
        tomorrowFirst={tomorrowFirst}
        onDetails={(e) => setEditing(e)}
      />

      {day.kind === "rally" && (
        <div className="mt-4">
          <RallyGuideButton onClick={() => setGuide(true)} />
        </div>
      )}

      <Timeline data={data} events={events} nextIdx={nextIdx} onEdit={setEditing} />

      <Button variant="ghost" size="lg" className="mt-4 w-full" onClick={() => setEditing(newEvent())}>
        <Plus size={24} /> Aggiungi attività
      </Button>

      {editing && <EventEditor event={editing} data={data} onClose={() => setEditing(null)} />}
      {dayEdit && <DayEditor day={day} data={data} onClose={() => setDayEdit(false)} />}
      {guide && <RallyGuide onClose={() => setGuide(false)} />}
      {settings && <SettingsSheet data={data} onClose={() => setSettings(false)} />}
    </div>
  );
}
