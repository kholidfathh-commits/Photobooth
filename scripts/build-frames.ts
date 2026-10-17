// Membuat gambar semua frame Potretin: `npm run frames:build`.
// Hasil: public/frames/<id>/latar.webp (+ depan.webp) + pratinjau.webp.
// Tambahkan --lembar untuk membuat lembar kontak (cek visual) di
// .frames-preview/semua-frame.png.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import opentype, { type Font } from "opentype.js";
import sharp from "sharp";

import {
  CANVAS,
  LAYOUTS,
  THEMES,
  type FrameTheme,
} from "../src/lib/frames/themes";
import { buildArt, makeWordmark, type FontKey, type Fonts } from "./frames/art";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "frames");

const FONT_FILES: Record<FontKey, string> = {
  playfair: "playfair-display/files/playfair-display-latin-700-normal.woff",
  greatVibes: "great-vibes/files/great-vibes-latin-400-normal.woff",
  spaceMono: "space-mono/files/space-mono-latin-700-normal.woff",
  monoton: "monoton/files/monoton-latin-400-normal.woff",
  pacifico: "pacifico/files/pacifico-latin-400-normal.woff",
  marker: "permanent-marker/files/permanent-marker-latin-400-normal.woff",
  lobster: "lobster/files/lobster-latin-400-normal.woff",
  shrikhand: "shrikhand/files/shrikhand-latin-400-normal.woff",
  yeseva: "yeseva-one/files/yeseva-one-latin-400-normal.woff",
  bungee: "bungee/files/bungee-latin-400-normal.woff",
  bebas: "bebas-neue/files/bebas-neue-latin-400-normal.woff",
  caveat: "caveat/files/caveat-latin-700-normal.woff",
  dancing: "dancing-script/files/dancing-script-latin-700-normal.woff",
  fredoka: "fredoka/files/fredoka-latin-600-normal.woff",
  fredokaBold: "fredoka/files/fredoka-latin-700-normal.woff",
  rubikMono: "rubik-mono-one/files/rubik-mono-one-latin-400-normal.woff",
  righteous: "righteous/files/righteous-latin-400-normal.woff",
  abril: "abril-fatface/files/abril-fatface-latin-400-normal.woff",
};

function loadFonts(): Fonts {
  const entries = Object.entries(FONT_FILES).map(([key, file]) => {
    const buf = readFileSync(
      path.join(ROOT, "node_modules", "@fontsource", file),
    );
    const font: Font = opentype.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
    return [key, font];
  });
  return Object.fromEntries(entries) as Fonts;
}

/** Slot kosong bernomor untuk gambar pratinjau. */
function placeholders(
  theme: FrameTheme,
  withNumbers: boolean,
  word: ReturnType<typeof makeWordmark>,
) {
  const body = LAYOUTS[theme.layout]
    .map((s, i) => {
      const box = `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${theme.radius}" fill="${theme.placeholder}"/>`;
      const num = withNumbers
        ? word("spaceMono", String(i + 1), {
            cx: s.x + s.width / 2,
            cy: s.y + s.height / 2,
            maxW: 200,
            maxH: Math.min(110, s.height * 0.3),
            fill: theme.accent,
          })
        : "";
      return box + `<g opacity="0.55">${num}</g>`;
    })
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}">${body}</svg>`,
  );
}

/** Foto contoh warna-warni untuk lembar kontak. */
function samplePhotos(theme: FrameTheme) {
  const colors = [
    ["#f97316", "#db2777"],
    ["#0ea5e9", "#6366f1"],
    ["#22c55e", "#0d9488"],
  ];
  const body = LAYOUTS[theme.layout]
    .map((s, i) => {
      const [a, b] = colors[i];
      return `<defs><linearGradient id="p${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><clipPath id="c${i}"><rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${theme.radius}"/></clipPath></defs>
      <g clip-path="url(#c${i})"><rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="url(#p${i})"/>
      <circle cx="${s.x + s.width / 2}" cy="${s.y + s.height * 0.42}" r="${s.height * 0.16}" fill="#ffffff" fill-opacity="0.6"/>
      <rect x="${s.x + s.width / 2 - s.height * 0.27}" y="${s.y + s.height * 0.62}" width="${s.height * 0.54}" height="${s.height * 0.4}" rx="${s.height * 0.15}" fill="#ffffff" fill-opacity="0.6"/></g>`;
    })
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}">${body}</svg>`,
  );
}

async function main() {
  const sheet = process.argv.includes("--lembar");
  const fonts = loadFonts();
  const word = makeWordmark(fonts);
  rmSync(OUT, { recursive: true, force: true });
  const sheetTiles: Buffer[] = [];

  for (const theme of THEMES) {
    const dir = path.join(OUT, theme.id);
    mkdirSync(dir, { recursive: true });
    const art = buildArt(theme, word);
    const latar = await sharp(Buffer.from(art.back))
      .webp({ quality: 88 })
      .toBuffer();
    writeFileSync(path.join(dir, "latar.webp"), latar);

    let depan: Buffer | null = null;
    if (art.front) {
      depan = await sharp(Buffer.from(art.front))
        .webp({ quality: 90, alphaQuality: 100 })
        .toBuffer();
      writeFileSync(path.join(dir, "depan.webp"), depan);
    }
    if (Boolean(art.front) !== theme.hasFront) {
      throw new Error(
        `Frame "${theme.id}": hasFront tidak sesuai dengan desain`,
      );
    }

    const layers = (photos: Buffer) => [
      { input: photos },
      ...(depan ? [{ input: depan }] : []),
    ];
    const pratinjau = await sharp(latar)
      .composite(layers(placeholders(theme, true, word)))
      .toBuffer()
      .then((b) => sharp(b).resize(360, 640).webp({ quality: 82 }).toBuffer());
    writeFileSync(path.join(dir, "pratinjau.webp"), pratinjau);

    if (sheet) {
      const tile = await sharp(latar)
        .composite(layers(samplePhotos(theme)))
        .toBuffer()
        .then((b) => sharp(b).resize(270, 480).png().toBuffer());
      sheetTiles.push(tile);
    }
    console.log(
      `✓ ${theme.id.padEnd(16)} latar ${(latar.length / 1024).toFixed(0)} KB` +
        (depan ? `, depan ${(depan.length / 1024).toFixed(0)} KB` : ""),
    );
  }

  if (sheet) {
    const cols = 6;
    const rows = Math.ceil(sheetTiles.length / cols);
    const gap = 16;
    const out = path.join(ROOT, ".frames-preview");
    mkdirSync(out, { recursive: true });
    await sharp({
      create: {
        width: cols * 270 + (cols + 1) * gap,
        height: rows * 480 + (rows + 1) * gap,
        channels: 3,
        background: "#777777",
      },
    })
      .composite(
        sheetTiles.map((input, i) => ({
          input,
          left: gap + (i % cols) * (270 + gap),
          top: gap + Math.floor(i / cols) * (480 + gap),
        })),
      )
      .png()
      .toFile(path.join(out, "semua-frame.png"));
    console.log("Lembar kontak: .frames-preview/semua-frame.png");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
