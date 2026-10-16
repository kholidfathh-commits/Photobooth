import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { printJobs, type PrintJobRow } from "@/db/schema";
import type { PrintSettings } from "@/lib/print-layout";
import {
  canTransition,
  isFinalStatus,
  type PrintJobStatusValue,
} from "@/lib/print-job-status";
import { composePrintSheet } from "@/server/compose-print-sheet";
import { ServiceError } from "@/server/errors";
import {
  findPhotostripById,
  findPhotostripBySession,
} from "@/server/repositories/photostrips";
import { getEffectivePrintSettings } from "@/server/repositories/print-settings";
import { storage } from "@/server/storage";

const MAX_COPIES = 5;

function storageKeyOf(finalUrl: string | null) {
  return finalUrl?.startsWith("storage:")
    ? finalUrl.slice("storage:".length)
    : null;
}

/**
 * Buat job cetak untuk hasil akhir sesi memakai pengaturan cetak yang berlaku
 * di iPad tersebut. Ditolak bila fitur cetak sedang dinonaktifkan atau hasil
 * akhir belum ada. Lembar siap cetak bisa diambil di /api/print-jobs/:id/lembar.
 */
export async function createPrintJob(
  sessionId: string,
  {
    deviceId = null,
    copies = 1,
  }: { deviceId?: string | null; copies?: number } = {},
): Promise<{ job: PrintJobRow; settings: PrintSettings }> {
  if (!Number.isInteger(copies) || copies < 1 || copies > MAX_COPIES) {
    throw new ServiceError(
      422,
      "jumlah_salinan_tidak_valid",
      `Jumlah salinan 1–${MAX_COPIES}`,
    );
  }
  const { settings } = await getEffectivePrintSettings(deviceId);
  if (!settings.printerEnabled) {
    throw new ServiceError(
      409,
      "cetak_nonaktif",
      "Fitur cetak sedang dinonaktifkan operator",
    );
  }
  const photostrip = await findPhotostripBySession(sessionId);
  if (!photostrip) {
    throw new ServiceError(
      404,
      "hasil_belum_ada",
      "Sesi ini belum punya hasil foto",
    );
  }
  const key = storageKeyOf(photostrip.finalUrl);
  if (!key || !(await storage().get(key))) {
    throw new ServiceError(
      409,
      "berkas_hilang",
      "Berkas hasil akhir tidak ada di server",
    );
  }

  const [job] = await db
    .insert(printJobs)
    .values({
      id: `cetak-${crypto.randomUUID()}`,
      photostripId: photostrip.id,
      paperSize: settings.paperSize,
      orientation: settings.orientation,
      layout: String(settings.stripsPerSheet),
      copies,
      deviceId,
    })
    .returning();
  return { job, settings };
}

/**
 * Render lembar cetak job (JPEG 300 dpi seukuran kertas): photostrip disusun
 * sesuai pengaturan yang tercatat di job — siap dikirim ke printer/AirPrint.
 */
export async function renderPrintSheet(
  jobId: string,
): Promise<{ buffer: Buffer; widthMm: number; heightMm: number }> {
  const [row] = await db
    .select()
    .from(printJobs)
    .where(eq(printJobs.id, jobId))
    .limit(1);
  if (!row)
    throw new ServiceError(404, "job_tidak_ada", "Job cetak tidak ditemukan");

  const photostrip = await findPhotostripById(row.photostripId);
  const key = storageKeyOf(photostrip?.finalUrl ?? null);
  const file = key ? await storage().get(key) : null;
  if (!photostrip || !file) {
    throw new ServiceError(
      409,
      "berkas_hilang",
      "Berkas hasil akhir tidak ada di server",
    );
  }

  const strips = Number(row.layout);
  const sheet = await composePrintSheet(file, {
    paperSize: row.paperSize,
    orientation: row.orientation,
    stripsPerSheet: strips === 1 || strips === 4 ? strips : 2,
  });
  return {
    buffer: sheet.buffer,
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
  };
}

export async function getPrintJob(jobId: string): Promise<PrintJobRow> {
  const [row] = await db
    .select()
    .from(printJobs)
    .where(eq(printJobs.id, jobId))
    .limit(1);
  if (!row)
    throw new ServiceError(404, "job_tidak_ada", "Job cetak tidak ditemukan");
  return row;
}

/** Semua job cetak milik hasil akhir sebuah sesi, terbaru dulu. */
export async function listPrintJobsForSession(
  sessionId: string,
): Promise<PrintJobRow[]> {
  const photostrip = await findPhotostripBySession(sessionId);
  if (!photostrip) return [];
  return db
    .select()
    .from(printJobs)
    .where(eq(printJobs.photostripId, photostrip.id))
    .orderBy(desc(printJobs.requestedAt));
}

/**
 * Perbarui status job cetak (dilaporkan iPad setelah dialog cetak/konfirmasi
 * pelanggan). Hanya perpindahan status yang sah yang diterima.
 */
export async function updatePrintJobStatus(
  jobId: string,
  status: PrintJobStatusValue,
  error?: string | null,
): Promise<PrintJobRow> {
  const job = await getPrintJob(jobId);
  if (!canTransition(job.status, status)) {
    throw new ServiceError(
      409,
      "status_tidak_sah",
      `Status tidak bisa berubah dari "${job.status}" ke "${status}"`,
    );
  }
  const [updated] = await db
    .update(printJobs)
    .set({
      status,
      error:
        status === "gagal" ? (error?.slice(0, 300) ?? "Gagal mencetak") : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(printJobs.id, jobId))
    .returning();
  return updated;
}

/** Bentuk JSON publik job cetak. */
export function printJobJson(job: PrintJobRow) {
  return {
    id: job.id,
    status: job.status,
    final: isFinalStatus(job.status),
    paperSize: job.paperSize,
    orientation: job.orientation,
    layout: job.layout,
    copies: job.copies,
    error: job.error,
    requestedAt: job.requestedAt,
    updatedAt: job.updatedAt,
    sheetUrl: `/api/print-jobs/${job.id}/lembar`,
  };
}
