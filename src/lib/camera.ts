// Sumber kamera untuk sesi foto. Layar sesi hanya bergantung pada interface
// CameraSource, jadi kamera tiruan ini nanti tinggal diganti kamera iPad asli
// (MediaDevices getUserMedia + canvas) tanpa mengubah alur sesi.

export interface CameraSource {
  /** Ambil satu jepretan; hasilnya URL gambar (data URL). */
  capture(label: string): Promise<string>;
}

const MOCK_PALETTES: [string, string][] = [
  ["#f97316", "#db2777"],
  ["#0ea5e9", "#6366f1"],
  ["#22c55e", "#0d9488"],
  ["#eab308", "#ea580c"],
  ["#a855f7", "#ec4899"],
];

/**
 * Gambar JPEG tiruan (gradasi + siluet orang) berukuran seperti foto kamera.
 * Dibuat lewat canvas — bukan SVG — agar aman digabung & diekspor di Safari.
 */
function mockPhoto(label: string, from: string, to: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 1200, 900);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1200, 900);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(600, 375, 144, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(360, 555, 480, 270, 135);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 56px sans-serif";
  ctx.fillText(label, 60, 110);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Kamera tiruan: tiap jepretan menghasilkan gambar gradasi dengan warna bergiliran. */
export function createMockCamera(): CameraSource {
  let count = 0;
  return {
    async capture(label) {
      const [from, to] = MOCK_PALETTES[count++ % MOCK_PALETTES.length];
      return mockPhoto(label, from, to);
    },
  };
}
