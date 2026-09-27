// Crea demo/dist/index.html: tutta l'app in un solo file (JS + CSS inline).
// Richiede prima `next build` (per il CSS Tailwind compilato).
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const result = await build({
  entryPoints: ["demo/main.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "@": path.join(root, "src"),
    "next/link": path.join(root, "demo/shims/link.tsx"),
    "next/navigation": path.join(root, "demo/shims/navigation.ts"),
  },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const cssDir = "out/_next/static/chunks";
const css = fs
  .readdirSync(cssDir)
  .filter((f) => f.endsWith(".css"))
  .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
  .join("\n");

const html = `<title>Sardegna WRC Trip</title>
<style>${css}
html,body{background:var(--bg);color:var(--text)}</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.mkdirSync("demo/dist", { recursive: true });
fs.writeFileSync("demo/dist/index.html", html);
console.log(`demo/dist/index.html ${(html.length / 1024).toFixed(0)} KB`);
