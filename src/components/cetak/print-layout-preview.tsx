/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
import {
  computePrintLayout,
  PAPER_SIZES,
  type PrintSettings,
} from "@/lib/print-layout";
import { cn } from "@/lib/utils";

interface PrintLayoutPreviewProps {
  settings: PrintSettings;
  imageUrl: string;
  /** Ukuran photostrip (px) untuk rasio. */
  stripWidth: number;
  stripHeight: number;
  className?: string;
  /** Tampilkan keterangan kertas & ukuran strip di bawah pratinjau. */
  showCaption?: boolean;
}

/**
 * Pratinjau lembar cetak berskala: kertas putih dengan photostrip tersusun
 * sesuai pengaturan (ukuran kertas, orientasi, jumlah strip per lembar).
 */
export function PrintLayoutPreview({
  settings,
  imageUrl,
  stripWidth,
  stripHeight,
  className,
  showCaption = true,
}: PrintLayoutPreviewProps) {
  const layout = computePrintLayout(settings, stripWidth, stripHeight);
  const { paper } = layout;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative max-h-full w-full overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black/10"
        style={{ aspectRatio: `${paper.width} / ${paper.height}` }}
        aria-label={`Pratinjau cetak: ${layout.placements.length} photostrip di kertas ${settings.paperSize} ${settings.orientation}`}
        role="img"
      >
        {layout.placements.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: pct(p.x, paper.width),
              top: pct(p.y, paper.height),
              width: pct(p.width, paper.width),
              height: pct(p.height, paper.height),
            }}
          >
            <img
              src={imageUrl}
              alt=""
              className="absolute top-1/2 left-1/2 max-w-none"
              style={
                p.rotated
                  ? {
                      // Strip diputar 90°: lebar/tinggi asli ditukar terhadap kotak.
                      width: `${(p.height / p.width) * 100}%`,
                      height: `${(p.width / p.height) * 100}%`,
                      transform: "translate(-50%, -50%) rotate(90deg)",
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      transform: "translate(-50%, -50%)",
                    }
              }
            />
          </div>
        ))}
      </div>
      {showCaption && (
        <figcaption className="text-center text-xs text-neutral-400">
          {PAPER_SIZES[settings.paperSize].label} · {settings.orientation} ·{" "}
          {layout.placements.length} strip · lebar strip ±{layout.stripWidthMm}{" "}
          mm
        </figcaption>
      )}
    </figure>
  );
}
