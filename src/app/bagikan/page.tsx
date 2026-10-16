import type { Metadata } from "next";

import { ShareScreen } from "@/components/bagikan/share-screen";

export const metadata: Metadata = {
  title: "Simpan & Bagikan",
};

export default function BagikanPage() {
  return <ShareScreen />;
}
