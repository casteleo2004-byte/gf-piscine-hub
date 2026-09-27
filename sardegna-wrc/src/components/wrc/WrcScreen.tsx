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
      <PageHeader
        title="WRC"
        subtitle={`${upcoming.length} prove in programma`}
        right={<OnlineBadge />}
      />

      {/* Fonti ufficiali: le aree Pass Gold e le zone pubblico 2026 si prendono da qui. */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {OFFICIAL_GUIDES.map((g) => (
          <a key={g.href} href={g.href} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md", "text-center")}>
            {g.label}
          </a>
        ))}
      </div>

      {[...byDate.entries()].map(([date, list]) => (
        <section key={date} className="mb-6">
          <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-muted">
            {date === today ? <span className="text-hi">Oggi</span> : formatLongDate(date)}
          </h2>
          <div className="space-y-4">
            {list.map((s) => (
              <StageCard
                key={s.id}
                stage={s}
                data={data}
                onEdit={() => setEditing(s)}
                onSpectator={() => setSpectatorFor(s.id)}
              />
            ))}
          </div>
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

      {editing && <StageEditor stage={editing} data={data} onClose={() => setEditing(null)} />}
      {spectatorStage && <SpectatorSheet stage={spectatorStage} data={data} onClose={() => setSpectatorFor(null)} />}
    </div>
  );
}
