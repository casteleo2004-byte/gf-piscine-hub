"use client";

import { usePathname } from "next/navigation";
import { Backpack, BookOpen, Flag, Map, Sun } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Oggi", Icon: Sun },
  { href: "/wrc/", label: "WRC", Icon: Flag },
  { href: "/mappa/", label: "Mappa", Icon: Map },
  { href: "/gear/", label: "Gear", Icon: Backpack },
  { href: "/diario/", label: "Diario", Icon: BookOpen },
];

export function BottomNav() {
  const path = usePathname() || "/";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur pb-safe"
      aria-label="Sezioni"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, ""));
          return (
            <li key={href}>
              {/* <a> nativo: navigazione completa servita dal service worker.
                  Il router client di Next non rispondeva ai tocchi nella PWA su iPhone. */}
              <a
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[68px] flex-col items-center justify-center gap-1 text-[13px] font-semibold ${
                  active ? "text-hi" : "text-muted"
                }`}
              >
                <Icon size={28} strokeWidth={active ? 2.6 : 2} />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
