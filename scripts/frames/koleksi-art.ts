// Desain 50 frame koleksi Potretin (src/lib/frames/koleksi.ts). Tiap
// keluarga desain punya satu pembuat SVG; variannya mengatur detail.
// Koordinat dalam kanvas 1080×1920 (9:16).

import {
  LAYOUTS,
  TEXT_AREAS,
  type FrameTheme,
} from "../../src/lib/frames/themes";
import type { Family, KoleksiSpec } from "../../src/lib/frames/koleksi";
import {
  around,
  burst,
  flower,
  glow,
  H,
  heart,
  r1,
  rect,
  rng,
  softShadow,
  sparkle,
  sprig,
  svg,
  W,
  type Art,
  type FontKey,
  type WordFn,
  type WordOpts,
} from "./art";

type KBuilder = (k: KoleksiSpec, t: FrameTheme, word: WordFn) => Art;

// ---------------------------------------------------------------- bantuan

const slotsOf = (k: KoleksiSpec) => LAYOUTS[k.layout];
const areaOf = (k: KoleksiSpec) => TEXT_AREAS[k.layout];

/** Teks utama frame ("merek" → Potretin), atau null bila tanpa tulisan. */
const tulisan = (k: KoleksiSpec) => (k.teks === "merek" ? "Potretin" : k.teks);

/** Seed acak stabil dari id frame. */
const seedOf = (id: string) =>
  [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Pita kosong tempat tulisan: di bawah, di atas, atau kolom kanan. */
function zona(k: KoleksiSpec) {
  const s = slotsOf(k);
  const top = Math.min(...s.map((r) => r.y));
  const bottom = Math.max(...s.map((r) => r.y + r.height));
  if (k.layout === "tumpuk-3-kiri")
    return { kind: "kanan" as const, x1: 736, x2: W, y1: top, y2: bottom };
  if (k.layout.endsWith("-atas"))
    return { kind: "atas" as const, x1: 0, x2: W, y1: 0, y2: top };
  return { kind: "bawah" as const, x1: 0, x2: W, y1: bottom, y2: H };
}

/** Tulisan utama di area tata letaknya (kosong bila frame tanpa tulisan). */
function utama(
  k: KoleksiSpec,
  word: WordFn,
  o: Partial<WordOpts> & { font?: FontKey; scale?: number; text?: string } = {},
) {
  const text = o.text ?? tulisan(k);
  if (!text) return "";
  const a = areaOf(k);
  const sc = o.scale ?? 1;
  return word((o.font ?? k.font ?? "cormorant") as FontKey, text, {
    cx: a.cx,
    cy: a.cy,
    maxW: a.maxW * sc,
    maxH: a.maxH * sc,
    fill: k.ink,
    rotate: a.vertical ? 90 : undefined,
    ...o,
  });
}

/** Perkiraan setengah lebar teks tanggal (font sistem, dirender saat foto). */
function lebarTanggal(t: FrameTheme) {
  const n = t.date.format === "titik" ? 10 : 17;
  const em = t.date.font === "mono" ? 0.6 : 0.55;
  return (n * (t.date.size * em + t.date.spacing)) / 2;
}

/** Dua garis tipis mengapit tanggal. */
function garisTanggal(
  t: FrameTheme,
  color: string,
  o: { len?: number; gap?: number; width?: number; dot?: boolean } = {},
) {
  const half = lebarTanggal(t) + (o.gap ?? 28);
  const len = o.len ?? 110;
  const y = t.date.y;
  const x = t.date.x;
  const w = o.width ?? 1.5;
  let s =
    `<line x1="${r1(x - half - len)}" y1="${y}" x2="${r1(x - half)}" y2="${y}" stroke="${color}" stroke-width="${w}"/>` +
    `<line x1="${r1(x + half)}" y1="${y}" x2="${r1(x + half + len)}" y2="${y}" stroke="${color}" stroke-width="${w}"/>`;
  if (o.dot) {
    for (const dx of [-half - len - 12, half + len + 12]) {
      s += `<rect x="${r1(x + dx - 4)}" y="${y - 4}" width="8" height="8" transform="rotate(45 ${r1(x + dx)} ${y})" fill="${color}"/>`;
    }
  }
  return s;
}

/** Pil (kapsul) di belakang tanggal. */
function pilTanggal(t: FrameTheme, attrs: string, padX = 44, h?: number) {
  const half = lebarTanggal(t) + padX;
  const hh = h ?? t.date.size * 2.1;
  return rect(t.date.x - half, t.date.y - hh / 2, half * 2, hh, attrs, hh / 2);
}

/** Tanda sudut berbentuk L di keempat pojok kanvas. */
function sudut(inset: number, len: number, color: string, w = 2) {
  const p = (x: number, y: number, dx: number, dy: number) =>
    `<path d="M ${x} ${y + dy * len} L ${x} ${y} L ${x + dx * len} ${y}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
  return (
    p(inset, inset, 1, 1) +
    p(W - inset, inset, -1, 1) +
    p(inset, H - inset, 1, -1) +
    p(W - inset, H - inset, -1, -1)
  );
}

/** Butiran halus (grain) agar latar polos tidak terasa datar. */
function grain(seed: number, color: string, opacity: number, n = 1400) {
  const rand = rng(seed);
  let s = `<g fill="${color}">`;
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(0.5 + rand() * 1.4)}" fill-opacity="${r1(opacity * (0.4 + rand()))}"/>`;
  }
  return `${s}</g>`;
}

const blur = (id: string, std: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`;

/** Bingkai (mat) di sekeliling tiap slot. */
function mats(k: KoleksiSpec, pad: number, attrs: string, extraR = pad) {
  return slotsOf(k)
    .map((s) => around(s, pad, attrs, k.radius ? k.radius + extraR : 0))
    .join("");
}

function bintang(cx: number, cy: number, r: number, attrs: string) {
  return burst(cx, cy, r, r * 0.42, 5, attrs);
}

function kepingSalju(cx: number, cy: number, r: number, color: string) {
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)})" stroke="${color}" stroke-width="${r1(Math.max(2, r * 0.09))}" stroke-linecap="round" fill="none">`;
  for (let i = 0; i < 6; i++) {
    s += `<g transform="rotate(${i * 60})"><line x1="0" y1="0" x2="0" y2="${r1(-r)}"/><polyline points="${r1(-r * 0.25)},${r1(-r * 0.75)} 0,${r1(-r * 0.55)} ${r1(r * 0.25)},${r1(-r * 0.75)}"/></g>`;
  }
  return `${s}</g>`;
}

function balon(
  cx: number,
  cy: number,
  r: number,
  color: string,
  tali = "#9ca3af",
) {
  return (
    `<path d="M ${r1(cx)} ${r1(cy + r * 1.22)} C ${r1(cx - 18)} ${r1(cy + r * 1.7)} ${r1(cx + 18)} ${r1(cy + r * 2.1)} ${r1(cx)} ${r1(cy + r * 2.7)}" fill="none" stroke="${tali}" stroke-width="3"/>` +
    `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(r)}" ry="${r1(r * 1.2)}" fill="${color}"/>` +
    `<polygon points="${r1(cx - 9)},${r1(cy + r * 1.26)} ${r1(cx + 9)},${r1(cy + r * 1.26)} ${r1(cx)},${r1(cy + r * 1.14)}" fill="${color}"/>` +
    `<ellipse cx="${r1(cx - r * 0.35)}" cy="${r1(cy - r * 0.45)}" rx="${r1(r * 0.18)}" ry="${r1(r * 0.3)}" fill="#ffffff" fill-opacity="0.45" transform="rotate(-25 ${r1(cx - r * 0.35)} ${r1(cy - r * 0.45)})"/>`
  );
}

