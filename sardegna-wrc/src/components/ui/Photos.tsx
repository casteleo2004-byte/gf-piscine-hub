"use client";

import { Camera, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { deletePhoto, getPhoto, savePhoto } from "@/lib/photos";

/** Miniatura di una foto salvata in IndexedDB. */
export function PhotoThumb({ id, className = "", onClick }: { id: string; className?: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    getPhoto(id)
      .then((b) => {
        if (b) {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      })
      .catch(() => {});
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  return (
    <button type="button" onClick={onClick} className={`overflow-hidden rounded-xl bg-surface-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </button>
  );
}

/** Striscia di foto/screenshot con aggiunta (fotocamera o libreria) e visualizzazione a tutto schermo. */
export function PhotoStrip({
  ids,
  onChange,
  editable = true,
}: {
  ids: string[];
  onChange?: (ids: string[]) => void;
  editable?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length || !onChange) return;
    setBusy(true);
    const added: string[] = [];
    for (const f of Array.from(files)) {
      try {
        added.push(await savePhoto(f));
      } catch {}
    }
    setBusy(false);
    onChange([...ids, ...added]);
  }

  async function remove(id: string) {
    await deletePhoto(id).catch(() => {});
    onChange?.(ids.filter((x) => x !== id));
    setOpen(null);
  }

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {ids.map((id) => (
          <PhotoThumb key={id} id={id} className="h-28 w-28 shrink-0" onClick={() => setOpen(id)} />
        ))}
        {editable && onChange && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-[15px] font-bold text-muted"
          >
            {busy ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
            Foto
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col bg-black" onClick={() => setOpen(null)}>
            <div className="pt-safe flex justify-between px-4 pb-2">
              <button type="button" aria-label="Chiudi" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white">
                <X size={26} />
              </button>
              {editable && onChange && (
                <button
                  type="button"
                  aria-label="Elimina foto"
                  className="flex h-12 items-center gap-2 rounded-full bg-white/15 px-4 font-bold text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Eliminare questa foto?")) remove(open);
                  }}
                >
                  <Trash2 size={22} /> Elimina
                </button>
              )}
            </div>
            <PhotoFull id={open} />
          </div>,
          document.body,
        )}
    </div>
  );
}

function PhotoFull({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    getPhoto(id).then((b) => {
      if (b) {
        u = URL.createObjectURL(b);
        setUrl(u);
      }
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  return (
    <div className="flex flex-1 items-center justify-center p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" className="max-h-full max-w-full object-contain" />}
    </div>
  );
}
