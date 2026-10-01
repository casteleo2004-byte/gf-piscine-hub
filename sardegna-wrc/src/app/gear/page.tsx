import type { Metadata } from "next";
import { Suspense } from "react";
import { GearScreen } from "@/components/gear/GearScreen";

export const metadata: Metadata = { title: "Gear · WRC Trip" };

export default function Page() {
  return (
    <Suspense>
      <GearScreen />
    </Suspense>
  );
}
