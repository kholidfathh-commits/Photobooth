import type { Metadata } from "next";

import { ResultScreen } from "@/components/hasil/result-screen";

export const metadata: Metadata = {
  title: "Hasil Foto",
};

export default function HasilPage() {
  return <ResultScreen />;
}
