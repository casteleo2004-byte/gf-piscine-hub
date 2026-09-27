"use client";

import { Pencil, Plus, Star } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/id";
import { formatKm, formatPoint } from "@/lib/geo";
import { formatDuration } from "@/lib/time";
import { spectatorPointOf, spectatorPointsOf, stageCode } from "@/lib/smart";
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
  const others = spectatorPointsOf(stage.id, data).filter((p) => p.id !== primary?.id);

  const blank = (): SpectatorPoint => ({ id: newId("sp"), stageId: stage.id, name: "", photoIds: [] });

  return (
    <Sheet
      title={`${stageCode(stage)} · Punto spettatore`}
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
        <PointView point={primary} stage={stage} />
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
                {p.wow ? <Wow value={p.wow} /> : null}
                {p.description && <p className="mt-1 text-[16px] text-muted">{p.description}</p>}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <NavButton size="md" variant="secondary" point={p.point ?? p.access} address={p.address} label={p.name} mode={p.point ? "walking" : "driving"} compact>
                    Naviga
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

function Wow({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <div className={`tnum font-extrabold text-hi ${large ? "mt-1 text-[22px]" : "mt-1 text-[17px]"}`}>
      WOW {"★".repeat(value)}
      <span className="text-muted">{"☆".repeat(5 - value)}</span>
    </div>
  );
}

export function GoldBadge() {
  return (
    <span className="mb-1 inline-flex items-center rounded-full bg-accent px-3 py-1 text-[14px] font-extrabold uppercase tracking-wide text-accent-ink">
      Area RIS Experience · Pass Gold
    </span>
  );
}

/** Parcheggio spettatori → punto: tempi, descrizione e percorso a piedi su Maps. */
function WalkFromParking({ point, stage }: { point: SpectatorPoint; stage: RallyStage }) {
  const facts = [
    stage.walkMinutes != null && formatDuration(stage.walkMinutes),
    stage.walkKm != null && formatKm(stage.walkKm),
    stage.elevationM != null && `+${stage.elevationM} m`,
  ].filter(Boolean) as string[];
  return (
    <section className="mt-5 rounded-2xl bg-surface p-4">
      <h4 className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">Dal parcheggio a piedi</h4>
      <p className="mt-1 text-[18px] font-bold">{stage.parkingName || "Parcheggio spettatori da inserire"}</p>
      {facts.length > 0 && <p className="tnum mt-1 text-[18px] font-semibold text-hi">{facts.join(" · ")}</p>}
      {point.walkRoute ? (
        <p className="mt-2 whitespace-pre-line text-[17px]">{point.walkRoute}</p>
      ) : (
        <p className="mt-2 text-[16px] text-muted">Tragitto da inserire dalla scheda ufficiale della prova (matita).</p>
      )}
      {stage.parking && point.point ? (
        <NavButton className="mt-3 w-full" size="lg" variant="secondary" origin={stage.parking} point={point.point} label={point.name} mode="walking">
          PERCORSO PARCHEGGIO → PUNTO
        </NavButton>
      ) : (
        <p className="mt-2 text-[15px] font-semibold text-muted">
          Il percorso su Maps compare quando parcheggio e punto hanno le coordinate.
        </p>
      )}
    </section>
  );
}

function PointView({ point, stage }: { point: SpectatorPoint; stage: RallyStage }) {
  const rows: [string, string | undefined][] = [
    ["Posizione consigliata", point.position],
    ["Tipo di curva", point.cornerType],
    ["Visibilità", point.visibility ? "★".repeat(point.visibility) + "☆".repeat(5 - point.visibility) : undefined],
    ["Sicurezza", point.safety ? "★".repeat(point.safety) + "☆".repeat(5 - point.safety) : undefined],
    ["Distanza dalla strada", point.roadDistanceM != null ? `${point.roadDistanceM} m` : undefined],
    ["Attrezzatura foto", point.photoGear],
    ["Coordinate", point.point ? formatPoint(point.point) : undefined],
    ["Access Point", point.access ? formatPoint(point.access) : undefined],
    ["Navigazione verso", !point.point && !point.access ? point.address : undefined],
    ["Fonte", point.source],
  ];
  return (
    <div>
      {point.experienceArea ? (
        <GoldBadge />
      ) : (
        <span className="mb-1 inline-flex rounded-full border-2 border-dashed border-line px-3 py-1 text-[14px] font-bold text-muted">
          Area Pass Gold da confermare
        </span>
      )}
      <h3 className="text-[28px] font-extrabold leading-tight">{point.name || "Punto spettatore"}</h3>
      {point.wow ? <Wow value={point.wow} large /> : null}
      {point.description && <p className="mt-2 text-[20px] leading-snug">{point.description}</p>}

      <NavButton
        className="mt-5 w-full"
        point={point.point ?? point.access}
        address={point.address}
        label={point.name}
        mode={point.point ? "walking" : "driving"}
      >
        <span className="whitespace-nowrap text-[22px]">
          {point.point ? "NAVIGA A PIEDI" : point.access ? "NAVIGA ALL'ACCESSO" : "NAVIGA IN ZONA"}
        </span>
      </NavButton>

      <WalkFromParking point={point} stage={stage} />

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
