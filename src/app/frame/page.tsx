import type { Metadata } from "next";

import { FrameScreen } from "@/components/frame/frame-screen";

export const metadata: Metadata = {
  title: "Pilih Frame",
};

export default function FramePage() {
  return <FrameScreen />;
}
