import type { Metadata } from "next";
import { WrcScreen } from "@/components/wrc/WrcScreen";

export const metadata: Metadata = { title: "WRC · WRC Trip" };

export default function Page() {
  return <WrcScreen />;
}
