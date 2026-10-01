"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import { formatKm, formatPoint } from "@/lib/geo";
import { PLACE_CATEGORIES, toneText } from "@/lib/meta";
import { distanceFromBase } from "@/lib/smart";
import { actions } from "@/lib/store/actions";
import type { AppData, Place } from "@/lib/types";
import { buttonClass, IconButton } from "../ui/Button";
import { NavButton } from "../ui/NavButton";
import { PhotoStrip } from "../ui/Photos";
import { Sheet } from "../ui/Sheet";
import { PlaceEditor } from "./PlaceEditor";

export function PlaceSheet({ place, data, onClose }: { place: Place; data: AppData; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const meta = PLACE_CATEGORIES[place.category];
  const km = distanceFromBase(data, place.point);
  const rows: [string, string | undefined][] = [
    ["Indirizzo", place.address],
    ["Orari", place.hours],
    ["Prenotazione", place.booking],
    ["Da " + data.trip.baseName, km != null ? formatKm(km) + " in linea d'aria" : undefined],
    ["Coordinate", place.point ? formatPoint(place.point) : undefined],
  ];

  return (
    <Sheet
      title={meta.label}
      onClose={onClose}
      headerRight={
        <IconButton label="Modifica luogo" onClick={() => setEditing(true)}>
          <Pencil size={20} />
        </IconButton>
      }
    >
      <div className={`flex items-center gap-2 text-[16px] font-bold uppercase ${toneText[meta.tone]}`}>
        <meta.Icon size={20} /> {meta.label}
      </div>
      <h3 className="mt-1 text-[28px] font-extrabold leading-tight">{place.name}</h3>
      {place.notes && <p className="mt-2 whitespace-pre-line text-[19px]">{place.notes}</p>}

      <NavButton className="mt-5 w-full" point={place.point} address={place.address} label={place.name} />

      <button
        type="button"
        onClick={() => actions.togglePlaceVisited(place.id)}
        className={buttonClass(place.visited ? "secondary" : "ghost", "lg", "mt-3 w-full")}
      >
        <Check size={22} className={place.visited ? "text-ok" : ""} strokeWidth={3} />
        {place.visited ? "Visitato" : "Segna come visitato"}
      </button>

      <div className="mt-5">
        <PhotoStrip ids={place.photoIds} onChange={(ids) => actions.savePlace({ ...place, photoIds: ids })} />
      </div>

      <dl className="mt-5 divide-y divide-line rounded-2xl bg-surface">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex gap-3 px-4 py-3">
              <dt className="w-[38%] shrink-0 text-[15px] font-bold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="tnum min-w-0 break-words text-[18px] font-semibold">{v}</dd>
            </div>
          ))}
      </dl>

      {editing && <PlaceEditor place={place} data={data} onClose={() => setEditing(false)} />}
    </Sheet>
  );
}