function kembangApi(cx: number, cy: number, r: number, color: string, n = 16) {
  let s = `<g stroke="${color}" stroke-linecap="round">`;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    s += `<line x1="${r1(cx + c * r * 0.35)}" y1="${r1(cy + sn * r * 0.35)}" x2="${r1(cx + c * r)}" y2="${r1(cy + sn * r)}" stroke-width="5"/>`;
    s += `<circle cx="${r1(cx + c * r * 1.14)}" cy="${r1(cy + sn * r * 1.14)}" r="4" fill="${color}" stroke="none"/>`;
  }
  return `${s}</g>`;
}

function bulanSabit(
  cx: number,
  cy: number,
  r: number,
  color: string,
  bg: string,
) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/><circle cx="${r1(cx + r * 0.38)}" cy="${r1(cy - r * 0.18)}" r="${r1(r * 0.86)}" fill="${bg}"/>`;
}

function lentera(
  cx: number,
  top: number,
  s: number,
  gold: string,
  glass: string,
) {
  const y = top;
  return (
    `<line x1="${cx}" y1="${y - 140}" x2="${cx}" y2="${y}" stroke="${gold}" stroke-width="3"/>` +
    `<path d="M ${cx - s * 0.32} ${y + s * 0.18} L ${cx} ${y} L ${cx + s * 0.32} ${y + s * 0.18} Z" fill="${gold}"/>` +
    rect(cx - s * 0.4, y + s * 0.18, s * 0.8, s * 0.12, `fill="${gold}"`) +
    `<path d="M ${cx - s * 0.36} ${y + s * 0.3} Q ${cx - s * 0.5} ${y + s * 0.75} ${cx - s * 0.36} ${y + s * 1.2} L ${cx + s * 0.36} ${y + s * 1.2} Q ${cx + s * 0.5} ${y + s * 0.75} ${cx + s * 0.36} ${y + s * 0.3} Z" fill="${glass}" stroke="${gold}" stroke-width="4"/>` +
    `<line x1="${cx}" y1="${y + s * 0.3}" x2="${cx}" y2="${y + s * 1.2}" stroke="${gold}" stroke-width="3"/>` +
    `<path d="M ${cx - s * 0.18} ${y + s * 0.3} Q ${cx - s * 0.3} ${y + s * 0.75} ${cx - s * 0.18} ${y + s * 1.2} M ${cx + s * 0.18} ${y + s * 0.3} Q ${cx + s * 0.3} ${y + s * 0.75} ${cx + s * 0.18} ${y + s * 1.2}" fill="none" stroke="${gold}" stroke-width="2.5"/>` +
    rect(cx - s * 0.4, y + s * 1.2, s * 0.8, s * 0.12, `fill="${gold}"`) +
    `<path d="M ${cx - s * 0.2} ${y + s * 1.32} L ${cx} ${y + s * 1.5} L ${cx + s * 0.2} ${y + s * 1.32} Z" fill="${gold}"/>`
  );
}

function topiWisuda(
  cx: number,
  cy: number,
  s: number,
  color: string,
  tassel: string,
) {
  return (
    `<path d="M ${cx - s * 0.32} ${cy + s * 0.05} L ${cx - s * 0.32} ${cy + s * 0.3} Q ${cx} ${cy + s * 0.45} ${cx + s * 0.32} ${cy + s * 0.3} L ${cx + s * 0.32} ${cy + s * 0.05} Z" fill="${color}"/>` +
    `<polygon points="${cx},${cy - s * 0.28} ${cx + s * 0.62},${cy} ${cx},${cy + s * 0.28} ${cx - s * 0.62},${cy}" fill="${color}" stroke="${tassel}" stroke-width="2"/>` +
    `<path d="M ${cx} ${cy} L ${cx + s * 0.48} ${cy + s * 0.08} L ${cx + s * 0.48} ${cy + s * 0.42}" fill="none" stroke="${tassel}" stroke-width="4"/>` +
    rect(cx + s * 0.44, cy + s * 0.4, s * 0.08, s * 0.16, `fill="${tassel}"`, 2)
  );
}

/** Garis bergelombang (squiggle) ala Memphis. */
function squiggle(
  x: number,
  y: number,
  len: number,
  color: string,
  rot = 0,
  amp = 18,
) {
  let d = `M ${x} ${y}`;
  const step = 34;
  for (let i = 0; i * step < len; i++) {
    d += ` q ${step / 2} ${i % 2 ? amp : -amp} ${step} 0`;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
}

/** Selotip transparan bergaris (lapisan depan). */
function tape(
  x: number,
  y: number,
  rot: number,
  color: string,
  w = 170,
  stripes = false,
) {
  let s = `<g transform="rotate(${rot} ${r1(x)} ${r1(y)})"><rect x="${r1(x - w / 2)}" y="${r1(y - 24)}" width="${w}" height="48" fill="${color}" fill-opacity="0.85"/>`;
  if (stripes) {
    for (let i = -w / 2 + 10; i < w / 2; i += 26) {
      s += `<line x1="${r1(x + i)}" y1="${r1(y - 24)}" x2="${r1(x + i + 14)}" y2="${r1(y + 24)}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="7"/>`;
    }
  }
  return `${s}</g>`;
}

/** Hiasan pinggir (titik acak) hanya di luar slot. */
function diLuarSlot(k: KoleksiSpec, x: number, y: number, pad: number) {
  return !slotsOf(k).some(
    (s) =>
      x > s.x - pad &&
      x < s.x + s.width + pad &&
      y > s.y - pad &&
      y < s.y + s.height + pad,
  );
}

/** Titik (x, y) tidak menabrak tulisan utama maupun baris tanggal. */
function diLuarTeks(k: KoleksiSpec, t: FrameTheme, x: number, y: number) {
  const b = kotakTeks(k, 40, 30);
  const a = areaOf(k);
  const inText = a.vertical
    ? x > 736 && y > 171 && y < 1749
    : x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
  const half = lebarTanggal(t) + 60;
  const inDate = Math.abs(y - t.date.y) < 50 && Math.abs(x - t.date.x) < half;
  return !inText && !inDate;
}

/** Kotak sekitar teks utama (untuk label/pil di belakang tulisan). */
function kotakTeks(k: KoleksiSpec, padX: number, padY: number) {
  const a = areaOf(k);
  return {
    x: a.cx - a.maxW / 2 - padX,
    y: a.cy - a.maxH / 2 - padY,
    w: a.maxW + padX * 2,
    h: a.maxH + padY * 2,
  };
}

// ---------------------------------------------------------------- keluarga

const minimal: KBuilder = (k, t, word) => {
  const gelap = k.varian === "gelap";
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);
  body += grain(seedOf(k.id), gelap ? "#ffffff" : "#3b2f20", 0.05, 1600);
  body += sudut(36, 64, k.accent, 2);
  body += mats(
    k,
    14,
    `fill="none" stroke="${k.accent}" stroke-opacity="0.6" stroke-width="1.5"`,
  );
  const teks = tulisan(k);
  if (teks) {
    body += utama(k, word, { spacing: 0.06, scale: 0.86 });
    body += garisTanggal(t, k.accent, { len: 70, gap: 22, width: 1.2 });
  } else {
    body += garisTanggal(t, k.accent, { len: 120, gap: 30, dot: true });
  }
  return { back: svg(body) };
};

