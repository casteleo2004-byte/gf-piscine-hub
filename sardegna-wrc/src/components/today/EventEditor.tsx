"use client";

import { useDraft } from "@/lib/hooks/useDraft";
import { EVENT_TYPES } from "@/lib/meta";
import { actions } from "@/lib/store/actions";
import type { AppData, EventType, TripEvent } from "@/lib/types";
import { EditorFooter } from "../ui/EditorFooter";
import { Chips, DateInput, NumberInput, PointInput, Select, TextArea, TextInput, TimeInput } from "../ui/fields";
import { Sheet } from "../ui/Sheet";

export function EventEditor({ event, data, onClose }: { event: TripEvent; data: AppData; onClose: () => void }) {
  const [d, set] = useDraft(event);
  const isNew = !data.events.some((e) => e.id === event.id);

  const save = () => {
    actions.saveEvent({ ...d, title: (d.title ?? "").trim() || EVENT_TYPES[d.type].label });
    onClose();
  };

  return (
    <Sheet
      title={isNew ? "Nuova attività" : "Modifica attività"}
      onClose={onClose}
      footer={
        <EditorFooter
          onSave={save}
          canSave={!!d.time}
          onDelete={
            isNew
              ? undefined
              : () => {
                  actions.deleteEvent(event.id);
                  onClose();
                }
          }
        />
      }
    >
      <div className="space-y-5">
        <TextInput label="Titolo" value={d.title} onChange={(v) => set("title", v)} autoFocus={isNew} placeholder="Es. Partenza da Alghero" />
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Orario" value={d.time} onChange={(v) => set("time", v ?? "")} />
          <TimeInput label="Partenza consigliata" value={d.departAt} onChange={(v) => set("departAt", v)} />
        </div>
        <Chips
          label="Tipo"
          value={d.type}
          onChange={(v) => set("type", v)}
          options={(Object.keys(EVENT_TYPES) as EventType[]).map((k) => ({ value: k, label: EVENT_TYPES[k].label }))}
        />

        <h3 className="pt-2 text-[19px] font-bold">Destinazione</h3>
        <Select
          label="Prova WRC collegata"
          value={d.stageId}
          onChange={(v) => set("stageId", v)}
          options={data.stages.map((s) => ({ value: s.id, label: `PS ${s.number} · ${s.name}` }))}
        />
        <Select
          label="Luogo salvato"
          value={d.placeId}
          onChange={(v) => set("placeId", v)}
          options={data.places.map((p) => ({ value: p.id, label: p.name }))}
        />
        <PointInput label="Oppure posizione specifica" value={d.point} onChange={(v) => set("point", v)} />
        <TextInput label="Indirizzo" value={d.address} onChange={(v) => set("address", v)} />

        <h3 className="pt-2 text-[19px] font-bold">Tempi e vincoli</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Auto" suffix="min" value={d.driveMinutes} onChange={(v) => set("driveMinutes", v)} />
          <NumberInput label="A piedi" suffix="min" value={d.walkMinutes} onChange={(v) => set("walkMinutes", v)} />
          <NumberInput label="Distanza" suffix="km" step={0.1} value={d.distanceKm} onChange={(v) => set("distanceKm", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Orario limite" value={d.deadline} onChange={(v) => set("deadline", v)} />
          <TimeInput label="Chiusura strada" value={d.roadClosure} onChange={(v) => set("roadClosure", v)} />
        </div>
        <TextArea label="Note" value={d.notes} onChange={(v) => set("notes", v)} />
        <DateInput label="Giorno" value={d.date} onChange={(v) => set("date", v)} />
      </div>
    </Sheet>
  );
}
