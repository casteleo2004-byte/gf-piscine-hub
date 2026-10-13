import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "WRC Trip",
  description: "Sardegna WRC Trip Hub — programma, prove, luoghi e checklist del viaggio.",
  manifest: "/manifest.webmanifest",
  applicationName: "WRC Trip",
  appleWebApp: {
    capable: true,
    title: "WRC Trip",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/splash/iphone-16-pro-max.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/iphone-15-pro-max.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
    ],
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

// Applica il tema salvato prima del primo paint (evita flash).
const themeScript = `try{var d=JSON.parse(localStorage.getItem("wrc-hub:data")||"null");if(d&&d.settings&&d.settings.theme==="sun")document.documentElement.dataset.theme="sun"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <main className="pt-safe pb-nav mx-auto max-w-xl px-4">{children}</main>
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  );
}
