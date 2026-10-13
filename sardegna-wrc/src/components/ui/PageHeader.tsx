import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-start gap-3 pb-4 pt-1">
      <div className="min-w-0 flex-1">
        <h1 className="text-[32px] font-extrabold leading-tight">{title}</h1>
        {subtitle && <div className="mt-0.5 text-[17px] font-medium text-muted">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2 pt-1">{right}</div>}
    </header>
  );
}