const editorial: KBuilder = (k, t, word) => {
  const z = zona(k);
  const meta = (
    text: string,
    cx: number,
    cy: number,
    maxW = 200,
    fill = k.ink,
  ) =>
    word("montserrat", text, { cx, cy, maxW, maxH: 17, fill, spacing: 0.22 });
  const hr = (x1: number, x2: number, y: number, w: number) =>
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${k.ink}" stroke-width="${w}"/>`;
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);
  body += grain(seedOf(k.id), k.ink, 0.03, 900);

  if (k.varian === "kolom") {
    body += meta("EDISI SPESIAL", 180, 70);
    body += meta("VOL. 01", 940, 70, 120);
    body += hr(56, W - 56, 112, 4) + hr(56, W - 56, 124, 1.2);
    body += rect(776, z.y1, 30, 30, `fill="${k.accent}"`);
    body += utama(k, word, { cx: 916, spacing: 0.04 });
    body += meta("PHOTO", 908, z.y2 - 40, 110, k.accent);
    body += hr(56, W - 56, 1792, 1.2);
    body += meta("NO. 01", 150, t.date.y, 110);
    body += meta("PORTRAIT", 930, t.date.y, 150);
  } else if (k.varian === "judul") {
    const a = areaOf(k);
    const top = a.cy - a.maxH / 2;
    body += meta("VOL. 01", 150, top - 34, 120);
    body += meta("EDISI SPESIAL", 900, top - 34, 220);
    body += hr(80, W - 80, top - 12, 4);
    body += utama(k, word, { spacing: 0.01, scale: 1.04 });
    body += hr(80, W - 80, t.date.y - 32, 1.2);
    body += meta("NO. 01", 150, t.date.y + 2, 110);
    body += meta("PHOTO", 930, t.date.y + 2, 120);
  } else {
    body += hr(80, W - 80, z.y1 + 46, 4);
    body += rect(80, z.y1 + 58, 140, 12, `fill="${k.accent}"`);
    body += utama(k, word, { spacing: 0.12, scale: 0.92 });
    body += hr(80, W - 80, t.date.y - 48, 1.2);
    body += meta("VOL. 01", 170, t.date.y, 130);
    body += meta("EDISI SPESIAL", 910, t.date.y, 200);
  }
  return { back: svg(body) };
};

const GRADIEN: Record<
  string,
  { stops: string[]; blobs: string[]; dir: string }
> = {
  "gradien-peach": {
    stops: ["#fff1e8", "#ffd3bd", "#ffadad"],
    blobs: ["#ffffff", "#ffc09f"],
    dir: `x1="0" y1="0" x2="0.4" y2="1"`,
  },
  "gradien-samudra": {
    stops: ["#e8f6ff", "#a5d8ff", "#5c9ded"],
    blobs: ["#ffffff", "#74c0fc"],
    dir: `x1="0" y1="0" x2="0" y2="1"`,
  },
  "gradien-aurora": {
    stops: ["#05081c", "#0b1838", "#0d2a40"],
    blobs: ["#34d399", "#818cf8", "#22d3ee"],
    dir: `x1="0" y1="0" x2="0" y2="1"`,
  },
  "gradien-lilac": {
    stops: ["#f6efff", "#e4d1ff", "#fbc6e6"],
    blobs: ["#ffffff", "#f5b5ff"],
    dir: `x1="0" y1="0" x2="1" y2="1"`,
  },
  "gradien-mint": {
    stops: ["#f0fdf6", "#c3f5d6", "#9eeedc"],
    blobs: ["#ffffff", "#7ee8c9"],
    dir: `x1="0" y1="0" x2="0.3" y2="1"`,
  },
  "gradien-mentari": {
    stops: ["#fffbe6", "#ffe08a", "#ffad6b"],
    blobs: ["#ffffff", "#ffd166"],
    dir: `x1="0" y1="0" x2="0" y2="1"`,
  },
};

const gradien: KBuilder = (k, t, word) => {
  const g = GRADIEN[k.id];
  const gelap = k.varian === "gelap";
  const defs =
    `<linearGradient id="bg" ${g.dir}>${g.stops
      .map(
        (c, i) =>
          `<stop offset="${i / (g.stops.length - 1)}" stop-color="${c}"/>`,
      )
      .join("")}</linearGradient>` +
    blur("bl", gelap ? 70 : 90) +
    softShadow("sh") +
    glow("gl", 10);
  let body = rect(0, 0, W, H, `fill="url(#bg)"`);
  const rand = rng(seedOf(k.id));
  let blobs = "";
  if (gelap) {
    // pita aurora miring
    g.blobs.forEach((c, i) => {
      blobs += `<ellipse cx="${300 + i * 260}" cy="${380 + i * 520}" rx="520" ry="140" fill="${c}" fill-opacity="0.45" transform="rotate(${-28 + i * 12} ${300 + i * 260} ${380 + i * 520})"/>`;
    });
  } else {
    for (let i = 0; i < 6; i++) {
      blobs += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(180 + rand() * 220)}" fill="${g.blobs[i % g.blobs.length]}" fill-opacity="${r1(0.35 + rand() * 0.3)}"/>`;
    }
  }
  body += `<g filter="url(#bl)">${blobs}</g>`;
  if (gelap) {
    for (let i = 0; i < 260; i++) {
      body += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(0.6 + rand() * 1.8)}" fill="#ffffff" fill-opacity="${r1(0.25 + rand() * 0.6)}"/>`;
    }
    body += mats(
      k,
      12,
      `fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"`,
    );
  } else {
    body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff" fill-opacity="0.92"`)}</g>`;
  }
  if (tulisan(k)) {
    body += utama(
      k,
      word,
      gelap
        ? { fill: "#e9fff8", filter: "gl", spacing: 0.08, scale: 0.8 }
        : { spacing: 0.02 },
    );
    body += garisTanggal(t, k.ink, { len: 60, gap: 20, width: 1.5 });
  } else {
    body += pilTanggal(t, `fill="#ffffff" fill-opacity="0.75"`);
    for (const dx of [-1, 1]) {
      body += sparkle(
        t.date.x + dx * (lebarTanggal(t) + 90),
        t.date.y,
        22,
        `fill="${k.ink}" fill-opacity="0.7"`,
      );
    }
  }
  return { back: svg(body, defs) };
};

