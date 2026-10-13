"use client";

import { RotateCcw } from "lucide-react";
import { useDraft } from "@/lib/hooks/useDraft";
import { actions } from "@/lib/store/actions";
import type { AppData, DayKind, TripDay } from "@/lib/types";
import { Button } from "../ui/Button";
import { EditorFooter } from "../ui/EditorFooter";
import { Chips, TextArea, TextInput } from "../ui/fields";
import { Sheet } from "../ui/Sheet";

const KINDS: { value: DayKind; label: string }[] = [
  { value: "rally", label: "Rally" },
  { value: "turismo", label: "Turismo" },
  { value: "viaggio", label: "Viaggio" },
  { value: "misto", label: "Misto" },
];

export function DayEditor({ day, data, onClose }: { day: TripDay; data: AppData; onClose: () => void }) {
  const [d, set] = useDraft(day);
  return (
    <Sheet
      title="Modifica giornata"
      onClose={onClose}
      footer={
        <EditorFooter
          onSave={() => {
            actions.saveDay({ ...d, title: d.title ?? "", location: d.location ?? "" });
            onClose();
          }}
        />
      }
    >
      <div className="space-y-5">
        <TextInput label="Titolo" value={d.title} onChange={(v) => set("title", v)} />
        <TextInput label="Luogo / base" value={d.location} onChange={(v) => set("location", v)} />
        <Chips label="Tipo di giornata" value={d.kind} onChange={(v) => set("kind", v)} options={KINDS} />
        <Chips
          label="Checklist del giorno"
          value={d.gearPresetId}
          onChange={(v) => set("gearPresetId", v)}
          options={data.gearPresets.map((p) => ({ value: p.id, label: p.name }))}
        />
        <TextArea label="Note" value={d.notes} onChange={(v) => set("notes", v)} />
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => {
            if (confirm("Segnare tutte le attività di questo giorno come da fare?")) {
              actions.resetDay(day.date);
              onClose();
            }
          }}
        >
          <RotateCcw size={22} /> Azzera attività completate
        </Button>
      </div>
    </Sheet>
  );
}
