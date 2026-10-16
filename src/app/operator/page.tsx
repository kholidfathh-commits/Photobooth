import type { Metadata } from "next";

import { OperatorScreen } from "@/components/operator/operator-screen";

export const metadata: Metadata = {
  title: "Pengaturan Operator",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  return <OperatorScreen />;
}
