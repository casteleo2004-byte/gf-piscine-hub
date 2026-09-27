import type { AnchorHTMLAttributes } from "react";
import { push } from "./router";

export default function Link({
  href,
  prefetch: _prefetch,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        push(href);
      }}
      {...rest}
    />
  );
}
