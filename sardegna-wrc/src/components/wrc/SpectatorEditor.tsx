"use client";

import { useDraft } from "@/lib/hooks/useDraft";
import { actions } from "@/lib/store/actions";
import type { AppData, SpectatorPoint } from "@/lib/types";
import { EditorFooter } from "../ui/EditorFooter";
import { Chips, NumberInput, PointInput, RatingInput, TextArea, TextInput } from "../ui/fields";
import { PhotoStrip } from "../ui/Photos";
import { Sheet } from "../ui/Sheet";

export function SpectatorEditor({ point, data, onClose }: { point: SpectatorPoint; data: AppData; onClose: () => void }) {
  const [d, set] = useDraft(point);
  const isNew = !data.spectatorPoints.some((p) => p.id === point.id);

  return (
    <Sheet
      title={isNew ? "Nuovo punto spettatore" : "Modifica punto"}
      onClose={onClose}
      footer={
        <EditorFooter
          onSave={() => {
            actions.saveSpectatorPoint({ ...d, name: d.name ?? "", photoIds: d.photoIds ?? [] });
            onClose();
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  actions.deleteSpectatorPoint(point.id);
                  onClose();
                }
          }
        />
      }
    >
      <div className="space-y-5">
        <TextInput label="Nome" value={d.name} onChange={(v) => set("name", v)} autoFocus={isNew} placeholder="Es. Curva sx dopo dosso" />
        <PointInput label="Posizione" value={d.point} onChange={(v) => set("point", v)} />
        <Chips
          label="Area RIS Experience (Pass Gold)"
          value={d.experienceArea ? "si" : "no"}
          onChange={(v) => set("experienceArea", v === "si" ? true : undefined)}
          options={[
            { value: "si", label: "Sì" },
            { value: "no", label: "No" },
          ]}
        />
        <TextArea
          label="Descrizione"
          value={d.description}
          onChange={(v) => set("description", v)}
          placeholder="Curva a sinistra dopo dosso. Visuale buona anche 50 metri prima…"
        />
        <div>
          <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">Foto e screenshot</span>
          <PhotoStrip ids={d.photoIds ?? []} onChange={(ids) => set("photoIds", ids)} />
        </div>
        <TextInput label="Posizione consigliata" value={d.position} onChange={(v) => set("position", v)} />
        <TextInput label="Tipo di curva" value={d.cornerType} onChange={(v) => set("cornerType", v)} />
        <RatingInput label="Visibilità" value={d.visibility} onChange={(v) => set("visibility", v)} />
        <RatingInput label="Sicurezza" value={d.safety} onChange={(v) => set("safety", v)} />
        <NumberInput label="Distanza dalla strada" suffix="m" value={d.roadDistanceM} onChange={(v) => set("roadDistanceM", v)} />
        <TextArea label="Attrezzatura fotografica" value={d.photoGear} onChange={(v) => set("photoGear", v)} rows={2} />
        <TextArea label="Note" value={d.notes} onChange={(v) => set("notes", v)} />
      </div>
    </Sheet>
  );
}