const tekstur: KBuilder = (k, t, word) => {
  const rand = rng(seedOf(k.id));
  const sl = slotsOf(k);
  let defs = softShadow("sh");
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);
  let front = "";

  switch (k.varian) {
    case "linen": {
      for (let y = 0; y < H; y += 4) {
        body += `<line x1="0" y1="${y}" x2="${W}" y2="${r1(y + rand() * 2 - 1)}" stroke="${rand() < 0.5 ? "#ffffff" : "#8a7a62"}" stroke-opacity="${r1(0.06 + rand() * 0.1)}" stroke-width="1.2"/>`;
      }
      for (let x = 0; x < W; x += 4) {
        body += `<line x1="${x}" y1="0" x2="${r1(x + rand() * 2 - 1)}" y2="${H}" stroke="${rand() < 0.5 ? "#ffffff" : "#8a7a62"}" stroke-opacity="${r1(0.04 + rand() * 0.08)}" stroke-width="1.2"/>`;
      }
      body += `<g filter="url(#sh)">${mats(k, 22, `fill="#fbf8f2"`)}</g>`;
      body += utama(k, word, { spacing: 0.08, scale: 0.86 });
      body += garisTanggal(t, k.accent, { len: 60, gap: 22, width: 1.2 });
      break;
    }
    case "kotak": {
      defs += `<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#93c5fd" stroke-opacity="0.55" stroke-width="1.5"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#grid)"`);
      body += `<line x1="52" y1="0" x2="52" y2="${H}" stroke="${k.accent}" stroke-opacity="0.7" stroke-width="3"/>`;
      body += `<g filter="url(#sh)">${mats(k, 16, `fill="#ffffff"`)}</g>`;
      body += utama(k, word, { scale: 0.85 });
      const a = areaOf(k);
      body += `<path d="M ${a.cx - 230} ${a.cy + 74} C ${a.cx - 80} ${a.cy + 92} ${a.cx + 90} ${a.cy + 90} ${a.cx + 240} ${a.cy + 62}" fill="none" stroke="${k.accent}" stroke-width="6" stroke-linecap="round"/>`;
      body += heart(a.cx + 300, a.cy - 40, 60, `fill="${k.accent}"`, 14);
      body += bintang(
        a.cx - 310,
        a.cy - 30,
        26,
        `fill="none" stroke="${k.ink}" stroke-width="4" stroke-linejoin="round"`,
      );
      front = sl
        .map(
          (s, i) =>
            tape(s.x + 70, s.y - 4, i % 2 ? 9 : -12, "#fde68a") +
            tape(
              s.x + s.width - 70,
              s.y + s.height + 4,
              i % 2 ? -8 : 11,
              "#bfdbfe",
            ),
        )
        .join("");
      break;
    }
    case "jurnal": {
      defs += `<pattern id="dot" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="2.4" fill="#a8a29e" fill-opacity="0.6"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#dot)"`);
      body += `<g filter="url(#sh)">${mats(k, 16, `fill="#ffffff"`, 6)}</g>`;
      body += utama(k, word, { scale: 0.9 });
      const a = areaOf(k);
      body += sparkle(a.cx - 330, a.cy - 10, 26, `fill="${k.accent}"`);
      body += sparkle(a.cx + 330, a.cy + 6, 20, `fill="#93c5fd"`);
      body += heart(
        a.cx + 290,
        a.cy - 44,
        34,
        `fill="none" stroke="${k.ink}" stroke-width="0.09"`,
        -10,
      );
      front = sl
        .map((s, i) =>
          i % 2
            ? tape(s.x + s.width - 50, s.y + 26, 38, "#f9a8d4", 180, true)
            : tape(s.x + 50, s.y + 26, -38, "#a7f3d0", 180, true),
        )
        .join("");
      break;
    }
    case "beton": {
      defs += blur("bl", 30);
      let blot = "";
      for (let i = 0; i < 26; i++) {
        blot += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(60 + rand() * 160)}" fill="${rand() < 0.5 ? "#6b7280" : "#d1d5db"}" fill-opacity="${r1(0.18 + rand() * 0.2)}"/>`;
      }
      body += `<g filter="url(#bl)">${blot}</g>`;
      body += grain(seedOf(k.id) + 1, "#1f2937", 0.18, 3500);
      body += grain(seedOf(k.id) + 2, "#ffffff", 0.14, 1500);
      for (let i = 0; i < 6; i++) {
        const y = 60 + rand() * (H - 120);
        body += `<circle cx="38" cy="${r1(y)}" r="7" fill="#4b5563" fill-opacity="0.5"/><circle cx="${W - 38}" cy="${r1(y)}" r="7" fill="#4b5563" fill-opacity="0.5"/>`;
      }
      body += mats(k, 10, `fill="#111827"`);
      const b = kotakTeks(k, -60, -8);
      body += rect(b.x, b.y, b.w, b.h, `fill="${k.accent}"`);
      body += utama(k, word, { text: "POTRETIN", spacing: 0.24, scale: 0.6 });
      body += garisTanggal(t, k.ink, { len: 80, gap: 20, width: 3 });
      break;
    }
    case "kayu": {
      for (let y = -20; y < H + 20; y += 14) {
        let d = `M 0 ${r1(y)}`;
        let yy = y;
        for (let x = 0; x <= W; x += 60) {
          yy += rand() * 6 - 3;
          d += ` L ${x} ${r1(yy)}`;
        }
        const dark = rand() < 0.55;
        body += `<path d="${d}" fill="none" stroke="${dark ? "#5c3a1e" : "#b07a50"}" stroke-opacity="${r1(0.2 + rand() * 0.3)}" stroke-width="${r1(2 + rand() * 6)}"/>`;
      }
      for (let i = 0; i < 4; i++) {
        const cx = rand() * W;
        const cy = rand() * H;
        body += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="38" ry="14" fill="none" stroke="#4a2e17" stroke-opacity="0.35" stroke-width="4"/><ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="18" ry="6" fill="#4a2e17" fill-opacity="0.35"/>`;
      }
      body += `<g filter="url(#sh)">${mats(k, 20, `fill="#fdf6e3"`)}</g>`;
      body += utama(k, word, {
        shadow: { dx: 0, dy: 6, fill: "#3b2414" },
        spacing: 0.02,
      });
      body += garisTanggal(t, k.ink, { len: 90, gap: 22, width: 2, dot: true });
      const pin = (x: number, y: number, c: string) =>
        `<circle cx="${x + 4}" cy="${y + 6}" r="20" fill="#000000" fill-opacity="0.25"/><circle cx="${x}" cy="${y}" r="20" fill="${c}"/><circle cx="${x - 6}" cy="${y - 6}" r="6" fill="#ffffff" fill-opacity="0.6"/>`;
      front = sl
        .map((s, i) =>
          pin(s.x + s.width / 2, s.y - 2, ["#dc2626", "#2563eb", "#16a34a"][i]),
        )
        .join("");
      break;
    }
  }
  return { back: svg(body, defs), front: front ? svg(front) : undefined };
};

const pola: KBuilder = (k, t, word) => {
  const rand = rng(seedOf(k.id));
  const sl = slotsOf(k);
  let defs = softShadow("sh");
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);

  switch (k.varian) {
    case "garis": {
      const cols = ["#7c2d12", "#c2410c", "#ea580c", "#f59e0b", "#fcd34d"];
      cols.forEach((c, i) => {
        body += rect(i * 30, 0, 30, H, `fill="${c}"`);
        body += rect(W - (i + 1) * 30, 0, 30, H, `fill="${c}"`);
      });
      body += mats(k, 14, `fill="#fdf0d5"`);
      body += mats(k, 14, `fill="none" stroke="#7c2d12" stroke-width="4"`);
      body += utama(k, word, {
        shadow: { dx: 6, dy: 6, fill: "#fcd34d" },
        scale: 0.92,
      });
      break;
    }
    case "catur": {
      defs += `<pattern id="cb" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#ffffff"/><rect width="60" height="60" fill="#111111"/><rect x="60" y="60" width="60" height="60" fill="#111111"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#cb)"`);
      body += mats(k, 18, `fill="#ffffff"`);
      body += mats(k, 18, `fill="none" stroke="#111111" stroke-width="4"`);
      body += pilTanggal(
        t,
        `fill="#111111" stroke="#ffffff" stroke-width="6"`,
        60,
        110,
      );
      break;
    }
    case "terrazzo": {
      const chips = [
        "#e76f51",
        "#2a9d8f",
        "#e9c46a",
        "#264653",
        "#f4a261",
        "#d8c3a5",
      ];
      for (let i = 0; i < 520; i++) {
        const cx = rand() * W;
        const cy = rand() * H;
        const r = 4 + rand() * (rand() < 0.15 ? 26 : 12);
        const n = 4 + Math.floor(rand() * 3);
        const pts: string[] = [];
        for (let j = 0; j < n; j++) {
          const a = (Math.PI * 2 * j) / n + rand() * 0.6;
          const rr = r * (0.6 + rand() * 0.5);
          pts.push(`${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)}`);
        }
        body += `<polygon points="${pts.join(" ")}" fill="${chips[Math.floor(rand() * chips.length)]}" fill-opacity="${r1(0.7 + rand() * 0.3)}"/>`;
      }
      body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff"`)}</g>`;
      body += pilTanggal(t, `fill="#ffffff"`, 56, 96);
      break;
    }
    case "polkadot": {
      defs += `<pattern id="pd" width="70" height="70" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="9" fill="#f1faee" fill-opacity="0.9"/><circle cx="52" cy="52" r="9" fill="#f1faee" fill-opacity="0.9"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#pd)"`);
      body += mats(k, 14, `fill="#f1faee"`);
      const b = kotakTeks(k, 20, 40);
      body += rect(b.x, b.y, b.w, b.h + 140, `fill="${k.bg}"`, 60);
      body += utama(k, word, { shadow: { dx: 0, dy: 6, fill: "#e63946" } });
      break;
    }
    case "ombak": {
      for (let y = 20; y < H; y += 46) {
        let d = `M -20 ${y}`;
        for (let x = -20; x < W + 40; x += 80) d += ` q 20 -16 40 0 t 40 0`;
        body += `<path d="${d}" fill="none" stroke="${k.accent}" stroke-opacity="0.28" stroke-width="4"/>`;
      }
      body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff"`)}</g>`;
      const b = kotakTeks(k, 10, 30);
      body += rect(
        b.x,
        b.y,
        b.w,
        t.date.y + 60 - b.y,
        `fill="#ffffff" fill-opacity="0.9"`,
        40,
      );
      body += utama(k, word, { scale: 0.86 });
      body += garisTanggal(t, k.accent, { len: 70, gap: 20, width: 2 });
      break;
    }
    case "memphis": {
      const cols = ["#f43f5e", "#facc15", "#3b82f6", "#10b981", "#111111"];
      for (let i = 0; i < 160; i++) {
        const x = rand() * W;
        const y = rand() * H;
        if (!diLuarSlot(k, x, y, 40) || !diLuarTeks(k, t, x, y)) continue;
        const c = cols[Math.floor(rand() * cols.length)];
        const type = Math.floor(rand() * 4);
        if (type === 0) body += squiggle(x, y, 90, c, rand() * 180, 14);
        else if (type === 1)
          body += `<polygon points="${r1(x)},${r1(y - 22)} ${r1(x + 22)},${r1(y + 16)} ${r1(x - 22)},${r1(y + 16)}" fill="${c}" transform="rotate(${r1(rand() * 360)} ${r1(x)} ${r1(y)})"/>`;
        else if (type === 2)
          body += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(10 + rand() * 12)}" fill="none" stroke="${c}" stroke-width="7"/>`;
        else
          body += rect(
            x,
            y,
            34,
            12,
            `fill="${c}" transform="rotate(${r1(rand() * 180)} ${r1(x)} ${r1(y)})"`,
          );
      }
      body += sl
        .map((s) =>
          rect(s.x + 16, s.y + 16, s.width, s.height, `fill="#111111"`),
        )
        .join("");
      body += sl
        .map((s) =>
          around(s, 4, `fill="none" stroke="#111111" stroke-width="8"`),
        )
        .join("");
      body += utama(k, word, {
        shadow: { dx: 8, dy: 8, fill: "#facc15" },
        scale: 0.9,
      });
      break;
    }
    case "gingham": {
      defs += `<pattern id="gh" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#ffffff"/><rect width="30" height="60" fill="${k.accent}" fill-opacity="0.35"/><rect width="60" height="30" fill="${k.accent}" fill-opacity="0.35"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#gh)"`);
      body += mats(k, 14, `fill="#ffffff"`);
      const b = kotakTeks(k, 30, 6);
      body += rect(
        b.x,
        b.y,
        b.w,
        t.date.y + 36 - b.y,
        `fill="#ffffff" stroke="${k.ink}" stroke-width="6"`,
        50,
      );
      body += utama(k, word, { scale: 0.82 });
      break;
    }
  }
  return { back: svg(body, defs) };
};

