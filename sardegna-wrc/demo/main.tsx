// Demo a pagina singola dell'app. Usa l'ora e il giorno reali del dispositivo,
// esattamente come l'app installata. Build: npm run demo
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BottomNav } from "@/components/BottomNav";
import { DiaryScreen } from "@/components/diary/DiaryScreen";
import { GearScreen } from "@/components/gear/GearScreen";
import { PlacesScreen } from "@/components/places/PlacesScreen";
import { TodayScreen } from "@/components/today/TodayScreen";
import { WrcScreen } from "@/components/wrc/WrcScreen";
import { useData } from "@/lib/store/hooks";
import { push, useUrl } from "./shims/router";

function Screen() {
  const { pathname } = useUrl();
  if (pathname.startsWith("/wrc")) return <WrcScreen />;
  if (pathname.startsWith("/mappa")) return <PlacesScreen />;
  if (pathname.startsWith("/gear")) return <GearScreen />;
  if (pathname.startsWith("/diario")) return <DiaryScreen />;
  return <TodayScreen />;
}

function App() {
  const theme = useData()?.settings.theme;

  useEffect(() => {
    if (theme === "sun") document.documentElement.dataset.theme = "sun";
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  return (
    <>
      <main className="pb-nav mx-auto max-w-xl px-4 pt-3">
        <Screen />
      </main>
      <BottomNav />
    </>
  );
}

// Le versioni precedenti della demo salvavano un orario simulato: non serve più.
try {
  localStorage.removeItem("wrc-demo:preset");
} catch {}

// L'app usa link <a> nativi: nella demo a pagina singola li instradiamo in memoria.
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a");
  const href = a?.getAttribute("href");
  if (!a || !href || !href.startsWith("/") || a.target === "_blank") return;
  e.preventDefault();
  push(href);
});

createRoot(document.getElementById("root")!).render(<App />);
