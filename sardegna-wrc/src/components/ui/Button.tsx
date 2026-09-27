import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "rally";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink sun-border",
  secondary: "bg-surface-2 text-text",
  ghost: "bg-transparent text-text border-2 border-line",
  danger: "bg-transparent text-danger border-2 border-danger",
  rally: "bg-rally text-white",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-4 text-[17px] rounded-xl",
  lg: "min-h-14 px-5 text-[19px] rounded-2xl",
  xl: "min-h-[76px] px-6 text-[26px] rounded-2xl tracking-wide",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "lg", extra = "") {
  return `inline-flex items-center justify-center gap-2 font-bold active:opacity-70 disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant,
  size,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/** Piccola icona tonda (matita, chiudi…), con area di tocco ≥ 48px. */
export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text active:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
