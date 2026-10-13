"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "@/lib/asset";

/** Immagine statica: tocco = tutto schermo; doppio tocco a tutto schermo = zoom. */
export function ImageView({ src, alt, caption, className = "" }: { src: string; alt: string; caption?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const url = assetUrl(src);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`block w-full text-left ${className}`} aria-label={`Apri ${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading="lazy" className="aspect-[25/16] w-full rounded-2xl bg-surface-2 object-cover" />
        {caption && <span className="mt-1.5 block text-[15px] font-semibold text-muted">{caption}</span>}
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-label={alt}>
            <div className="pt-safe flex items-center gap-3 px-4 pb-2">
              <button
                type="button"
                aria-label="Chiudi"
                onClick={() => {
                  setOpen(false);
                  setZoom(false);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <X size={26} />
              </button>
              <span className="text-[15px] font-semibold text-white/80">{zoom ? "Doppio tocco per ridurre" : "Doppio tocco per ingrandire"}</span>
            </div>
            <div className={`flex-1 ${zoom ? "overflow-auto" : "flex items-center justify-center overflow-hidden"}`} onDoubleClick={() => setZoom(!zoom)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={alt} className={zoom ? "max-w-none" : "max-h-full max-w-full object-contain"} style={zoom ? { width: "260%" } : undefined} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
