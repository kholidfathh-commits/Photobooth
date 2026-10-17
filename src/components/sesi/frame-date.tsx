"use client";

import { useEffect, useState } from "react";

import { dateFont, formatFrameDate } from "@/lib/frames/resolve";
import { CANVAS, type DateStyle } from "@/lib/frames/themes";

/**
 * Tanggal hari ini di pratinjau frame, di posisi & gaya yang sama dengan
 * hasil akhir. Induknya harus `container-type: inline-size` (ukuran huruf
 * mengikuti lebar pratinjau).
 */
export function FrameDate({ style }: { style: DateStyle }) {
  // Tanggal baru diketahui di browser (hindari beda hasil server/klien).
  const [text, setText] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tanggal lokal perangkat
    setText(formatFrameDate(new Date(), style.format));
  }, [style.format]);

  const unit = (v: number) => `${(v / CANVAS.width) * 100}cqw`;
  const translate =
    style.align === "center" ? "-50%" : style.align === "right" ? "-100%" : "0";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute whitespace-nowrap leading-none"
      style={{
        left: `${(style.x / CANVAS.width) * 100}%`,
        top: `${(style.y / CANVAS.height) * 100}%`,
        transform: `translate(${translate}, -50%)`,
        font: dateFont(style).replace(/\d+px/, unit(style.size)),
        letterSpacing: unit(style.spacing),
        color: style.color,
      }}
    >
      {text}
    </span>
  );
}
