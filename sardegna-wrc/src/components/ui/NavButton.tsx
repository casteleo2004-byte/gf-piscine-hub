"use client";

import { Footprints, Navigation } from "lucide-react";
import { navigationUrl, type TravelMode } from "@/lib/maps";
import { useData } from "@/lib/store/hooks";
import type { GeoPoint } from "@/lib/types";
import { buttonClass } from "./Button";

interface Props {
  point?: GeoPoint;
  address?: string;
  label?: string;
  mode?: TravelMode;
  children?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  /** Solo icona quando la posizione manca (liste). */
  compact?: boolean;
  /** Punto di partenza fisso (default: posizione attuale). */
  origin?: GeoPoint;
}

/** Apre Apple Maps / Google Maps già impostato sulla destinazione. */
export function NavButton({
  point,
  address,
  label,
  mode = "driving",
  children,
  size = "xl",
  variant = "primary",
  className = "",
  compact = false,
  origin,
}: Props) {
  const data = useData();
  const url = data ? navigationUrl(data.settings.mapsApp, { point, address, label }, mode, origin) : null;
  const Icon = mode === "walking" ? Footprints : Navigation;
  const content = (
    <>
      <Icon size={size === "xl" ? 30 : 22} strokeWidth={2.6} />
      {children ?? "NAVIGA"}
    </>
  );
  if (!url) {
    return (
      <span className={buttonClass("ghost", size, `opacity-50 ${className}`)} aria-disabled>
        <Navigation size={20} /> {compact ? <span className="sr-only">Posizione mancante</span> : "Posizione mancante"}
      </span>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)}>
      {content}
    </a>
  );
}
