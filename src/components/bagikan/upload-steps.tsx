import { Check, Loader2, X } from "lucide-react";

import type { UploadState } from "@/lib/upload";
import { cn } from "@/lib/utils";

type StepState = "selesai" | "berjalan" | "tersendat" | "gagal" | "menunggu";

interface Step {
  label: string;
  state: StepState;
}

function stepsFor(state: UploadState): Step[] {
  const upload: StepState =
    state.status === "berhasil"
      ? "selesai"
      : state.status === "gagal"
        ? "gagal"
        : state.status === "mengunggah"
          ? "berjalan"
          : "tersendat";
  return [
    { label: "Foto digabung", state: "selesai" },
    { label: "Unggah ke Drive", state: upload },
    {
      label: "QR siap",
      state: state.status === "berhasil" ? "selesai" : "menunggu",
    },
  ];
}

/**
 * Indikator tahapan unggah: Foto digabung → Unggah ke Drive → QR siap.
 * Tiap tahap bertanda centang (selesai), putaran (berjalan), silang (gagal),
 * atau bulatan kosong (menunggu).
 */
export function UploadSteps({ state }: { state: UploadState }) {
  const steps = stepsFor(state);
  return (
    <ol className="flex items-center gap-2" aria-label="Tahapan penyimpanan">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              step.state === "selesai" && "bg-emerald-500 text-white",
              step.state === "berjalan" && "bg-sky-500 text-white",
              step.state === "tersendat" && "bg-amber-500 text-white",
              step.state === "gagal" && "bg-red-500 text-white",
              step.state === "menunggu" && "bg-white/10 text-neutral-400",
            )}
            aria-hidden
          >
            {step.state === "selesai" && <Check className="size-4" />}
            {(step.state === "berjalan" || step.state === "tersendat") && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {step.state === "gagal" && <X className="size-4" />}
            {step.state === "menunggu" && i + 1}
          </span>
          <span
            className={cn(
              "text-sm whitespace-nowrap",
              step.state === "menunggu" ? "text-neutral-500" : "text-white",
            )}
          >
            {step.label}
            <span className="sr-only"> ({step.state})</span>
          </span>
          {i < steps.length - 1 && (
            <span
              className={cn(
                "h-0.5 w-4 rounded-full",
                step.state === "selesai" ? "bg-emerald-500" : "bg-white/10",
              )}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}
