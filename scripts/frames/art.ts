// Desain 18 frame Potretin dalam bentuk SVG (latar + lapisan depan).
// Dipakai oleh scripts/build-frames.ts untuk membuat gambar WebP di
// public/frames/<id>/. Semua koordinat dalam kanvas 1080×1920 (9:16).

import type { Font, Glyph } from "opentype.js";

import {
  CANVAS,
  LAYOUTS,
  type FrameTheme,
  type SlotRect,
} from "../../src/lib/frames/themes";

const W = CANVAS.width;
const H = CANVAS.height;

export type FontKey =
  | "playfair"
  | "greatVibes"
  | "spaceMono"
  | "monoton"
  | "pacifico"
  | "marker"
  | "lobster"
  | "shrikhand"
  | "yeseva"
  | "bungee"
  | "bebas"
  | "caveat"
  | "dancing"
  | "fredoka"
  | "fredokaBold"
  | "rubikMono"
  | "righteous"
  | "abril";

export type Fonts = Record<FontKey, Font>;

export interface Art {
  back: string;
  front?: string;
}

// ---------------------------------------------------------------- utilitas

/** PRNG kecil berbiji agar hiasan acak selalu sama tiap build. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function svg(body: string, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${
    defs ? `<defs>${defs}</defs>` : ""
  }${body}</svg>`;
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  attrs: string,
  rx = 0,
) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" ry="${rx}" ${attrs}/>`;
}

/** Kotak di sekeliling slot, melebar `pad` px. */
function around(s: SlotRect, pad: number, attrs: string, rx = 0) {
  return rect(
    s.x - pad,
    s.y - pad,
    s.width + pad * 2,
    s.height + pad * 2,
    attrs,
    rx,
  );
}

function heart(cx: number, cy: number, size: number, attrs: string, rot = 0) {
  return `<path transform="translate(${r1(cx)} ${r1(cy)}) rotate(${rot}) scale(${r1(size)})" d="M0 0.38 C-0.62 -0.02 -0.5 -0.66 0 -0.32 C0.5 -0.66 0.62 -0.02 0 0.38 Z" ${attrs}/>`;
}

/** Bintang 4 sudut (kilau). */
function sparkle(cx: number, cy: number, size: number, attrs: string) {
  return `<path transform="translate(${r1(cx)} ${r1(cy)}) scale(${r1(size)})" d="M0 -1 C0.12 -0.25 0.25 -0.12 1 0 C0.25 0.12 0.12 0.25 0 1 C-0.12 0.25 -0.25 0.12 -1 0 C-0.25 -0.12 -0.12 -0.25 0 -1 Z" ${attrs}/>`;
}

/** Bintang ledakan (starburst) n sudut. */
function burst(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  n: number,
  attrs: string,
) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${r1(cx + r * Math.cos(a))},${r1(cy + r * Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(" ")}" ${attrs}/>`;
}

function flower(
  cx: number,
  cy: number,
  r: number,
  petal: string,
  center: string,
  rot = 0,
  petals = 5,
) {
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${rot})">`;
  for (let i = 0; i < petals; i++) {
    s += `<ellipse cx="0" cy="${r1(-r * 0.55)}" rx="${r1(r * 0.36)}" ry="${r1(r * 0.55)}" fill="${petal}" transform="rotate(${(360 / petals) * i})"/>`;
  }
  return `${s}<circle r="${r1(r * 0.26)}" fill="${center}"/></g>`;
}

