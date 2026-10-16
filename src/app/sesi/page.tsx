import type { Metadata } from "next";

import { SessionScreen } from "@/components/sesi/session-screen";

export const metadata: Metadata = {
  title: "Sesi Foto",
};

export default function SesiPage() {
  return <SessionScreen />;
}
