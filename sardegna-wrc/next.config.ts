import type { NextConfig } from "next";

// Export statico: l'app è solo client-side (nessun backend) e può essere
// servita da qualsiasi hosting statico. Il service worker viene generato
// dopo la build (scripts/build-sw.mjs) con l'elenco completo dei file.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
