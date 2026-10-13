/**
 * URL di un file statico in public/. Nell'app è servito dalla radice ("/stages/…");
 * la demo a file singolo imposta NEXT_PUBLIC_ASSET_BASE="" per usare percorsi relativi.
 */
export function assetUrl(path: string): string {
  // La demo può incorporare i file come data URI (globale impostato da demo/build.mjs).
  const embedded = (globalThis as { __WRC_ASSETS__?: Record<string, string> }).__WRC_ASSETS__;
  if (embedded?.[path]) return embedded[path];
  return (process.env.NEXT_PUBLIC_ASSET_BASE ?? "/") + path;
}