/** Ranting daun: batang lengkung + daun berselang-seling. */
function sprig(
  x: number,
  y: number,
  angle: number,
  len: number,
  color: string,
  leafColor = color,
) {
  let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${angle})">`;
  s += `<path d="M0 0 Q ${r1(len * 0.15)} ${r1(-len * 0.5)} 0 ${r1(-len)}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  const leaves = 6;
  for (let i = 1; i <= leaves; i++) {
    const t = i / (leaves + 1);
    const ly = -len * t;
    const lx = len * 0.15 * 2 * t * (1 - t) * 2;
    const side = i % 2 ? 1 : -1;
    const sz = len * 0.13 * (1 - t * 0.4);
    s += `<ellipse cx="${r1(lx + side * sz * 0.9)}" cy="${r1(ly)}" rx="${r1(sz)}" ry="${r1(sz * 0.45)}" fill="${leafColor}" transform="rotate(${side * -35} ${r1(lx + side * sz * 0.9)} ${r1(ly)})"/>`;
  }
  s += `<ellipse cx="0" cy="${r1(-len - len * 0.06)}" rx="${r1(len * 0.06)}" ry="${r1(len * 0.11)}" fill="${leafColor}"/>`;
  return `${s}</g>`;
}

// ---------------------------------------------------------------- wordmark

type Cmd =
  | { type: "M" | "L"; x: number; y: number }
  | {
      type: "C";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | { type: "Q"; x1: number; y1: number; x: number; y: number }
  | { type: "Z" };

/** Ubah perintah path opentype ke atribut `d` SVG (tanpa optimasi apa pun). */
function pathData(commands: unknown[]): string {
  const n = (v: number) => (Math.round(v * 100) / 100).toString();
  return (commands as Cmd[])
    .map((c) => {
      switch (c.type) {
        case "M":
        case "L":
          return `${c.type}${n(c.x)} ${n(c.y)}`;
        case "C":
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        case "Q":
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case "Z":
          return "Z";
      }
    })
    .join("");
}

interface WordOpts {
  cx: number;
  cy: number;
  maxW: number;
  maxH: number;
  fill: string;
  /** Jarak antarhuruf, pecahan dari ukuran font. */
  spacing?: number;
  stroke?: { color: string; width: number };
  shadow?: { dx: number; dy: number; fill: string };
  /** Warna berbeda tiap huruf (berulang). */
  colors?: string[];
  rotate?: number;
  filter?: string;
}

/**
 * Teks diubah menjadi path vektor dari font aslinya, lalu diskalakan agar
 * pas di kotak (maxW × maxH) berpusat di (cx, cy). Hasilnya identik di
 * semua perangkat karena tidak bergantung font yang terpasang.
 */
export function makeWordmark(fonts: Fonts) {
  return (font: FontKey, text: string, o: WordOpts) => {
    const f = fonts[font];
    const size = 100;
    // Peta huruf satu per satu (tanpa fitur OpenType lanjutan yang tak didukung).
    const glyphs: Glyph[] = [...text].map((ch) => f.charToGlyph(ch));
    let x = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const parts: string[] = [];
    glyphs.forEach((g, i) => {
      if (i > 0)
        x += (f.getKerningValue(glyphs[i - 1], g) / f.unitsPerEm) * size;
      const p = g.getPath(x, 0, size);
      const bb = p.getBoundingBox();
      if (bb.x2 > bb.x1) {
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);
      }
      parts.push(pathData(p.commands));
      x +=
        ((g.advanceWidth ?? 0) / f.unitsPerEm) * size + (o.spacing ?? 0) * size;
    });
    const w = maxX - minX;
    const h = maxY - minY;
    const s = Math.min(o.maxW / w, o.maxH / h);
    const tx = o.cx - (minX + w / 2) * s;
    const ty = o.cy - (minY + h / 2) * s;

    const paint = (fill: string, withStroke: boolean) =>
      parts
        .map((d, i) => {
          const c = o.colors ? o.colors[i % o.colors.length] : fill;
          const st =
            withStroke && o.stroke
              ? ` stroke="${o.stroke.color}" stroke-width="${r1(o.stroke.width / s)}" stroke-linejoin="round" paint-order="stroke"`
              : "";
          return `<path d="${d}" fill="${c}"${st}/>`;
        })
        .join("");

    const inner = `transform="translate(${r1(tx)} ${r1(ty)}) scale(${Math.round(s * 1e4) / 1e4})"`;
    const rot = o.rotate
      ? ` transform="rotate(${o.rotate} ${o.cx} ${o.cy})"`
      : "";
    const filter = o.filter ? ` filter="url(#${o.filter})"` : "";
    const shadow = o.shadow
      ? `<g transform="translate(${o.shadow.dx} ${o.shadow.dy})"><g ${inner}>${parts
          .map((d) => `<path d="${d}" fill="${o.shadow!.fill}"/>`)
          .join("")}</g></g>`
      : "";
    return `<g${rot}${filter}>${shadow}<g ${inner}>${paint(o.fill, true)}</g></g>`;
  };
}

type WordFn = ReturnType<typeof makeWordmark>;

const glow = (id: string, std: number) =>
  `<filter id="${id}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${std}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const softShadow = (id: string) =>
  `<filter id="${id}" x="-10%" y="-10%" width="130%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dx="0" dy="8" result="o"/><feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

// ---------------------------------------------------------------- desain

type Builder = (t: FrameTheme, word: WordFn) => Art;

const slotsOf = (t: FrameTheme) => LAYOUTS[t.layout];

const DESIGNS: Record<string, Builder> = {
  "klasik-putih": (t, word) => {
    const body =
      rect(0, 0, W, H, `fill="#ffffff"`) +
      rect(
        30,
        30,
        W - 60,
        H - 60,
        `fill="none" stroke="#111" stroke-width="2"`,
      ) +
      rect(
        42,
        42,
        W - 84,
        H - 84,
        `fill="none" stroke="#111" stroke-width="1"`,
      ) +
      slotsOf(t)
        .map((s) =>
          around(s, 1, `fill="none" stroke="#d4d4d4" stroke-width="2"`, 8),
        )
        .join("") +
      `<line x1="200" y1="1775" x2="330" y2="1775" stroke="#111" stroke-width="2"/>` +
      `<line x1="750" y1="1775" x2="880" y2="1775" stroke="#111" stroke-width="2"/>` +
      `<rect x="333" y="1770" width="10" height="10" transform="rotate(45 338 1775)" fill="#111"/>` +
      `<rect x="737" y="1770" width="10" height="10" transform="rotate(45 742 1775)" fill="#111"/>` +
      word("playfair", "Potretin", {
        cx: 540,
        cy: 1775,
        maxW: 320,
        maxH: 86,
        fill: "#111111",
      });
    return { back: svg(body) };
  },

  "hitam-elegan": (t, word) => {
    const defs =
      `<radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#1b1b1b"/><stop offset="1" stop-color="#050505"/></radialGradient>` +
      `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e08a"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#a67c1a"/></linearGradient>`;
    let body =
      rect(0, 0, W, H, `fill="url(#bg)"`) +
      rect(
        28,
        28,
        W - 56,
        H - 56,
        `fill="none" stroke="url(#gold)" stroke-width="3"`,
      ) +
      rect(
        42,
        42,
        W - 84,
        H - 84,
        `fill="none" stroke="url(#gold)" stroke-width="1"`,
      );
    for (const [x, y] of [
      [28, 28],
      [W - 28, 28],
      [28, H - 28],
      [W - 28, H - 28],
    ]) {
      body += `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})" fill="url(#gold)"/>`;
    }
    body += slotsOf(t)
      .map((s) =>
        around(s, 10, `fill="none" stroke="url(#gold)" stroke-width="2"`, 10),
      )
      .join("");
    body += word("greatVibes", "Potretin", {
      cx: 540,
      cy: 1778,
      maxW: 470,
      maxH: 120,
      fill: "url(#gold)",
    });
    return { back: svg(body, defs) };
  },

  "film-analog": (t, word) => {
    let body = rect(0, 0, W, H, `fill="#141414"`);
    for (let y = 30; y < H - 40; y += 118) {
      body += rect(58, y, 60, 78, `fill="#ece6d6"`, 10);
      body += rect(W - 118, y, 60, 78, `fill="#ece6d6"`, 10);
    }
    const labels = ["24", "24A", "25", "25A", "26", "26A"];
    slotsOf(t).forEach((s, i) => {
      body += word("spaceMono", labels[i * 2], {
        cx: 158,
        cy: s.y + s.height / 2,
        maxW: 120,
        maxH: 26,
        fill: "#f59e0b",
        rotate: -90,
      });
      body += word("spaceMono", labels[i * 2 + 1], {
        cx: W - 158,
        cy: s.y + s.height / 2,
        maxW: 120,
        maxH: 26,
        fill: "#f59e0b",
        rotate: 90,
      });
      body += `<polygon points="${r1(s.x - 26)},${s.y + 20} ${r1(s.x - 12)},${s.y + 30} ${r1(s.x - 26)},${s.y + 40}" fill="#f59e0b"/>`;
    });
    body += word("spaceMono", "POTRETIN", {
      cx: 540,
      cy: 1770,
      maxW: 560,
      maxH: 58,
      fill: "#f59e0b",
      spacing: 0.25,
    });
    body += word("spaceMono", "ISO 400", {
      cx: 540,
      cy: 40,
      maxW: 120,
      maxH: 18,
      fill: "#6b6b6b",
      spacing: 0.2,
    });
    return { back: svg(body) };
  },

  "neon-malam": (t, word) => {
    const defs =
      `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0620"/><stop offset="1" stop-color="#22093f"/></linearGradient>` +
      glow("g", 9) +
      glow("g2", 14);
    let body = rect(0, 0, W, H, `fill="url(#bg)"`);
    for (let y = 1720; y < H; y += 28) {
      body += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#7c3aed" stroke-opacity="${r1(0.15 + ((y - 1720) / 200) * 0.35)}" stroke-width="2"/>`;
    }
    const colors = ["#ff3ea5", "#5ee7ff", "#ff3ea5"];
    slotsOf(t).forEach((s, i) => {
      body += `<g filter="url(#g)">${around(s, 14, `fill="none" stroke="${colors[i]}" stroke-width="6"`, 30)}</g>`;
    });
    const rand = rng(7);
    for (let i = 0; i < 40; i++) {
      const left = rand() < 0.5;
      const x = left ? 20 + rand() * 140 : W - 160 + rand() * 140;
      body += `<circle cx="${r1(x)}" cy="${r1(40 + rand() * 1640)}" r="${r1(1 + rand() * 2.5)}" fill="#ffffff" fill-opacity="${r1(0.3 + rand() * 0.6)}"/>`;
    }
    body += word("monoton", "Potretin", {
      cx: 540,
      cy: 1783,
      maxW: 600,
      maxH: 104,
      fill: "#ff3ea5",
      filter: "g2",
    });
    return { back: svg(body, defs) };
  },

  "pastel-manis": (t, word) => {
    const defs = `<pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="6" fill="#ffffff" fill-opacity="0.75"/><circle cx="36" cy="36" r="6" fill="#ffffff" fill-opacity="0.75"/></pattern>`;
    let body =
      rect(0, 0, W, H, `fill="#ffd6e7"`) +
      rect(0, 0, W, H, `fill="url(#dots)"`);
    body += slotsOf(t)
      .map((s) => around(s, 14, `fill="#ffffff"`, 40))
      .join("");
    const rand = rng(11);
    for (let i = 0; i < 22; i++) {
      const left = i % 2 === 0;
      const x = left ? 40 + rand() * 110 : W - 150 + rand() * 110;
      const y = 60 + rand() * 1620;
      body += heart(
        x,
        y,
        34 + rand() * 30,
        `fill="${rand() < 0.5 ? "#ff8fb8" : "#ffffff"}"`,
        rand() * 40 - 20,
      );
    }
    body += word("pacifico", "Potretin", {
      cx: 540,
      cy: 1776,
      maxW: 470,
      maxH: 118,
      fill: "#e0457b",
      stroke: { color: "#ffffff", width: 10 },
    });
    const front = svg(
      slotsOf(t)
        .map((s, i) =>
          heart(
            s.x + s.width - 6,
            s.y + 8,
            78,
            `fill="${i % 2 ? "#ff8fb8" : "#e0457b"}" stroke="#ffffff" stroke-width="0.06"`,
            14,
          ),
        )
        .join(""),
    );
    return { back: svg(body, defs), front };
  },

  "kertas-kraft": (t, word) => {
    const defs = softShadow("sh");
    let body = rect(0, 0, W, H, `fill="#c9a47c"`);
    const rand = rng(23);
    for (let i = 0; i < 2200; i++) {
      const dark = rand() < 0.6;
      body += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(0.6 + rand() * 1.8)}" fill="${dark ? "#6b4a2b" : "#f3e3c8"}" fill-opacity="${r1(0.12 + rand() * 0.25)}"/>`;
    }
    for (let i = 0; i < 60; i++) {
      const x = rand() * W;
      const y = rand() * H;
      body += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + 20 + rand() * 40)}" y2="${r1(y + rand() * 6 - 3)}" stroke="#7a5532" stroke-opacity="0.18" stroke-width="1"/>`;
    }
    body += `<g filter="url(#sh)">${slotsOf(t)
      .map((s) => around(s, 18, `fill="#f7f1e3"`))
      .join("")}</g>`;
    body += word("marker", "Potretin", {
      cx: 540,
      cy: 1775,
      maxW: 440,
      maxH: 108,
      fill: "#3b2a1a",
    });
    const tape = (x: number, y: number, rot: number) =>
      `<rect x="${r1(x - 80)}" y="${r1(y - 22)}" width="160" height="44" fill="#efe3c2" fill-opacity="0.82" transform="rotate(${rot} ${r1(x)} ${r1(y)})"/>`;
    const front = svg(
      slotsOf(t)
        .map(
          (s, i) =>
            tape(s.x + 40, s.y - 6, i % 2 ? 12 : -14) +
            tape(s.x + s.width - 40, s.y - 6, i % 2 ? -10 : 13),
        )
        .join(""),
    );
    return { back: svg(body, defs), front };
  },

  "laut-biru": (t, word) => {
    const defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="0.6" stop-color="#0e7dc2"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>`;
    let body = rect(0, 0, W, H, `fill="url(#bg)"`);
    const rand = rng(31);
    for (let i = 0; i < 30; i++) {
      const left = rand() < 0.5;
      const x = left ? 30 + rand() * 130 : W - 160 + rand() * 130;
      body += `<circle cx="${r1(x)}" cy="${r1(60 + rand() * 1600)}" r="${r1(6 + rand() * 18)}" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2"/>`;
    }
    const wave = (y: number, amp: number, fill: string) => {
      let d = `M0 ${y}`;
      for (let x = 0; x <= W; x += 135) {
        d += ` Q ${x + 67.5} ${(x / 135) % 2 ? y - amp : y + amp} ${x + 135} ${y}`;
      }
      return `<path d="${d} L ${W} ${H} L 0 ${H} Z" fill="${fill}"/>`;
    };
    body +=
      wave(1716, 22, "#ffffff22") +
      wave(1760, 18, "#ffffff22") +
      wave(1820, 14, "#0b2e6b66");
    body += slotsOf(t)
      .map((s) => around(s, 10, `fill="#ffffff" fill-opacity="0.92"`, 28))
      .join("");
    body += word("lobster", "Potretin", {
      cx: 540,
      cy: 1778,
      maxW: 450,
      maxH: 116,
      fill: "#ffffff",
      shadow: { dx: 4, dy: 5, fill: "#0c4a6e" },
    });
    return { back: svg(body, defs) };
  },

  "retro-70an": (t, word) => {
    let body = rect(0, 0, W, H, `fill="#fbefd5"`);
    const bands = ["#7c2d12", "#c2410c", "#ea8a1e", "#f4b942"];
    bands.forEach((c, i) => {
      const r = 380 - i * 68;
      body += `<path d="M ${540 - r} ${H} A ${r} ${r} 0 0 1 ${540 + r} ${H}" fill="none" stroke="${c}" stroke-width="62"/>`;
    });
    body += slotsOf(t)
      .map((s) =>
        around(s, 9, `fill="none" stroke="#7c2d12" stroke-width="4"`, 32),
      )
      .join("");
    body += word("shrikhand", "Potretin", {
      cx: 540,
      cy: 1300,
      maxW: 780,
      maxH: 200,
      fill: "#c2410c",
      shadow: { dx: 9, dy: 9, fill: "#7c2d12" },
    });
    return { back: svg(body) };
  },

  botani: (t, word) => {
    let body = rect(0, 0, W, H, `fill="#dfe8d8"`);
    body += slotsOf(t)
      .map((s) => around(s, 8, `fill="#f4f7f1"`, 22))
      .join("");
    body += sprig(90, H - 40, 18, 360, "#4d6b4f", "#6f8f68");
    body += sprig(W - 90, H - 40, -18, 360, "#4d6b4f", "#6f8f68");
    body += sprig(200, H - 30, 40, 240, "#4d6b4f", "#8fae86");
    body += sprig(W - 200, H - 30, -40, 240, "#4d6b4f", "#8fae86");
    body += `<line x1="330" y1="1525" x2="750" y2="1525" stroke="#2f4a32" stroke-width="2"/>`;
    body += word("yeseva", "Potretin", {
      cx: 540,
      cy: 1395,
      maxW: 660,
      maxH: 180,
      fill: "#2f4a32",
    });
    const [big, , right] = slotsOf(t);
    const front = svg(
      sprig(big.x + 10, big.y + 150, 150, 210, "#3f5c41", "#5c7f57") +
        sprig(
          right.x + right.width - 6,
          right.y + right.height - 120,
          -30,
          190,
          "#3f5c41",
          "#5c7f57",
        ),
    );
    return { back: svg(body), front };
  },

  "pop-ceria": (t, word) => {
    const defs = `<pattern id="ht" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="4" fill="#f59e0b"/></pattern>`;
    let body =
      rect(0, 0, W, H, `fill="#ffd60a"`) +
      rect(0, 1180, W, H - 1180, `fill="url(#ht)" fill-opacity="0.55"`);
    body += burst(
      150,
      1760,
      150,
      95,
      16,
      `fill="#ff4d8d" stroke="#111" stroke-width="6"`,
    );
    body += burst(
      W - 130,
      1790,
      110,
      70,
      14,
      `fill="#38bdf8" stroke="#111" stroke-width="6"`,
    );
    body += slotsOf(t)
      .map((s) => rect(s.x + 14, s.y + 14, s.width, s.height, `fill="#111"`))
      .join("");
    body += slotsOf(t)
      .map((s) => around(s, 4, `fill="none" stroke="#111" stroke-width="8"`))
      .join("");
    body += word("bungee", "POTRETIN", {
      cx: 540,
      cy: 1420,
      maxW: 820,
      maxH: 170,
      fill: "#111111",
      shadow: { dx: 10, dy: 10, fill: "#ff4d8d" },
    });
    body += rect(
      330,
      1666,
      420,
      68,
      `fill="#ffffff" stroke="#111" stroke-width="6"`,
      34,
    );
    return { back: svg(body, defs) };
  },

  monokrom: (t, word) => {
    let body =
      rect(0, 0, W, H, `fill="#f4f4f4"`) +
      rect(0, 1545, W, H - 1545, `fill="#0a0a0a"`);
    body += slotsOf(t)
      .map((s) => around(s, 0, `fill="none" stroke="#0a0a0a" stroke-width="3"`))
      .join("");
    body += `<line x1="80" y1="1790" x2="${W - 80}" y2="1790" stroke="#f4f4f4" stroke-opacity="0.35" stroke-width="2"/>`;
    body += word("bebas", "POTRETIN", {
      cx: 540,
      cy: 1668,
      maxW: 820,
      maxH: 150,
      fill: "#f4f4f4",
      spacing: 0.12,
    });
    return { back: svg(body) };
  },

  polaroid: (t, word) => {
    const defs = softShadow("sh");
    let body = rect(0, 0, W, H, `fill="#e9e5dc"`);
    for (let y = 0; y < H; y += 6) {
      body += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#d6d0c3" stroke-opacity="0.35" stroke-width="1"/>`;
    }
    body += `<g filter="url(#sh)">${slotsOf(t)
      .map((s) => around(s, 24, `fill="#ffffff"`, 4))
      .join("")}</g>`;
    body += word("caveat", "Potretin", {
      cx: 520,
      cy: 1665,
      maxW: 470,
      maxH: 150,
      fill: "#2b2b2b",
    });
    body += `<path d="M 330 1748 C 450 1772 610 1772 740 1738" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>`;
    body += heart(
      820,
      1615,
      60,
      `fill="none" stroke="#e11d48" stroke-width="0.07"`,
      12,
    );
    return { back: svg(body, defs) };
  },

  "gradasi-jingga": (t, word) => {
    const defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb88c"/><stop offset="0.55" stop-color="#ff6f61"/><stop offset="1" stop-color="#c2185b"/></linearGradient>`;
    let body = rect(0, 0, W, H, `fill="url(#bg)"`);
    body += `<circle cx="540" cy="${H}" r="360" fill="#ffd6a5" fill-opacity="0.35"/>`;
    body += `<circle cx="540" cy="${H}" r="250" fill="#ffd6a5" fill-opacity="0.3"/>`;
    body += slotsOf(t)
      .map((s) => around(s, 10, `fill="#ffffff" fill-opacity="0.9"`, 32))
      .join("");
    body += word("dancing", "Potretin", {
      cx: 540,
      cy: 1660,
      maxW: 540,
      maxH: 160,
      fill: "#ffffff",
      shadow: { dx: 0, dy: 5, fill: "#9f1239" },
    });
    return { back: svg(body, defs) };
  },

  "kotak-kotak": (t, word) => {
    const defs = `<pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#ffffff"/><rect width="40" height="80" fill="#e94b4b" fill-opacity="0.5"/><rect width="80" height="40" fill="#e94b4b" fill-opacity="0.5"/></pattern>`;
    let body = rect(0, 0, W, H, `fill="url(#g)"`);
    body += slotsOf(t)
      .map((s) => around(s, 14, `fill="#ffffff"`, 30))
      .join("");
    body += rect(
      190,
      1560,
      700,
      210,
      `fill="#ffffff" stroke="#e94b4b" stroke-width="8"`,
      105,
    );
    body += word("fredoka", "Potretin", {
      cx: 540,
      cy: 1662,
      maxW: 500,
      maxH: 128,
      fill: "#e94b4b",
    });
    body += rect(330, 1805, 420, 62, `fill="#e94b4b"`, 31);
    return { back: svg(body, defs) };
  },

  "y2k-krom": (t, word) => {
    const defs =
      `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5f3fc"/><stop offset="0.5" stop-color="#c7b8ff"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient>` +
      `<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#a1a1aa"/><stop offset="0.55" stop-color="#f4f4f5"/><stop offset="1" stop-color="#71717a"/></linearGradient>` +
      `<radialGradient id="blob" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;
    let body = rect(0, 0, W, H, `fill="url(#bg)"`);
    body += `<circle cx="160" cy="1650" r="260" fill="url(#blob)"/><circle cx="950" cy="320" r="300" fill="url(#blob)"/>`;
    body += slotsOf(t)
      .map((s) => around(s, 10, `fill="#ffffff"`, 38))
      .join("");
    body += word("rubikMono", "POTRETIN", {
      cx: 540,
      cy: 1662,
      maxW: 840,
      maxH: 120,
      fill: "url(#chrome)",
      stroke: { color: "#1e1b4b", width: 5 },
    });
    const sp = (x: number, y: number, s: number) =>
      sparkle(
        x,
        y,
        s,
        `fill="#ffffff" stroke="#1e1b4b" stroke-width="${r1(3 / s)}"`,
      );
    const [a, b] = slotsOf(t);
    const front = svg(
      sp(a.x + a.width - 10, a.y + 10, 46) +
        sp(a.x + a.width - 70, a.y + 50, 22) +
        sp(b.x + 10, b.y + b.height - 10, 50) +
        sp(b.x + 76, b.y + b.height - 56, 20) +
        sp(150, 1560, 34) +
        sp(W - 140, 1770, 40),
    );
    return { back: svg(body, defs), front };
  },

  galaksi: (t, word) => {
    const defs =
      `<radialGradient id="bg" cx="70%" cy="20%" r="100%"><stop offset="0" stop-color="#3b2a8a"/><stop offset="0.45" stop-color="#151a4d"/><stop offset="1" stop-color="#050616"/></radialGradient>` +
      `<linearGradient id="planet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0abfc"/><stop offset="1" stop-color="#6d28d9"/></linearGradient>` +
      glow("g", 8);
    let body = rect(0, 0, W, H, `fill="url(#bg)"`);
    const rand = rng(53);
    for (let i = 0; i < 420; i++) {
      body += `<circle cx="${r1(rand() * W)}" cy="${r1(rand() * H)}" r="${r1(0.6 + rand() * 2.2)}" fill="#ffffff" fill-opacity="${r1(0.25 + rand() * 0.7)}"/>`;
    }
    for (let i = 0; i < 9; i++) {
      body += sparkle(
        rand() * W,
        1520 + rand() * 380,
        10 + rand() * 14,
        `fill="#ffffff"`,
      );
    }
    body += `<g transform="translate(170 1745) rotate(-18)"><ellipse rx="160" ry="34" fill="none" stroke="#c4b5fd" stroke-width="10"/><circle r="92" fill="url(#planet)"/><path d="M -160 0 A 160 34 0 0 0 160 0" fill="none" stroke="#c4b5fd" stroke-width="10"/></g>`;
    body += slotsOf(t)
      .map((s) =>
        around(s, 8, `fill="none" stroke="#c4b5fd" stroke-width="3"`, 28),
      )
      .join("");
    body += word("righteous", "Potretin", {
      cx: 600,
      cy: 1660,
      maxW: 560,
      maxH: 130,
      fill: "#ddd6fe",
      filter: "g",
    });
    return { back: svg(body, defs) };
  },

  "bunga-liar": (t, word) => {
    let body = rect(0, 0, W, H, `fill="#fff7ed"`);
    const rand = rng(67);
    const palette: [string, string][] = [
      ["#f9a8d4", "#facc15"],
      ["#fdba74", "#9a3412"],
      ["#c4b5fd", "#facc15"],
      ["#fca5a5", "#7f1d1d"],
      ["#fde68a", "#c2410c"],
    ];
    const spots: [number, number, number][] = [
      [120, 1640, 60],
      [230, 1800, 48],
      [90, 1860, 40],
      [960, 1620, 58],
      [860, 1810, 50],
      [990, 1860, 42],
      [40, 70, 34],
      [1040, 60, 34],
      [40, 800, 26],
      [1040, 800, 26],
    ];
    spots.forEach(([x, y, r]) => {
      const [p, c] = palette[Math.floor(rand() * palette.length)];
      body += flower(x, y, r, p, c, rand() * 72);
    });
    for (let i = 0; i < 16; i++) {
      body += `<ellipse cx="${r1(140 + rand() * 800)}" cy="${r1(1560 + rand() * 340)}" rx="10" ry="5" fill="#86a874" transform="rotate(${r1(rand() * 180)} ${r1(140 + rand() * 800)} ${r1(1560 + rand() * 340)})" fill-opacity="0.7"/>`;
    }
    body += slotsOf(t)
      .map((s) => around(s, 10, `fill="#ffffff"`, 30))
      .join("");
    body += word("abril", "Potretin", {
      cx: 540,
      cy: 1665,
      maxW: 520,
      maxH: 136,
      fill: "#9d174d",
    });
    const [a, b] = slotsOf(t);
    const front = svg(
      flower(a.x + 8, a.y + 8, 64, "#f9a8d4", "#facc15", 10) +
        flower(a.x + 70, a.y - 6, 34, "#fdba74", "#9a3412", 40) +
        flower(
          b.x + b.width - 8,
          b.y + b.height - 8,
          66,
          "#c4b5fd",
          "#facc15",
          20,
        ) +
        flower(
          b.x + b.width - 76,
          b.y + b.height + 6,
          34,
          "#fca5a5",
          "#7f1d1d",
          0,
        ),
    );
    return { back: svg(body), front };
  },

  "warna-warni": (t, word) => {
    const defs = softShadow("sh");
    let body = rect(0, 0, W, H, `fill="#ffffff"`);
    const rand = rng(89);
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    for (let i = 0; i < 260; i++) {
      const c = colors[Math.floor(rand() * colors.length)];
      const x = rand() * W;
      const y = rand() * H;
      body +=
        rand() < 0.5
          ? `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(10 + rand() * 12)}" height="${r1(5 + rand() * 6)}" fill="${c}" transform="rotate(${r1(rand() * 180)} ${r1(x)} ${r1(y)})"/>`
          : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(3 + rand() * 5)}" fill="${c}"/>`;
    }
    body += `<g filter="url(#sh)">${slotsOf(t)
      .map((s) => around(s, 10, `fill="#ffffff"`, 34))
      .join("")}</g>`;
    body += rect(150, 1575, 780, 180, `fill="#ffffff"`, 90);
    body += word("fredokaBold", "Potretin", {
      cx: 540,
      cy: 1665,
      maxW: 600,
      maxH: 140,
      fill: "#000",
      colors,
      stroke: { color: "#1e293b", width: 6 },
    });
    return { back: svg(body, defs) };
  },
};

/** SVG latar (+ depan bila ada) untuk sebuah tema. */
export function buildArt(theme: FrameTheme, word: WordFn): Art {
  const builder = DESIGNS[theme.id];
  if (!builder) throw new Error(`Desain untuk frame "${theme.id}" belum ada`);
  return builder(theme, word);
}