const film: KBuilder = (k, t, word) => {
  const sl = slotsOf(k);
  let defs = "";
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);
  let front = "";

  switch (k.varian) {
    case "sepia": {
      defs += blur("bl", 80);
      body += `<g filter="url(#bl)"><circle cx="40" cy="260" r="230" fill="#ff7a1a" fill-opacity="0.55"/><circle cx="${W}" cy="1500" r="260" fill="#ffb347" fill-opacity="0.4"/></g>`;
      for (let y = 26; y < H - 40; y += 104) {
        body += rect(62, y, 52, 68, `fill="#f3d9a4" fill-opacity="0.92"`, 9);
        body += rect(
          W - 114,
          y,
          52,
          68,
          `fill="#f3d9a4" fill-opacity="0.92"`,
          9,
        );
      }
      sl.forEach((s, i) => {
        body += word("spaceMono", `${12 + i}`, {
          cx: 158,
          cy: s.y + s.height - 30,
          maxW: 60,
          maxH: 24,
          fill: k.accent,
        });
        body += word("spaceMono", `${12 + i}A`, {
          cx: W - 158,
          cy: s.y + 30,
          maxW: 70,
          maxH: 24,
          fill: k.accent,
        });
      });
      body += word("spaceMono", "SAFETY FILM 135", {
        cx: 540,
        cy: 38,
        maxW: 280,
        maxH: 18,
        fill: k.accent,
        spacing: 0.2,
      });
      body += utama(k, word, { text: "POTRETIN", spacing: 0.3, scale: 0.8 });
      body += grain(seedOf(k.id), "#f3d9a4", 0.12, 1800);
      break;
    }
    case "instan": {
      defs += softShadow("sh");
      body += grain(seedOf(k.id), "#ffffff", 0.06, 2200);
      body += `<g filter="url(#sh)">${mats(k, 22, `fill="#fafafa"`)}</g>`;
      body += utama(k, word, { fill: "#ffffff", scale: 0.92 });
      const a = areaOf(k);
      body += `<path d="M ${a.cx - 210} ${a.cy + 78} C ${a.cx - 60} ${a.cy + 96} ${a.cx + 80} ${a.cy + 94} ${a.cx + 220} ${a.cy + 70}" fill="none" stroke="${k.accent}" stroke-width="7" stroke-linecap="round"/>`;
      for (const [dx, dy, s] of [
        [-330, -30, 30],
        [-290, 40, 16],
        [320, -40, 26],
        [350, 30, 14],
      ] as const) {
        body += sparkle(a.cx + dx, a.cy + dy, s, `fill="${k.accent}"`);
      }
      front = sl
        .map((s, i) =>
          tape(s.x + s.width / 2, s.y - 8, i % 2 ? 3 : -4, "#fef3c7", 200),
        )
        .join("");
      break;
    }
    case "bioskop": {
      defs += glow("gl", 6);
      const bulb = (x: number, y: number) =>
        `<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="#fde68a" filter="url(#gl)"/>`;
      let bulbs = "";
      for (let x = 30; x <= W - 30; x += 52)
        bulbs += bulb(x, 26) + bulb(x, H - 26);
      for (let y = 78; y <= H - 78; y += 52)
        bulbs += bulb(26, y) + bulb(W - 26, y);
      body += bulbs;
      const z = zona(k);
      body += rect(90, 70, W - 180, z.y2 - 120, `fill="${k.accent}"`, 18);
      body += rect(
        104,
        84,
        W - 208,
        z.y2 - 148,
        `fill="none" stroke="#fde68a" stroke-width="3"`,
        12,
      );
      body += utama(k, word, {
        cy: areaOf(k).cy + 10,
        spacing: 0.1,
        scale: 0.86,
      });
      body += mats(k, 10, `fill="none" stroke="#fef3c7" stroke-width="3"`);
      break;
    }
    case "vhs": {
      for (let y = 0; y < H; y += 6)
        body += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#000000" stroke-opacity="0.25" stroke-width="2"/>`;
      body += word("spaceMono", "PLAY", {
        cx: 120,
        cy: 92,
        maxW: 110,
        maxH: 30,
        fill: "#e2e8f0",
      });
      body += `<polygon points="190,74 222,92 190,110" fill="#e2e8f0"/>`;
      body += word("spaceMono", "SP 00:00:24", {
        cx: 600,
        cy: 92,
        maxW: 260,
        maxH: 26,
        fill: "#e2e8f0",
      });
      body += `<circle cx="1010" cy="92" r="14" fill="${k.accent}"/>`;
      const bars = [
        "#e2e8f0",
        "#facc15",
        "#22d3ee",
        "#22c55e",
        "#d946ef",
        "#ef4444",
        "#2563eb",
      ];
      bars.forEach((c, i) => {
        body += rect(776 + i * 38, 1640, 38, 109, `fill="${c}"`);
      });
      const a = areaOf(k);
      const txt = tulisan(k)!;
      for (const [dx, c] of [
        [-6, "#ef4444"],
        [6, "#22d3ee"],
      ] as const) {
        body += word("spaceMono", txt, {
          cx: 908 + dx,
          cy: 820,
          maxW: 1100,
          maxH: 150,
          fill: c,
          rotate: 90,
          spacing: 0.1,
        });
      }
      body += word("spaceMono", txt, {
        cx: 908,
        cy: 820,
        maxW: 1100,
        maxH: 150,
        fill: "#f8fafc",
        rotate: 90,
        spacing: 0.1,
      });
      body += `<polygon points="860,${a.cy + 520} 908,${a.cy + 490} 908,${a.cy + 550}" fill="${k.accent}"/><polygon points="908,${a.cy + 520} 956,${a.cy + 490} 956,${a.cy + 550}" fill="${k.accent}"/>`;
      body += sl
        .map((s) =>
          around(
            s,
            6,
            `fill="none" stroke="#e2e8f0" stroke-opacity="0.5" stroke-width="2"`,
          ),
        )
        .join("");
      break;
    }
  }
  return { back: svg(body, defs), front: front ? svg(front) : undefined };
};

