import type { ReactNode } from "react";

/** Etichetta piccola + valore grande, per orari e tempi. */
export function Stat({
  label,
  value,
  tone = "text",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "text" | "accent" | "rally" | "warn" | "ok";
  hint?: string;
}) {
  const color = { text: "text-text", accent: "text-hi", rally: "text-rally", warn: "text-warn", ok: "text-ok" }[tone];
  return (
    <div className="min-w-0">
      <div className="text-[14px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className={`tnum text-[26px] font-extrabold leading-tight ${color}`}>
        {value}
        {hint && <span className="ml-1 align-middle text-[15px] font-semibold text-muted">{hint}</span>}
      </div>
    </div>
  );
}
