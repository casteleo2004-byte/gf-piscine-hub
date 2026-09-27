/**
 * URL di un file statico in public/. Nell'app è servito dalla radice ("/stages/…");
 * la demo a file singolo imposta NEXT_PUBLIC_ASSET_BASE="" per usare percorsi relativi.
 */
export function assetUrl(path: string): string {
  return (process.env.NEXT_PUBLIC_ASSET_BASE ?? "/") + path;
}
