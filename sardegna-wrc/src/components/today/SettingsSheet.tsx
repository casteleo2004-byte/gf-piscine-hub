"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { actions } from "@/lib/store/actions";
import { replaceAll, resetToSeed, update } from "@/lib/store/store";
import type { AppData, GeoPoint } from "@/lib/types";
import { Button } from "../ui/Button";
import { Chips, PointInput, TextInput } from "../ui/fields";
import { Sheet } from "../ui/Sheet";

/** Poche impostazioni davvero utili + backup dei dati locali. */
export function SettingsSheet({ data, onClose }: { data: AppData; onClose: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const s = data.settings;

  const setBase = (patch: { baseName?: string; base?: GeoPoint }) =>
    update((d) => {
      d.trip = { ...d.trip, ...patch };
    });

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wrc-trip-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importData(f: File | undefined) {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as AppData;
      if (!parsed.trip || !Array.isArray(parsed.events)) throw new Error();
      if (confirm("Sostituire tutti i dati con quelli del backup?")) {
        replaceAll(parsed);
        setMsg("Backup importato");
      }
    } catch {
      setMsg("File non valido");
    }
  }

  return (
    <Sheet title="Impostazioni" onClose={onClose}>
      <div className="space-y-6">
        <Chips
          label="Navigazione con"
          value={s.mapsApp}
          onChange={(v) => actions.saveSettings({ mapsApp: v })}
          options={[
            { value: "apple", label: "Apple Mappe" },
            { value: "google", label: "Google Maps" },
          ]}
        />
        <Chips
          label="Tema"
          value={s.theme}
          onChange={(v) => actions.saveSettings({ theme: v })}
          options={[
            { value: "dark", label: "Scuro" },
            { value: "sun", label: "Sole (alto contrasto)" },
          ]}
        />
        <Chips
          label="Margine sulla partenza consigliata"
          value={String(s.bufferMinutes)}
          onChange={(v) => actions.saveSettings({ bufferMinutes: Number(v) })}
          options={["0", "10", "15", "20", "30"].map((v) => ({ value: v, label: `${v} min` }))}
        />
        <TextInput label="Base" value={data.trip.baseName} onChange={(v) => setBase({ baseName: v })} />
        <PointInput label="Posizione base" value={data.trip.base} onChange={(v) => v && setBase({ base: v })} />

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="text-[19px] font-bold">Backup</h3>
          <p className="text-[16px] text-muted">
            I dati sono salvati solo su questo telefono. Esporta un backup prima di partire (le foto restano sul
            dispositivo e non sono incluse).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={exportData}>
              <Download size={22} /> Esporta
            </Button>
            <Button size="lg" onClick={() => file.current?.click()}>
              <Upload size={22} /> Importa
            </Button>
          </div>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {msg && <p className="text-[16px] font-semibold text-hi">{msg}</p>}
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => {
              if (confirm("Ripristinare i dati iniziali? Tutte le modifiche andranno perse.")) {
                resetToSeed();
                onClose();
              }
            }}
          >
            <RotateCcw size={22} /> Ripristina dati iniziali
          </Button>
        </section>
      </div>
    </Sheet>
  );
}
