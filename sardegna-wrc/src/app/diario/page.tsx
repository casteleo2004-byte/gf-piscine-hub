import type { Metadata } from "next";
import { DiaryScreen } from "@/components/diary/DiaryScreen";

export const metadata: Metadata = { title: "Diario · WRC Trip" };

export default function Page() {
  return <DiaryScreen />;
}
