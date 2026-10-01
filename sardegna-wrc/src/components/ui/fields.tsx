"use client";

import { Check, Crosshair, Loader2, Star } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatPoint, getCurrentPoint, parsePoint } from "@/lib/geo";
import type { GeoPoint } from "@/lib/types";

// Campi dei form di modifica: grandi, leggibili, senza fronzoli.

const inputCls =
  "w-full min-h-14 rounded-xl border-2 border-line bg-surface px-4 text-[18px] text-text placeholder:text-muted/60 focus:border-accent focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[15px] text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  autoFocus,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={inputCls}
        value={value ?? ""}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        className={`${inputCls} py-3 leading-snug`}
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <Field label={suffix ? `${label} (${suffix})` : label}>
      <input
        className={`${inputCls} tnum`}
        type="number"
        inputMode="decimal"
        step={step}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".");
          onChange(v === "" ? undefined : Number(v));
        }}
      />
    </Field>
  );
}

export function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          className={`${inputCls} tnum`}
          type="time"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {value && (
          <button
            type="button"
            className="min-h-14 shrink-0 rounded-xl bg-surface-2 px-4 text-[16px] font-bold"
            onClick={() => onChange(undefined)}
          >
            Svuota
          </button>
        )}
      </div>
    </Field>
  );
}

export function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input className={`${inputCls} tnum`} type="date" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Field label={label}>
      <select
        className={`${inputCls} appearance-none`}
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || undefined) as T | undefined)}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Scelta rapida a pulsanti (niente menu a tendina). */
export function Chips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
}) {
  const body = (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-12 items-center gap-1.5 rounded-xl px-4 text-[17px] font-bold ${
              on ? "bg-accent text-accent-ink" : "bg-surface-2 text-text"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
  if (!label) return body;
  return (
    <div>
      <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {body}
    </div>
  );
}

export function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} su 5`}
            onClick={() => onChange(value === n ? undefined : n)}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2"
          >
            <Star
              size={30}
              className={value && n <= value ? "fill-accent text-hi" : "text-muted"}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Posizione: GPS attuale con un tocco, oppure incolla coordinate / link
 * di Google Maps o Apple Maps.
 */
export function PointInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: GeoPoint | undefined;
  onChange: (v: GeoPoint | undefined) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function useGps() {
    setBusy(true);
    setMsg(null);
    try {
      const p = await getCurrentPoint();
      onChange({ lat: p.lat, lng: p.lng });
      setMsg(`Posizione salvata (±${Math.round(p.accuracy)} m)`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function applyText(v: string) {
    setText(v);
    const p = parsePoint(v);
    if (p) {
      onChange(p);
      setMsg("Coordinate riconosciute");
    } else if (v.trim()) {
      setMsg("Formato non riconosciuto: es. 40.5580, 8.3190 o link Maps");
    } else {
      setMsg(null);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[15px] font-bold uppercase tracking-wide text-muted">{label}</span>
      <div className="space-y-2 rounded-2xl border-2 border-line bg-surface p-3">
        <div className="flex min-h-10 items-center gap-2 text-[18px] font-semibold">
          {value ? (
            <>
              <Check className="text-ok" size={22} strokeWidth={3} />
              <span className="tnum min-w-0 flex-1 truncate">{formatPoint(value)}</span>
              <button type="button" className="text-[16px] font-bold text-danger" onClick={() => onChange(undefined)}>
                Rimuovi
              </button>
            </>
          ) : (
            <span className="text-muted">Nessuna posizione</span>
          )}
        </div>
        <button
          type="button"
          onClick={useGps}
          disabled={busy}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[19px] font-bold text-accent-ink sun-border"
        >
          {busy ? <Loader2 className="animate-spin" size={24} /> : <Crosshair size={24} strokeWidth={2.6} />}
          Usa posizione attuale
        </button>
        <input
          className={inputCls}
          placeholder="…oppure incolla coordinate o link Maps"
          value={text}
          onChange={(e) => applyText(e.target.value)}
        />
        {msg && <p className="text-[15px] font-medium text-muted">{msg}</p>}
      </div>
    </div>
  );
}
