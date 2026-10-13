"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/lib/hooks/useOnline";

/** Badge discreto mostrato solo quando manca la rete. */
export function OnlineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[14px] font-semibold text-muted">
      <WifiOff size={15} /> Offline
    </span>
  );
}
