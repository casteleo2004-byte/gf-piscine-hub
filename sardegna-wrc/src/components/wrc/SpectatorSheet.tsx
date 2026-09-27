"use client";

import { Pencil, Plus, Star } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/id";
import { formatPoint } from "@/lib/geo";
import { spectatorPointOf } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import type { AppData, RallyStage, SpectatorPoint } from "@/lib/types";
import { Button, IconButton } from "../ui/Button";
import { NavButton } from "../ui/NavButton";
import { PhotoStrip } from "../ui/Photos";
import { Sheet } from "../ui/Sheet";
import { SpectatorEditor } from "./SpectatorEditor";

/** Punto spettatore della prova: descrizione, foto, NAVIGA A PIEDI e alternative. */
export function SpectatorSheet({ stage, data, onClose }: { stage: RallyStage; data: AppData; onClose: () => void }) {
  const [editing, setEditing] = useState<SpectatorPoint | null>(null);
  const primary = spectatorPointOf(stage, data);
  const others = data.spectatorPoints.filter((p) => p.stageId === stage.id && p.id !== primary?.id);

  const blank = (): SpectatorPoint => ({ id: newId("sp"), stageId: stage.id, name: "", photoIds: [] });

  return (
    <Sheet
      title={`PS ${stage.number} · Punto spettatore`}
      onClose={onClose}
      headerRight={
        primary && (
          <IconButton label="Modifica punto" onClick={() => setEditing(primary)}>
            <Pencil size={20} />
          </IconButton>
        )
      }
    >
      {primary ? (
        <PointView point={primary} />
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-[18px] font-semibold text-muted">
          Nessun punto spettatore salvato per questa prova.
        </p>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-2 text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">Alternative</h3>
          <ul className="space-y-3">
            {others.map((p) => (
              <li key={p.id} className="rounded-2xl bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-[19px] font-bold">{p.name || "Senza nome"}</span>
                  <IconButton label="Modifica" onClick={() => setEditing(p)}>
                    <Pencil size={20} />
                  </IconButton>
                </div>
                {p.description && <p className="mt-1 text-[16px] text-muted">{p.description}</p>}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <NavButton size="md" variant="secondary" point={p.point} label={p.name} mode="walking">
                    A piedi
                  </NavButton>
                  <Button size="md" onClick={() => actions.saveSpectatorPoint(p, true)}>
                    <Star size={20} /> Principale
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="ghost" size="lg" className="mt-6 w-full" onClick={() => setEditing(blank())}>
        <Plus size={24} /> Aggiungi punto spettatore
      </Button>

      {editing && <SpectatorEditor point={editing} data={data} onClose={() => setEditing(null)} />}
    </Sheet>
  );
}

function PointView({ point }: { point: SpectatorPoint }) {
  const rows: [string, string | undefined][] = [
    ["Posizione consigliata", point.position],
    ["Tipo di curva", point.cornerType],
    ["Visibilità", point.visibility ? "★".repeat(point.visibility) + "☆".repeat(5 - point.visibility) : undefined],
    ["Sicurezza", point.safety ? "★".repeat(point.safety) + "☆".repeat(5 - point.safety) : undefined],
    ["Distanza dalla strada", point.roadDistanceM != null ? `${point.roadDistanceM} m` : undefined],
    ["Attrezzatura foto", point.photoGear],
    ["Coordinate", point.point ? formatPoint(point.point) : undefined],
  ];
  return (
    <div>
      <h3 className="text-[28px] font-extrabold leading-tight">{point.name || "Punto spettatore"}</h3>
      {point.description && <p className="mt-2 text-[20px] leading-snug">{point.description}</p>}

      <NavButton className="mt-5 w-full" point={point.point} label={point.name} mode="walking">
        NAVIGA A PIEDI
      </NavButton>

      <div className="mt-5">
        <PhotoStrip ids={point.photoIds} onChange={(ids) => actions.saveSpectatorPoint({ ...point, photoIds: ids })} />
      </div>

      <dl className="mt-5 divide-y divide-line rounded-2xl bg-surface">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex gap-3 px-4 py-3">
              <dt className="w-[42%] shrink-0 text-[15px] font-bold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="tnum min-w-0 break-words text-[18px] font-semibold">{v}</dd>
            </div>
          ))}
      </dl>
      {point.notes && <p className="mt-4 whitespace-pre-line text-[18px]">{point.notes}</p>}
    </div>
  );
}
