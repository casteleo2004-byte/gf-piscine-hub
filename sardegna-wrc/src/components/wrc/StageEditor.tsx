"use client";

import { Plus, X } from "lucide-react";
import { useDraft } from "@/lib/hooks/useDraft";
import { stageCode } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import type { Access, AppData, RallyStage } from "@/lib/types";
import { Button, IconButton } from "../ui/Button";
import { EditorFooter } from "../ui/EditorFooter";
import { Chips, DateInput, NumberInput, PointInput, TextArea, TextInput, TimeInput } from "../ui/fields";
import { Sheet } from "../ui/Sheet";

export function StageEditor({ stage, data, onClose }: { stage: RallyStage; data: AppData; onClose: () => void }) {
  const [d, set] = useDraft(stage);
  const isNew = !data.stages.some((s) => s.id === stage.id);
  const passes = d.passes ?? [];

  const setPass = (i: number, patch: Partial<{ label: string; time: string }>) =>
    set(
      "passes",
      passes.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    );

  return (
    <Sheet
      title={isNew ? "Nuova prova" : `Modifica ${stageCode(stage)}`}
      onClose={onClose}
      footer={
        <EditorFooter
          canSave={d.number != null}
          onSave={() => {
            actions.saveStage({ ...d, name: d.name ?? "", firstCar: d.firstCar ?? "", passes });
            onClose();
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  actions.deleteStage(stage.id);
                  onClose();
                }
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <NumberInput label="PS n°" value={d.number} onChange={(v) => set("number", v as number)} />
          <TextInput label="Nome prova" value={d.name} onChange={(v) => set("name", v)} autoFocus={isNew} />
        </div>
        <DateInput label="Data" value={d.date} onChange={(v) => set("date", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Prima vettura" value={d.firstCar} onChange={(v) => set("firstCar", v ?? "")} />
          <TimeInput label="Chiusura strada" value={d.roadClosure} onChange={(v) => set("roadClosure", v)} />
        </div>

        <div>
          <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">Altri passaggi</span>
          <div className="space-y-2">
            {passes.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="min-h-14 min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-3"
                  value={p.label}
                  placeholder="Es. PS 7 · 2° passaggio"
                  onChange={(e) => setPass(i, { label: e.target.value })}
                />
                <input
                  type="time"
                  className="tnum min-h-14 w-[120px] rounded-xl border-2 border-line bg-surface px-2"
                  value={p.time}
                  onChange={(e) => setPass(i, { time: e.target.value })}
                />
                <IconButton label="Rimuovi passaggio" onClick={() => set("passes", passes.filter((_, j) => j !== i))}>
                  <X size={22} />
                </IconButton>
              </div>
            ))}
            <Button size="md" onClick={() => set("passes", [...passes, { label: "", time: "" }])}>
              <Plus size={20} /> Aggiungi passaggio
            </Button>
          </div>
        </div>

        <h3 className="pt-2 text-[19px] font-bold">Parcheggio e tempi</h3>
        <TextInput label="Parcheggio scelto" value={d.parkingName} onChange={(v) => set("parkingName", v)} />
        <PointInput label="Posizione parcheggio" value={d.parking} onChange={(v) => set("parking", v)} />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Auto da base" suffix="min" value={d.driveMinutes} onChange={(v) => set("driveMinutes", v)} />
          <NumberInput label="A piedi" suffix="min" value={d.walkMinutes} onChange={(v) => set("walkMinutes", v)} />
          <NumberInput label="Distanza a piedi" suffix="km" step={0.1} value={d.walkKm} onChange={(v) => set("walkKm", v)} />
          <NumberInput label="Dislivello" suffix="m" value={d.elevationM} onChange={(v) => set("elevationM", v)} />
        </div>
        <TimeInput label="Partenza consigliata (vuoto = calcolata)" value={d.departAt} onChange={(v) => set("departAt", v)} />
        <Chips
          label="Difficoltà di accesso"
          value={d.access}
          onChange={(v) => set("access", v)}
          options={[
            { value: "facile" as Access, label: "Facile" },
            { value: "media" as Access, label: "Media" },
            { value: "difficile" as Access, label: "Difficile" },
          ]}
        />
        <TextArea label="Attrezzatura consigliata" value={d.gear} onChange={(v) => set("gear", v)} rows={2} />
        <TextArea label="Note personali" value={d.notes} onChange={(v) => set("notes", v)} />
      </div>
    </Sheet>
  );
}
