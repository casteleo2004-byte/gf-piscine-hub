"use client";

import { Check, Crosshair, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { formatKm, getCurrentPoint, haversineKm } from "@/lib/geo";
import { newId } from "@/lib/id";
import { PLACE_CATEGORIES, PLACE_FILTERS, toneText } from "@/lib/meta";
import { stageCode } from "@/lib/smart";
import { useData } from "@/lib/store/hooks";
import type { AppData, GeoPoint, Place, PlaceCategory } from "@/lib/types";
import { Button, buttonClass } from "../ui/Button";
import { NavButton } from "../ui/NavButton";
import { OnlineBadge } from "../ui/OnlineBadge";
import { PageHeader } from "../ui/PageHeader";
import { PlaceEditor } from "./PlaceEditor";
import { PlaceSheet } from "./PlaceSheet";

interface Row {
  key: string;
  name: string;
  category: PlaceCategory;
  point?: GeoPoint;
  address?: string;
  subtitle?: string;
  place?: Place;
}

/** Luoghi salvati + parcheggi e punti spettatore delle prove. */
function buildRows(data: AppData): Row[] {
  const rows: Row[] = data.places.map((p) => ({
    key: p.id,
    name: p.name,
    category: p.category,
    point: p.point,
    address: p.address,
    subtitle: p.notes,
    place: p,
  }));
  for (const s of data.stages) {
    if (s.parking) {
      rows.push({
        key: `park-${s.id}`,
        name: s.parkingName || `Parcheggio ${stageCode(s)}`,
        category: "parcheggio",
        point: s.parking,
        subtitle: `${stageCode(s)} ${s.name}`,
      });
    }
  }
  for (const sp of data.spectatorPoints) {
    const s = data.stages.find((x) => x.id === sp.stageId);
    if (sp.point || sp.access) {
      rows.push({
        key: `sp-${sp.id}`,
        name: sp.name || "Punto spettatore",
        category: sp.experienceArea ? "rally" : "spettatore",
        point: sp.point ?? sp.access,
        subtitle: s ? `${stageCode(s)} ${s.name}` : undefined,
      });
    }
  }
  return rows;
}

export function PlacesScreen() {
  const data = useData();
  const [filter, setFilter] = useState("tutti");
  const [me, setMe] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [adding, setAdding] = useState<Place | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => (data ? buildRows(data) : []), [data]);
  if (!data) return <div className="h-[60vh]" aria-busy />;

  const origin = me ?? data.trip.base;
  const cats = PLACE_FILTERS.find((f) => f.id === filter)?.cats;
  const list = rows
    .filter((r) => !cats || cats.includes(r.category))
    .map((r) => ({ ...r, km: r.point ? haversineKm(origin, r.point) : undefined }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));

  async function nearMe() {
    if (me) {
      setMe(null);
      return;
    }
    setLocating(true);
    try {
      const p = await getCurrentPoint();
      setMe(p);
    } catch {
      /* resta ordinato dalla base */
    } finally {
      setLocating(false);
    }
  }

  const blank = (): Place => ({ id: newId("pl"), name: "", category: "panorama", photoIds: [], visited: false });
  const open = data.places.find((p) => p.id === openId);

  return (
    <div>
      <PageHeader
        title="Mappa"
        subtitle={me ? "Distanze da te" : `Distanze da ${data.trip.baseName}`}
        right={<OnlineBadge />}
      />

      <Button variant="primary" size="lg" className="mb-4 w-full" onClick={() => setAdding(blank())}>
        <Plus size={26} strokeWidth={2.6} /> Aggiungi luogo
      </Button>

      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {PLACE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`min-h-12 shrink-0 rounded-xl px-4 text-[17px] font-bold ${
              filter === f.id ? "bg-text text-bg" : "bg-surface text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button type="button" onClick={nearMe} className={buttonClass(me ? "secondary" : "ghost", "md", "mb-4 w-full")}>
        {locating ? <Loader2 className="animate-spin" size={20} /> : <Crosshair size={20} />}
        {me ? "Ordina dalla base" : "Ordina vicino a me"}
      </button>

      <ul className="space-y-3">
        {list.map((r) => {
          const meta = PLACE_CATEGORIES[r.category];
          return (
            <li key={r.key} className="flex items-stretch overflow-hidden rounded-2xl bg-surface">
              <button
                type="button"
                className="min-w-0 flex-1 p-4 text-left"
                onClick={() => r.place && setOpenId(r.place.id)}
              >
                <div className={`flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-wide ${toneText[meta.tone]}`}>
                  <meta.Icon size={16} /> {meta.label}
                  {r.place?.visited && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-ok">
                      <Check size={15} strokeWidth={3} /> Visto
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[20px] font-bold leading-snug">{r.name}</div>
                <div className="tnum mt-0.5 truncate text-[16px] font-semibold text-muted">
                  {r.km != null ? formatKm(r.km) : "Senza posizione"}
                  {r.subtitle ? ` · ${r.subtitle}` : ""}
                </div>
              </button>
              <div className="flex items-center pr-3">
                <NavButton size="lg" variant="primary" point={r.point} address={r.address} label={r.name} className="!px-4" compact>
                  <span className="sr-only">Naviga</span>
                </NavButton>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="py-10 text-center text-[18px] text-muted">Nessun luogo in questa categoria.</p>}

      {adding && <PlaceEditor place={adding} data={data} quick onClose={() => setAdding(null)} />}
      {open && <PlaceSheet place={open} data={data} onClose={() => setOpenId(null)} />}
    </div>
  );
}
