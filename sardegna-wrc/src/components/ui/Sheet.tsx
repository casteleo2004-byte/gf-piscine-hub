"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Barra azioni fissa in basso (es. SALVA). */
  footer?: ReactNode;
  headerRight?: ReactNode;
}

/** Schermata a tutto schermo sopra la sezione corrente (dettagli e modifiche). */
export function Sheet({ title, onClose, children, footer, headerRight }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal aria-label={title}>
      <header className="pt-safe border-b border-line">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pb-3">
          <IconButton label="Chiudi" onClick={onClose}>
            <X size={26} strokeWidth={2.6} />
          </IconButton>
          <h2 className="min-w-0 flex-1 truncate text-[22px] font-bold">{title}</h2>
          {headerRight}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-xl px-4 py-4">{children}</div>
      </div>
      {footer && (
        <footer className="border-t border-line bg-bg pb-safe">
          <div className="mx-auto flex max-w-xl gap-3 px-4 pt-3">{footer}</div>
        </footer>
      )}
    </div>,
    document.body,
  );
}