const mewah: KBuilder = (k, t, word) => {
  const rand = rng(seedOf(k.id));
  const sl = slotsOf(k);
  const gold = `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e08a"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#a67c1a"/></linearGradient>`;
  let defs = gold;
  let body = "";
  const G = `url(#gold)`;

  const ornamenSudut = (inset: number, s: number) => {
    let o = "";
    for (const [x, y, sx, sy] of [
      [inset, inset, 1, 1],
      [W - inset, inset, -1, 1],
      [inset, H - inset, 1, -1],
      [W - inset, H - inset, -1, -1],
    ]) {
      o += `<g transform="translate(${x} ${y}) scale(${sx * s} ${sy * s})" fill="none" stroke="${G}" stroke-width="${r1(3 / s)}"><path d="M0 60 Q0 0 60 0"/><path d="M0 100 Q10 10 100 0"/><circle cx="26" cy="26" r="7" fill="${G}"/></g>`;
    }
    return o;
  };

  switch (k.varian) {
    case "marmer": {
      defs += blur("bl", 3) + softShadow("sh");
      body += rect(0, 0, W, H, `fill="${k.bg}"`);
      let veins = "";
      for (let i = 0; i < 14; i++) {
        let x = rand() * W;
        let y = rand() * H;
        let d = `M ${r1(x)} ${r1(y)}`;
        for (let j = 0; j < 8; j++) {
          x += 60 + rand() * 120;
          y += rand() * 160 - 40;
          d += ` Q ${r1(x - 40 + rand() * 80)} ${r1(y - 60 + rand() * 120)} ${r1(x)} ${r1(y)}`;
        }
        veins += `<path d="${d}" fill="none" stroke="${rand() < 0.3 ? "#c9a227" : "#9ca3af"}" stroke-opacity="${r1(0.25 + rand() * 0.35)}" stroke-width="${r1(1 + rand() * 4)}" transform="rotate(${r1(20 + rand() * 30)} 540 960)"/>`;
      }
      body += `<g filter="url(#bl)">${veins}</g>`;
      body += rect(
        30,
        30,
        W - 60,
        H - 60,
        `fill="none" stroke="${G}" stroke-width="3"`,
      );
      body += rect(
        42,
        42,
        W - 84,
        H - 84,
        `fill="none" stroke="${G}" stroke-width="1.2"`,
      );
      body += `<g filter="url(#sh)">${mats(k, 12, `fill="#ffffff"`)}</g>`;
      body += mats(k, 12, `fill="none" stroke="${G}" stroke-width="3"`);
      body += utama(k, word, { fill: G, scale: 1.1 });
      body += garisTanggal(t, "#c9a227", {
        len: 80,
        gap: 22,
        width: 1.5,
        dot: true,
      });
      break;
    }
    case "deco": {
      body += rect(0, 0, W, H, `fill="${k.bg}"`);
      // kipas art deco di sudut atas & bawah
      for (const [cx, cy, rot] of [
        [0, 0, 0],
        [W, 0, 90],
        [W, H, 180],
        [0, H, 270],
      ] as const) {
        let fan = `<g transform="translate(${cx} ${cy}) rotate(${rot})" fill="none" stroke="${G}" stroke-width="2.5">`;
        for (let r = 60; r <= 150; r += 30)
          fan += `<path d="M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}"/>`;
        for (let a = 0; a <= 90; a += 15) {
          const rad = (a * Math.PI) / 180;
          fan += `<line x1="0" y1="0" x2="${r1(Math.cos(rad) * 150)}" y2="${r1(Math.sin(rad) * 150)}"/>`;
        }
        body += `${fan}</g>`;
      }
      body += rect(
        24,
        24,
        W - 48,
        H - 48,
        `fill="none" stroke="${G}" stroke-width="2"`,
      );
      sl.forEach((s) => {
        const p = 12;
        const c = 22;
        const x1 = s.x - p;
        const y1 = s.y - p;
        const x2 = s.x + s.width + p;
        const y2 = s.y + s.height + p;
        body += `<path d="M ${x1 + c} ${y1} L ${x2 - c} ${y1} L ${x2 - c} ${y1 + 8} L ${x2 - 8} ${y1 + 8} L ${x2 - 8} ${y1 + c} L ${x2} ${y1 + c} L ${x2} ${y2 - c} L ${x2 - 8} ${y2 - c} L ${x2 - 8} ${y2 - 8} L ${x2 - c} ${y2 - 8} L ${x2 - c} ${y2} L ${x1 + c} ${y2} L ${x1 + c} ${y2 - 8} L ${x1 + 8} ${y2 - 8} L ${x1 + 8} ${y2 - c} L ${x1} ${y2 - c} L ${x1} ${y1 + c} L ${x1 + 8} ${y1 + c} L ${x1 + 8} ${y1 + 8} L ${x1 + c} ${y1 + 8} Z" fill="none" stroke="${G}" stroke-width="3"/>`;
      });
      body += utama(k, word, {
        text: "POTRETIN",
        fill: G,
        spacing: 0.3,
        scale: 0.78,
      });
      const a = areaOf(k);
      for (const dx of [-1, 1]) {
        body += `<polygon points="${a.cx + dx * 330},${a.cy} ${a.cx + dx * 300},${a.cy - 12} ${a.cx + dx * 270},${a.cy} ${a.cx + dx * 300},${a.cy + 12}" fill="${G}"/>`;
      }
      body += garisTanggal(t, "#d4af37", { len: 60, gap: 20, width: 1.5 });
      break;
    }
    case "zamrud":
    case "beludru": {
      defs += `<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${k.soft}"/><stop offset="0.6" stop-color="${k.bg}"/><stop offset="1" stop-color="#000000" stop-opacity="1"/></radialGradient>`;
      body +=
        rect(0, 0, W, H, `fill="${k.bg}"`) +
        rect(0, 0, W, H, `fill="url(#bg)" fill-opacity="0.85"`);
      body += grain(seedOf(k.id), "#ffffff", 0.04, 1600);
      body += rect(
        34,
        34,
        W - 68,
        H - 68,
        `fill="none" stroke="${G}" stroke-width="2"`,
      );
      body += ornamenSudut(34, 1.2);
      body += mats(k, 12, `fill="none" stroke="${G}" stroke-width="3"`);
      body += mats(k, 22, `fill="none" stroke="${G}" stroke-width="1"`, 22);
      if (tulisan(k)) {
        body += utama(k, word, { fill: G, scale: 1.05 });
        body += garisTanggal(t, "#d4af37", {
          len: 70,
          gap: 22,
          width: 1.5,
          dot: true,
        });
      } else {
        const y = t.date.y;
        body += garisTanggal(t, "#d4af37", {
          len: 150,
          gap: 34,
          width: 1.5,
          dot: true,
        });
        body += `<g transform="translate(540 ${y - 80})">${flower(0, 0, 30, "none", "#d4af37")}</g>`;
        body += `<path d="M 470 ${y - 80} Q 505 ${y - 110} 520 ${y - 80} M 610 ${y - 80} Q 575 ${y - 110} 560 ${y - 80}" fill="none" stroke="${G}" stroke-width="2.5"/>`;
        body += `<circle cx="540" cy="${y - 80}" r="10" fill="${G}"/>`;
        body += `<path d="M 380 ${y + 80} Q 540 ${y + 120} 700 ${y + 80}" fill="none" stroke="${G}" stroke-width="2"/>`;
      }
      break;
    }
  }
  return { back: svg(body, defs) };
};

