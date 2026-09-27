"use client";

import { useState } from "react";
import { useDraft } from "@/lib/hooks/useDraft";
import { PLACE_CATEGORIES } from "@/lib/meta";
import { actions } from "@/lib/store/actions";
import type { AppData, Place, PlaceCategory } from "@/lib/types";
import { Button } from "../ui/Button";
import { EditorFooter } from "../ui/EditorFooter";
import { Chips, PointInput, TextArea, TextInput } from "../ui/fields";
import { PhotoStrip } from "../ui/Photos";
import { Sheet } from "../ui/Sheet";

// In aggiunta rapida solo 4 campi: Nome, Categoria, Posizione, Nota.
const QUICK_CATS: PlaceCategory[] = [
  "alloggio",
  "panorama",
  "spiaggia",
  "ristorante",
  "bar",
  "supermercato",
  "distributore",
  "attrazione",
  "visitare",
  "parcheggio",
  "spettatore",
  "rally",
];

export function PlaceEditor({
  place,
  data,
  quick = false,
  onClose,
}: {
  place: Place;
  data: AppData;
  quick?: boolean;
  onClose: () => void;
}) {
  const [d, set] = useDraft(place);
  const [full, setFull] = useState(!quick);
  const isNew = !data.places.some((p) => p.id === place.id);

  return (
    <Sheet
      title={isNew ? "Aggiungi luogo" : "Modifica luogo"}
      onClose={onClose}
      footer={
        <EditorFooter
          canSave={!!d.name?.trim() || !!d.point}
          onSave={() => {
            // Salvataggio lampo: senza nome usa categoria + ora.
            const name =
              d.name?.trim() ||
              `${PLACE_CATEGORIES[d.category].label} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
            actions.savePlace({ ...d, name, photoIds: d.photoIds ?? [] });
            onClose();
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  actions.deletePlace(place.id);
                  onClose();
                }
          }
        />
      }
    >
      <div className="space-y-5">
        <TextInput label="Nome" value={d.name} onChange={(v) => set("name", v)} autoFocus={isNew} placeholder="Es. Belvedere sulla costa" />
        <Chips
          label="Categoria"
          value={d.category}
          onChange={(v) => set("category", v)}
          options={QUICK_CATS.map((c) => ({ value: c, label: PLACE_CATEGORIES[c].label }))}
        />
        <PointInput label="Posizione" value={d.point} onChange={(v) => set("point", v)} />
        <TextArea label="Nota" value={d.notes} onChange={(v) => set("notes", v)} rows={2} />

        {full ? (
          <>
            <TextInput label="Indirizzo" value={d.address} onChange={(v) => set("address", v)} />
            <TextInput label="Orari" value={d.hours} onChange={(v) => set("hours", v)} placeholder="Es. 12:00–15:00, chiuso lun" />
            <TextInput label="Prenotazione" value={d.booking} onChange={(v) => set("booking", v)} placeholder="Es. Prenotato 20:30, 2 persone" />
            <div>
              <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">Foto</span>
              <PhotoStrip ids={d.photoIds ?? []} onChange={(ids) => set("photoIds", ids)} />
            </div>
          </>
        ) : (
          <Button variant="ghost" size="md" className="w-full" onClick={() => setFull(true)}>
            Altri campi (indirizzo, orari, foto…)
          </Button>
        )}
      </div>
    </Sheet>
  );
}
