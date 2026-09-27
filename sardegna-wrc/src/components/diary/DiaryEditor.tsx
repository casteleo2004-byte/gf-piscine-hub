"use client";

import { Check } from "lucide-react";
import { useDraft } from "@/lib/hooks/useDraft";
import { stagesOfDay } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import { formatLongDate } from "@/lib/time";
import type { AppData, DiaryEntry, TripDay } from "@/lib/types";
import { EditorFooter } from "../ui/EditorFooter";
import { NumberInput, RatingInput, TextArea, TextInput } from "../ui/fields";
import { PhotoStrip } from "../ui/Photos";
import { Sheet } from "../ui/Sheet";

export function DiaryEditor({
  entry,
  day,
  data,
  onClose,
}: {
  entry: DiaryEntry;
  day: TripDay;
  data: AppData;
  onClose: () => void;
}) {
  const [d, set] = useDraft(entry);
  const stages = stagesOfDay(data, day.date);

  return (
    <Sheet
      title={formatLongDate(day.date)}
      onClose={onClose}
      footer={
        <EditorFooter
          onSave={() => {
            actions.saveDiary({ ...d, date: day.date });
            onClose();
          }}
        />
      }
    >
      <div className="space-y-5">
        <RatingInput label="Voto giornata" value={d.rating} onChange={(v) => set("rating", v)} />
        <TextArea label="Nota" value={d.note} onChange={(v) => set("note", v)} placeholder="Com'è andata?" />

        {stages.length > 0 && (
          <div>
            <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">Prove viste</span>
            <div className="flex flex-wrap gap-2">
              {stages.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => actions.toggleStageSeen(s.id)}
                  className={`inline-flex min-h-12 items-center gap-1.5 rounded-xl px-4 text-[17px] font-bold ${
                    s.seen ? "bg-ok text-bg" : "bg-surface-2"
                  }`}
                >
                  {s.seen && <Check size={18} strokeWidth={3} />} PS {s.number} {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <TextArea label="Luoghi visitati" value={d.places} onChange={(v) => set("places", v)} rows={2} placeholder="Uno per riga o separati da virgola" />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Km percorsi" value={d.km} onChange={(v) => set("km", v)} />
          <NumberInput label="Spesa" suffix="€" step={0.5} value={d.spend} onChange={(v) => set("spend", v)} />
        </div>
        <TextInput label="Ristorante" value={d.restaurant} onChange={(v) => set("restaurant", v)} />
        <div>
          <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">Foto preferita</span>
          <PhotoStrip
            ids={d.favoritePhotoId ? [d.favoritePhotoId] : []}
            onChange={(ids) => set("favoritePhotoId", ids[ids.length - 1])}
            editable
          />
        </div>
      </div>
    </Sheet>
  );
}
