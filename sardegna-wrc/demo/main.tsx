// Demo a pagina singola dell'app, con ora simulata. Build: npm run demo
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BottomNav } from "@/components/BottomNav";
import { DiaryScreen } from "@/components/diary/DiaryScreen";
import { GearScreen } from "@/components/gear/GearScreen";
import { PlacesScreen } from "@/components/places/PlacesScreen";
import { TodayScreen } from "@/components/today/TodayScreen";
import { WrcScreen } from "@/components/wrc/WrcScreen";
import { useData } from "@/lib/store/hooks";
import { useUrl } from "./shims/router";

// --- Orologio simulato: sposta "adesso" per vedere la Home in giorni e ore diversi.
const RealDate = Date;
let offset = 0;
class DemoDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(RealDate.now() + offset);
    else super(...(args as [number]));
  }
  static now() {
    return RealDate.now() + offset;
  }
}
globalThis.Date = DemoDate as DateConstructor;

const PRESETS: { id: string; label: string; at: string | null }[] = [
  { id: "ven-0600", label: "Ven 2 · 06:00 · partenza rally", at: "2026-10-02T06:00" },
  { id: "ven-0750", label: "Ven 2 · 07:50 · al parcheggio", at: "2026-10-02T07:50" },
  { id: "ven-1000", label: "Ven 2 · 10:00 · tra due prove", at: "2026-10-02T10:00" },
  { id: "ven-1945", label: "Ven 2 · 19:45 · verso cena", at: "2026-10-02T19:45" },
  { id: "sab-0515", label: "Sab 3 · 05:15 · in ritardo", at: "2026-10-03T05:15" },
  { id: "mar-2000", label: "Mar 29/9 · 20:00 · verso il porto", at: "2026-09-29T20:00" },
  { id: "mer-0640", label: "Mer 30/9 · 06:40 · sbarco a Olbia", at: "2026-09-30T06:40" },
  { id: "rit-1745", label: "Mer 7/10 · 17:45 · rientro", at: "2026-10-07T17:45" },
  { id: "lun-0900", label: "Lun 5 · 09:00 · turismo", at: "2026-10-05T09:00" },
  { id: "real", label: "Ora reale", at: null },
];

function applyPreset(id: string) {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
  offset = p.at ? new RealDate(p.at).getTime() - RealDate.now() : 0;
}

function loadPreset(): string {
  try {
    return localStorage.getItem("wrc-demo:preset") ?? PRESETS[0].id;
  } catch {
    return PRESETS[0].id;
  }
}

const initial = loadPreset();
applyPreset(initial);

function Screen() {
  const { pathname } = useUrl();
  if (pathname.startsWith("/wrc")) return <WrcScreen />;
  if (pathname.startsWith("/mappa")) return <PlacesScreen />;
  if (pathname.startsWith("/gear")) return <GearScreen />;
  if (pathname.startsWith("/diario")) return <DiaryScreen />;
  return <TodayScreen />;
}

function App() {
  const [preset, setPreset] = useState(initial);
  const theme = useData()?.settings.theme;

  useEffect(() => {
    if (theme === "sun") document.documentElement.dataset.theme = "sun";
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  function change(id: string) {
    applyPreset(id);
    setPreset(id);
    try {
      localStorage.setItem("wrc-demo:preset", id);
    } catch {}
  }

  return (
    <>
      <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "8px 16px 0" }}>
        <label
          htmlFor="demo-time"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "2px dashed var(--line)",
            borderRadius: 12,
            padding: "6px 10px",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--muted)",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>DEMO · ora simulata</span>
          <select
            id="demo-time"
            value={preset}
            onChange={(e) => change(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 40,
              fontSize: 15,
              fontWeight: 700,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "0 6px",
            }}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <main className="pb-nav mx-auto max-w-xl px-4 pt-3" key={preset}>
        <Screen />
      </main>
      <BottomNav />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
