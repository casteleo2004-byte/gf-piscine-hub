"use client";

import { AlertTriangle, Car, Check, ChevronDown, Eye, ListChecks, Pencil, Star } from "lucide-react";
import { useState } from "react";
import { formatPoint } from "@/lib/geo";
import { isInPlan, spectatorPointOf, stageCode, stageTiming } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import { formatDuration } from "@/lib/time";
import type { AppData, RallyStage } from "@/lib/types";
import { buttonClass, IconButton } from "../ui/Button";
import { ImageView } from "../ui/ImageView";
import { NavButton } from "../ui/NavButton";

const ACCESS_LABEL = { facile: "Facile", media: "Media", difficile: "Difficile" } as const;

/** Orari di passaggio della prova: "10:08 e 16:38". */
function passTimes(stage: RallyStage): string {
  const times = [stage.firstCar, ...stage.passes.map((p) => p.time)].filter(Boolean);
  if (!times.length) return "da definire";
  return times.length === 1 ? times[0] : `${times.slice(0, -1).join(", ")} e ${times[times.length - 1]}`;
}

/**
 * Card di una prova. Le prove del piano del giorno sono complete; le altre
 * restano compatte (un tocco per aprirle) per non confondere chi è al primo rally.
 */
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
  const inPlan = isInPlan(stage, data);
  const [open, setOpen] = useState(inPlan);
  const [more, setMore] = useState(false);
  const timing = stageTiming(stage, data);
  const sp = spectatorPointOf(stage, data);
  const day = data.days.find((d) => d.date === stage.date);
  const checklist = day?.gearPresetId ?? "rally";
  const secondClosure = stage.passes.find((p) => p.roadClosure && p.roadClosure !== stage.roadClosure)?.roadClosure;

  const header = (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-extrabold uppercase tracking-wider">
          <span className="text-rally">{stageCode(stage)}</span>
          {stage.lengthKm != null && <span className="text-muted">{stage.lengthKm.toFixed(2).replace(".", ",")} km</span>}
          {inPlan && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[13px] text-accent-ink">Nel vostro piano</span>
          )}
          {stage.seen && (
            <span className="inline-flex items-center gap-1 text-ok">
              <Check size={15} strokeWidth={3} /> Vista
            </span>
          )}
        </div>
        <h3 className="mt-0.5 text-[24px] font-extrabold leading-tight">{stage.name || "Senza nome"}</h3>
      </div>
      <IconButton label="Modifica prova" onClick={onEdit}>
        <Pencil size={20} />
      </IconButton>
    </div>
  );

  if (!open) {
    return (
      <article className="rounded-3xl bg-surface p-4">
        {header}
        <p className="tnum mt-1 text-[17px] font-semibold text-muted">
          Passaggi: <span className="text-text">{passTimes(stage)}</span>
          {stage.roadClosure && <span className="text-rally"> · strade chiuse dalle {stage.roadClosure}</span>}
        </p>
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("ghost", "md", "mt-3 w-full")}>
          Apri la prova <ChevronDown size={20} />
        </button>
      </article>
    );
  }

  return (
    <article className={`overflow-hidden rounded-3xl bg-surface ${inPlan ? "border-2 border-accent" : ""}`}>
      <div className="space-y-4 p-5">
        {header}

        {sp?.image && (
          <ImageView src={sp.image} alt={`Vista dall'alto: ${sp.name}`} caption="La vostra visuale · tocca per ingrandire" />
        )}

        <div>
          <div className="text-[14px] font-bold uppercase tracking-wide text-muted">Passano le auto</div>
          <div className="tnum text-[30px] font-extrabold leading-tight text-rally">{passTimes(stage)}</div>
        </div>

        {stage.roadClosure && (
          <div className="flex gap-2 rounded-xl bg-rally/15 px-3 py-2.5 text-[17px] font-bold text-rally">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <span>
              Strade chiuse dalle {stage.roadClosure}
              {secondClosure && ` (e dalle ${secondClosure} per il 2° passaggio)`}: dopo non si entra più, bisogna
              arrivare prima.
            </span>
          </div>
        )}

        {timing.departAt && (
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
            <Car size={24} className="shrink-0 text-hi" />
            <div className="min-w-0">
              <div className="text-[17px] font-bold">
                Partenza da {data.trip.baseName} <span className="tnum text-hi">{timing.departAt}</span>
              </div>
              {timing.driveMinutes != null && (
                <div className="text-[15px] font-semibold text-muted">
                  {timing.driveEstimated ? "circa " : ""}
                  {formatDuration(timing.driveMinutes)} di auto
                  {timing.departEstimated ? `, ${data.settings.bufferMinutes} min di margine` : ""}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <NavButton
            size="xl"
            className="w-full"
            point={stage.parking}
            via={stage.accessVia}
            label={stage.parkingName || `Parcheggio ${stageCode(stage)}`}
          >
            <span className="whitespace-nowrap text-[20px]">
              {stage.parkingKind === "access" ? "NAVIGA ALL'INGRESSO" : "NAVIGA AL PARCHEGGIO"}
            </span>
          </NavButton>
          {stage.parking && (
            <p className="mt-1.5 text-center text-[15px] font-semibold text-muted">
              {stage.accessVia
                ? `${stage.parkingName ?? "Parcheggio"} · passando dall'ingresso ufficiale per il pubblico. Seguite i cartelli dell'organizzazione.`
                : stage.parkingKind === "access"
                ? "Ingresso ufficiale per il pubblico: da lì seguite i cartelli fino al parcheggio."
                : `${stage.parkingName ?? "Parcheggio"} · arrivate seguendo i cartelli dall'ingresso ufficiale.`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onSpectator} className={buttonClass("rally", "lg", "whitespace-nowrap !px-3")}>
            <Eye size={20} className="shrink-0" /> Dove guardare
          </button>
          <a href={`/gear/?p=${checklist}`} className={buttonClass("secondary", "lg")}>
            <ListChecks size={22} /> Checklist
          </a>
        </div>

        {sp && (
          <p className="text-[16px] font-semibold text-muted">
            Punto consigliato: <span className="text-text">{sp.name}</span>
            {sp.experienceArea && <span className="font-extrabold text-hi"> · riservato Pass Gold</span>}
          </p>
        )}

        {day && (
          <button
            type="button"
            onClick={() => actions.togglePlan(day.date, stage.id)}
            className={buttonClass(inPlan ? "secondary" : "ghost", "md", "w-full")}
          >
            <Star size={20} className={inPlan ? "fill-accent text-hi" : ""} />
            {inPlan ? "Nel piano di questo giorno" : "Aggiungi al piano del giorno"}
          </button>
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
            <Detail label={stage.parkingKind === "access" ? "Ingresso" : "Parcheggio"} value={stage.parking ? formatPoint(stage.parking) : undefined} />
            <Detail label="A piedi" value={stage.walkMinutes != null ? formatDuration(stage.walkMinutes) : undefined} />
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
