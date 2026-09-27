"use client";

import { AlertTriangle, Check, ChevronDown, Eye, ListChecks, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatKm } from "@/lib/geo";
import { spectatorPointOf, stageTiming } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import { formatDuration } from "@/lib/time";
import type { AppData, RallyStage } from "@/lib/types";
import { buttonClass, IconButton } from "../ui/Button";
import { NavButton } from "../ui/NavButton";
import { Stat } from "../ui/Stat";

const ACCESS_LABEL = { facile: "Facile", media: "Media", difficile: "Difficile" } as const;

export function StageCard({
  stage,
  data,
  onEdit,
  onSpectator,
}: {
  stage: RallyStage;
  data: AppData;
  onEdit: () => void;
  onSpectator: () => void;
}) {
  const [more, setMore] = useState(false);
  const timing = stageTiming(stage, data);
  const sp = spectatorPointOf(stage, data);
  const day = data.days.find((d) => d.date === stage.date);
  const checklist = day?.gearPresetId ?? "rally";

  return (
    <article className="overflow-hidden rounded-3xl border-l-[6px] border-rally bg-surface">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-extrabold uppercase tracking-wider text-rally">PS {stage.number}</div>
            <h3 className="text-[26px] font-extrabold leading-tight">{stage.name || "Senza nome"}</h3>
          </div>
          {stage.seen && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-ok/15 px-2.5 py-1 text-[14px] font-bold text-ok">
              <Check size={16} strokeWidth={3} /> Vista
            </span>
          )}
          <IconButton label="Modifica prova" onClick={onEdit}>
            <Pencil size={20} />
          </IconButton>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="Prima vettura" value={stage.firstCar || "Da definire"} tone="rally" />
          <Stat label="Partenza" value={timing.departAt ?? "—"} tone="accent" hint={timing.departEstimated && timing.departAt ? "calc." : undefined} />
          <Stat label="Auto" value={formatDuration(timing.driveMinutes)} hint={timing.driveEstimated ? "≈" : undefined} />
          <Stat
            label="A piedi"
            value={formatDuration(stage.walkMinutes)}
            hint={stage.walkKm != null ? formatKm(stage.walkKm) : undefined}
          />
        </div>

        {stage.passes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {stage.passes.map((p, i) => (
              <li key={i} className="tnum text-[17px] font-semibold text-muted">
                {p.label} · <span className="text-text">{p.time || "da definire"}</span>
              </li>
            ))}
          </ul>
        )}

        {stage.roadClosure && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rally/15 px-3 py-2.5 text-[18px] font-bold text-rally">
            <AlertTriangle size={22} /> Chiusura strada {stage.roadClosure}
          </div>
        )}

        <NavButton
          className="mt-5 w-full"
          size="xl"
          point={stage.parking}
          label={stage.parkingName || `Parcheggio PS ${stage.number}`}
        >
          <span className="whitespace-nowrap text-[20px]">NAVIGA AL PARCHEGGIO</span>
        </NavButton>
        {stage.parkingName && <p className="mt-1.5 text-center text-[15px] font-semibold text-muted">{stage.parkingName}</p>}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={onSpectator} className={buttonClass("rally", "lg")}>
            <Eye size={22} /> Spettatore
          </button>
          <Link href={`/gear/?p=${checklist}`} className={buttonClass("secondary", "lg")}>
            <ListChecks size={22} /> Checklist
          </Link>
        </div>
        {sp && (
          <p className="mt-2 text-[16px] font-semibold text-muted">
            👁 {sp.name}
            {sp.wow ? <span className="ml-2 font-extrabold text-hi">WOW {sp.wow}/5</span> : null}
            {sp.experienceArea && <span className="ml-2 font-extrabold text-hi">· Area Pass Gold</span>}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMore(!more)}
        className="flex min-h-14 w-full items-center justify-center gap-2 border-t border-line text-[17px] font-bold text-muted"
      >
        {more ? "Meno dettagli" : "Più dettagli"}
        <ChevronDown size={20} className={more ? "rotate-180" : ""} />
      </button>
      {more && (
        <div className="space-y-3 px-5 pb-5 text-[17px]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Detail label="Dislivello" value={stage.elevationM != null ? `${stage.elevationM} m` : undefined} />
            <Detail label="Accesso" value={stage.access ? ACCESS_LABEL[stage.access] : undefined} />
            <Detail
              label="Parcheggio"
              value={stage.parking ? `${stage.parking.lat.toFixed(5)}, ${stage.parking.lng.toFixed(5)}` : undefined}
            />
            <Detail
              label="Spettatore"
              value={sp?.point ? `${sp.point.lat.toFixed(5)}, ${sp.point.lng.toFixed(5)}` : undefined}
            />
          </dl>
          {stage.gear && <Detail label="Attrezzatura" value={stage.gear} />}
          {stage.notes && <Detail label="Note" value={stage.notes} />}
          <button
            type="button"
            onClick={() => actions.toggleStageSeen(stage.id)}
            className={buttonClass(stage.seen ? "secondary" : "ghost", "lg", "w-full")}
          >
            <Check size={22} /> {stage.seen ? "Segnata come vista" : "Segna come vista"}
          </button>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[14px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="tnum whitespace-pre-line break-words font-semibold">{value ?? "—"}</dd>
    </div>
  );
}
