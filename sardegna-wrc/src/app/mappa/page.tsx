import type { Metadata } from "next";
import { PlacesScreen } from "@/components/places/PlacesScreen";

export const metadata: Metadata = { title: "Mappa · WRC Trip" };

export default function Page() {
  return <PlacesScreen />;
}
