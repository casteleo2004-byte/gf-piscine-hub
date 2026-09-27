"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/lib/hooks/useNow";
import { newId } from "@/lib/id";
import { useData } from "@/lib/store/hooks";
import { formatLongDate, toISODate } from "@/lib/time";
import type { RallyStage } from "@/lib/types";
import { Button, buttonClass } from "../ui/Button";
import { OnlineBadge } from "../ui/OnlineBadge";
import { PageHeader } from "../ui/PageHeader";
import { SpectatorSheet } from "./SpectatorSheet";
import { StageCard } from "./StageCard";
import { StageEditor } from "./StageEditor";
import { RallyGuide, RallyGuideButton } from "./RallyGuide";
import { isInPlan } from "@/lib/smart";

const OFFICIAL_GUIDES = [
  { label: "Guida RIS Experience", href: "https://rallyitaliasardegna.com/ris-experience-2/" },
  { label: "Guida spettatori", href: "https://rallyitaliasardegna.com/guide-to-ss-spectators/" },
];

export function WrcScreen() {
  const data = useData();
  const now = useNow();
  const [editing, setEditing] = useState<RallyStage | null>(null);
  const [spectatorFor, setSpectatorFor] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [guide, setGuide] = useState(false);

  if (!data || !now) return <div className="h-[60vh]" aria-busy />;

  const today = toISODate(now);
  const sorted = [...data.stages].sort(
    (a, b) => a.date.localeCompare(b.date) || a.number - b.number,
  );
  const past = sorted.filter((s) => s.date < today);
  const upcoming = sorted.filter((s) => s.date >= today);
  const byDate = new Map<string, RallyStage[]>();
  for (const s of upcoming) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);

  const newStage = (): RallyStage => ({
    id: newId("ps"),
    number: (Math.max(0, ...data.stages.map((s) => s.number)) || 0) + 1,
    name: "",
    date: upcoming[0]?.date ?? data.trip.startDate,
    firstCar: "",
    passes: [],
    seen: false,
  });

  const spectatorStage = data.stages.find((s) => s.id === spectatorFor);

  return (
    <div>
      <PageHeader title="WRC" subtitle="Il vostro piano, giorno per giorno" right={<OnlineBadge />} />

      <div className="mb-6">
        <RallyGuideButton onClick={() => setGuide(true)} />
      </div>

      {[...byDate.entries()].map(([date, list]) => (
        <section key={date} className="mb-6">
          <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">
            {date === today ? <span className="text-hi">Oggi</span> : formatLongDate(date)}
          </h2>
          <div className="space-y-4">
            {list
              .filter((s) => isInPlan(s, data))
              .map((s) => (
                <StageCard key={s.id} stage={s} data={data} onEdit={() => setEditing(s)} onSpectator={() => setSpectatorFor(s.id)} />
              ))}
          </div>
          {list.some((s) => !isInPlan(s, data)) && (
            <>
              <h3 className="mb-2 mt-5 text-[15px] font-bold text-muted">Altre prove di questo giorno</h3>
              <div className="space-y-3">
                {list
                  .filter((s) => !isInPlan(s, data))
                  .map((s) => (
                    <StageCard key={s.id} stage={s} data={data} onEdit={() => setEditing(s)} onSpectator={() => setSpectatorFor(s.id)} />
                  ))}
              </div>
            </>
          )}
        </section>
      ))}

      {past.length > 0 && (
        <section className="mb-6">
          <Button variant="ghost" size="lg" className="w-full" onClick={() => setShowPast(!showPast)}>
            {showPast ? "Nascondi" : "Mostra"} prove passate ({past.length})
          </Button>
          {showPast && (
            <div className="mt-4 space-y-4">
              {past.map((s) => (
                <StageCard key={s.id} stage={s} data={data} onEdit={() => setEditing(s)} onSpectator={() => setSpectatorFor(s.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      <Button variant="ghost" size="lg" className="w-full" onClick={() => setEditing(newStage())}>
        <Plus size={24} /> Aggiungi prova
      </Button>

      {/* Fonti ufficiali. */}
      <h2 className="mb-2 mt-8 text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">Guide ufficiali</h2>
      <div className="grid grid-cols-2 gap-3">
        {OFFICIAL_GUIDES.map((g) => (
          <a key={g.href} href={g.href} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md", "text-center")}>
            {g.label}
          </a>
        ))}
      </div>

      {editing && <StageEditor stage={editing} data={data} onClose={() => setEditing(null)} />}
      {guide && <RallyGuide onClose={() => setGuide(false)} />}
      {spectatorStage && <SpectatorSheet stage={spectatorStage} data={data} onClose={() => setSpectatorFor(null)} />}
    </div>
  );
}
