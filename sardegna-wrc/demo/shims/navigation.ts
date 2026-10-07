import { useUrl } from "./router";

export function usePathname(): string {
  return useUrl().pathname;
}

export function useSearchParams(): URLSearchParams {
  return useUrl().searchParams;
}