const acara: KBuilder = (k, t, word) => {
  const rand = rng(seedOf(k.id));
  const sl = slotsOf(k);
  const a = areaOf(k);
  let defs = softShadow("sh");
  let body = rect(0, 0, W, H, `fill="${k.bg}"`);
  let front = "";
  const sebar = (
    n: number,
    draw: (x: number, y: number, i: number) => string,
    pad = 24,
  ) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = rand() * W;
      const y = rand() * H;
      if (diLuarSlot(k, x, y, pad) && diLuarTeks(k, t, x, y))
        s += draw(x, y, i);
    }
    return s;
  };

  switch (k.varian) {
    case "ulang-tahun": {
      const cols = [
        "#f06595",
        "#fcc419",
        "#4dabf7",
        "#69db7c",
        "#b197fc",
        "#ff922b",
      ];
      body += sebar(320, (x, y, i) =>
        i % 2
          ? rect(
              x,
              y,
              16,
              8,
              `fill="${cols[i % cols.length]}" transform="rotate(${r1(rand() * 180)} ${r1(x)} ${r1(y)})"`,
            )
          : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(4 + rand() * 4)}" fill="${cols[i % cols.length]}"/>`,
      );
      body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff"`)}</g>`;
      body += balon(96, 1600, 50, "#f06595") + balon(172, 1690, 38, "#4dabf7");
      body += balon(984, 1600, 50, "#fcc419") + balon(908, 1690, 38, "#69db7c");
      body += utama(k, word, {
        stroke: { color: "#ffffff", width: 10 },
        maxW: 600,
      });
      body += pilTanggal(
        t,
        `fill="#ffffff" stroke="${k.accent}" stroke-width="3"`,
        40,
      );
      return { back: svg(body, defs) };
    }
    case "pernikahan": {
      body += rect(
        28,
        28,
        W - 56,
        H - 56,
        `fill="none" stroke="${k.accent}" stroke-width="2"`,
      );
      body += rect(
        40,
        40,
        W - 80,
        H - 80,
        `fill="none" stroke="${k.accent}" stroke-width="1"`,
      );
      body +=
        sprig(70, 262, 28, 170, "#9caf88", "#b5c4a3") +
        sprig(70, 262, 80, 130, "#9caf88", "#c8d5b9");
      body +=
        sprig(W - 70, 262, -28, 170, "#9caf88", "#b5c4a3") +
        sprig(W - 70, 262, -80, 130, "#9caf88", "#c8d5b9");
      body +=
        flower(74, 256, 30, "#f4dede", "#e9c46a", 10) +
        flower(W - 74, 256, 30, "#f4dede", "#e9c46a", 30);
      body += mats(k, 12, `fill="none" stroke="${k.accent}" stroke-width="2"`);
      body += utama(k, word, { cy: a.cy - 10, maxW: 500, maxH: 120 });
      body += garisTanggal(t, k.accent, {
        len: 80,
        gap: 22,
        width: 1.2,
        dot: true,
      });
      // cincin
      body += `<g fill="none" stroke="${k.accent}" stroke-width="4"><circle cx="526" cy="${H - 34}" r="14"/><circle cx="548" cy="${H - 34}" r="14"/></g>`;
      return { back: svg(body, defs) };
    }
    case "wisuda": {
      body += grain(seedOf(k.id), "#ffffff", 0.04, 1200);
      body += rect(
        30,
        30,
        W - 60,
        H - 60,
        `fill="none" stroke="${k.accent}" stroke-width="2"`,
      );
      body += topiWisuda(540, 66, 92, k.accent, "#ffffff");
      body +=
        sprig(96, 340, 12, 210, k.accent) +
        sprig(W - 96, 340, -12, 210, k.accent);
      body += utama(k, word, { cy: a.cy + 6, maxW: 640, maxH: 120 });
      body += garisTanggal(t, k.accent, { len: 50, gap: 20, width: 1.5 });
      body += mats(k, 12, `fill="none" stroke="${k.accent}" stroke-width="3"`);
      for (const [x, y] of [
        [44, 1880],
        [W - 44, 1880],
        [44, 440],
        [W - 44, 440],
      ])
        body += sparkle(x, y, 14, `fill="${k.accent}"`);
      return { back: svg(body, defs) };
    }
    case "lebaran": {
      defs += `<pattern id="isl" width="120" height="120" patternUnits="userSpaceOnUse"><g fill="none" stroke="${k.accent}" stroke-opacity="0.12" stroke-width="2"><rect x="35" y="35" width="50" height="50"/><rect x="35" y="35" width="50" height="50" transform="rotate(45 60 60)"/><circle cx="60" cy="60" r="12"/></g></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#isl)"`);
      body += mats(
        k,
        12,
        `fill="${k.bg}" stroke="${k.accent}" stroke-width="3"`,
      );
      body += bulanSabit(540, 1555, 34, k.accent, k.bg);
      body += bintang(572, 1538, 10, `fill="${k.accent}"`);
      body += lentera(112, 1600, 110, k.accent, "#0b6149");
      body += lentera(968, 1600, 110, k.accent, "#0b6149");
      body += utama(k, word, { cy: a.cy + 20, maxW: 660, maxH: 160 });
      body += garisTanggal(t, k.accent, {
        len: 60,
        gap: 22,
        width: 1.5,
        dot: true,
      });
      return { back: svg(body, defs) };
    }
    case "natal": {
      body += sebar(
        60,
        (x, y) => kepingSalju(x, y, 10 + rand() * 18, "#ffffff"),
        30,
      );
      body += `<g filter="url(#sh)">${mats(k, 12, `fill="#ffffff"`)}</g>`;
      const holly = (x: number, y: number) =>
        `<ellipse cx="${x - 26}" cy="${y}" rx="30" ry="12" fill="${k.accent}" transform="rotate(-20 ${x - 26} ${y})"/><ellipse cx="${x + 26}" cy="${y}" rx="30" ry="12" fill="${k.accent}" transform="rotate(20 ${x + 26} ${y})"/><circle cx="${x - 6}" cy="${y - 8}" r="9" fill="#ef4444" stroke="#ffffff" stroke-width="2"/><circle cx="${x + 8}" cy="${y - 4}" r="9" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>`;
      body += holly(110, 1780) + holly(970, 1780);
      body += utama(k, word, { cy: a.cy - 4, scale: 1.05 });
      return { back: svg(body, defs) };
    }
    case "tahun-baru": {
      defs += glow("gl", 5);
      body += sebar(
        200,
        (x, y) =>
          `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.8 + rand() * 1.8)}" fill="#ffffff" fill-opacity="${r1(0.3 + rand() * 0.6)}"/>`,
        6,
      );
      body += `<g filter="url(#gl)">${kembangApi(130, 1262, 58, k.ink)}${kembangApi(950, 1250, 70, k.accent, 20)}${kembangApi(880, 1800, 66, "#7dd3fc", 14)}${kembangApi(190, 1790, 56, k.accent, 12)}</g>`;
      body += mats(k, 10, `fill="none" stroke="${k.ink}" stroke-width="3"`);
      body += utama(k, word, { maxW: 620, maxH: 160 });
      body += garisTanggal(t, k.ink, {
        len: 70,
        gap: 22,
        width: 1.5,
        dot: true,
      });
      return { back: svg(body, defs) };
    }
    case "valentine": {
      body += sebar(
        70,
        (x, y) =>
          heart(
            x,
            y,
            24 + rand() * 30,
            `fill="${rand() < 0.5 ? k.accent : "#ffffff"}" fill-opacity="0.85"`,
            rand() * 40 - 20,
          ),
        30,
      );
      body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff"`)}</g>`;
      body += utama(k, word, {
        stroke: { color: "#ffffff", width: 10 },
        scale: 0.9,
      });
      body +=
        heart(540 - lebarTanggal(t) - 40, t.date.y, 30, `fill="${k.ink}"`) +
        heart(540 + lebarTanggal(t) + 40, t.date.y, 30, `fill="${k.ink}"`);
      return { back: svg(body, defs) };
    }
    case "bestie": {
      defs += `<pattern id="st" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="30" height="60" fill="#ffffff" fill-opacity="0.12"/></pattern>`;
      body += rect(0, 0, W, H, `fill="url(#st)"`);
      body += sl
        .map((s) =>
          rect(
            s.x + 14,
            s.y + 14,
            s.width,
            s.height,
            `fill="#111111"`,
            k.radius,
          ),
        )
        .join("");
      body += mats(k, 6, `fill="none" stroke="#111111" stroke-width="7"`, 6);
      body += utama(k, word, {
        cx: 916,
        fill: k.accent,
        stroke: { color: "#111111", width: 8 },
        shadow: { dx: 10, dy: -10, fill: "#111111" },
        spacing: 0.04,
      });
      body += bintang(
        908,
        120,
        46,
        `fill="${k.accent}" stroke="#111" stroke-width="5"`,
      );
      body += pilTanggal(t, `fill="#111111"`, 40);
      const smiley = (x: number, y: number, r: number) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#facc15" stroke="#111" stroke-width="5"/><circle cx="${x - r * 0.33}" cy="${y - r * 0.2}" r="${r * 0.1}" fill="#111"/><circle cx="${x + r * 0.33}" cy="${y - r * 0.2}" r="${r * 0.1}" fill="#111"/><path d="M ${x - r * 0.45} ${y + r * 0.18} Q ${x} ${y + r * 0.62} ${x + r * 0.45} ${y + r * 0.18}" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>`;
      const [s1, s2, s3] = sl;
      front =
        smiley(s1.x + s1.width - 20, s1.y + 20, 52) +
        heart(
          s2.x + 30,
          s2.y + s2.height - 20,
          90,
          `fill="#ef4444" stroke="#111" stroke-width="0.05"`,
          -16,
        ) +
        bintang(
          s3.x + s3.width - 30,
          s3.y + 30,
          50,
          `fill="${k.accent}" stroke="#111" stroke-width="5"`,
        ) +
        sparkle(
          s3.x + 40,
          s3.y + s3.height - 10,
          30,
          `fill="#ffffff" stroke="#111" stroke-width="0.12"`,
        );
      return { back: svg(body, defs), front: svg(front) };
    }
    case "keluarga": {
      body += grain(seedOf(k.id), "#7c4a1e", 0.05, 1400);
      body += `<g filter="url(#sh)">${mats(k, 14, `fill="#ffffff"`)}</g>`;
      body +=
        sprig(110, 1880, 20, 260, "#a3b18a", "#b7c49b") +
        sprig(W - 110, 1880, -20, 260, "#a3b18a", "#b7c49b");
      body +=
        sprig(60, 1700, 30, 150, "#a3b18a", "#d4a373") +
        sprig(W - 60, 1700, -30, 150, "#a3b18a", "#d4a373");
      body += utama(k, word, { cy: a.cy - 10, scale: 0.92 });
      for (const dx of [-1, 1])
        body += heart(
          t.date.x + dx * (lebarTanggal(t) + 36),
          t.date.y + 2,
          26,
          `fill="${k.accent}"`,
        );
      return { back: svg(body, defs) };
    }
  }
  return { back: svg(body, defs), front: front ? svg(front) : undefined };
};

const FAMILIES: Record<Family, KBuilder> = {
  minimal,
  editorial,
  gradien,
  tekstur,
  pola,
  film,
  mewah,
  acara,
};

export function buildKoleksiArt(
  spec: KoleksiSpec,
  theme: FrameTheme,
  word: WordFn,
): Art {
  return FAMILIES[spec.family](spec, theme, word);
}
