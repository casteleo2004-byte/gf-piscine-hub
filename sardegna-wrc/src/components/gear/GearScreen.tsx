"use client";

import { Check, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { actions } from "@/lib/store/actions";
import { useData } from "@/lib/store/hooks";
import { Button, IconButton } from "../ui/Button";
import { PageHeader } from "../ui/PageHeader";

/** Checklist per tipo di giornata: tap sulla riga = spuntato. */
export function GearScreen() {
  const data = useData();
  const params = useSearchParams();
  const [chosen, setChosen] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [newItem, setNewItem] = useState("");

  if (!data) return <div className="h-[60vh]" aria-busy />;

  const presetId = chosen ?? params.get("p") ?? data.gearPresets[0]?.id;
  const preset = data.gearPresets.find((p) => p.id === presetId) ?? data.gearPresets[0];
  if (!preset) return null;
  const done = preset.items.filter((i) => i.checked).length;
  const total = preset.items.length;
  const complete = total > 0 && done === total;

  function add() {
    const name = newItem.trim();
    if (!name) return;
    actions.addGear(preset.id, name);
    setNewItem("");
  }

  return (
    <div>
      <PageHeader
        title="Gear"
        subtitle={
          <span className={complete ? "font-bold text-ok" : ""}>
            {complete ? "Tutto pronto ✓" : `${done} / ${total} pronti`}
          </span>
        }
        right={
          <IconButton label={edit ? "Fine modifica" : "Modifica lista"} onClick={() => setEdit(!edit)} className={edit ? "!bg-accent !text-accent-ink" : ""}>
            {edit ? <Check size={22} strokeWidth={3} /> : <Pencil size={20} />}
          </IconButton>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {data.gearPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setChosen(p.id)}
            className={`min-h-12 shrink-0 rounded-xl px-4 text-[17px] font-bold ${
              p.id === preset.id ? "bg-text text-bg" : "bg-surface text-text"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-ok transition-[width]" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <ul className="overflow-hidden rounded-3xl bg-surface">
        {preset.items.map((item) => (
          <li key={item.id} className="border-b border-line last:border-b-0">
            {edit ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  className="min-h-14 min-w-0 flex-1 rounded-xl border-2 border-line bg-bg px-3 text-[19px] font-semibold"
                  defaultValue={item.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== item.name) actions.renameGear(preset.id, item.id, v);
                  }}
                />
                <IconButton label={`Rimuovi ${item.name}`} onClick={() => actions.removeGear(preset.id, item.id)} className="!text-danger">
                  <X size={24} strokeWidth={2.6} />
                </IconButton>
              </div>
            ) : (
              <button
                type="button"
                role="checkbox"
                aria-checked={item.checked}
                onClick={() => actions.toggleGear(preset.id, item.id)}
                className="flex min-h-[68px] w-full items-center gap-4 px-4 text-left"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[3px] ${
                    item.checked ? "border-ok bg-ok text-bg" : "border-line text-transparent"
                  }`}
                >
                  <Check size={26} strokeWidth={3.5} />
                </span>
                <span className={`text-[21px] font-semibold ${item.checked ? "text-muted line-through" : ""}`}>{item.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          className="min-h-14 min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-4 text-[18px]"
          placeholder="Aggiungi oggetto…"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          enterKeyHint="done"
        />
        <Button type="submit" variant="secondary" size="lg" aria-label="Aggiungi" disabled={!newItem.trim()}>
          <Plus size={26} />
        </Button>
      </form>

      <Button
        variant="ghost"
        size="lg"
        className="mt-6 w-full"
        disabled={done === 0}
        onClick={() => actions.resetGear(preset.id)}
      >
        <RotateCcw size={22} /> RESET CHECKLIST
      </Button>
    </div>
  );
}
