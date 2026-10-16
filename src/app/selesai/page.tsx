import type { Metadata } from "next";

import { ThanksScreen } from "@/components/selesai/thanks-screen";

export const metadata: Metadata = {
  title: "Terima Kasih",
};

export default function SelesaiPage() {
  return <ThanksScreen />;
}
