// Skema database (SQLite/libSQL via Drizzle). Mengikuti ERD di PRD.
// Tidak ada data pribadi pelanggan yang disimpan.

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** Desain frame photostrip yang bisa dipilih pelanggan. */
export const frames = sqliteTable("frames", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  previewUrl: text("preview_url"),
  /** Jumlah foto dalam photostrip: 2 atau 3. */
  slotCount: integer("slot_count").notNull(),
  /** Tata letak & warna frame (JSON: background, accent, caption, …). */
  layoutJson: text("layout_json").notNull().default("{}"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(createdNow),
});

export const SESSION_STATUSES = ["berjalan", "selesai", "dibatalkan"] as const;
export type SessionRowStatus = (typeof SESSION_STATUSES)[number];

/** Satu sesi foto pelanggan di iPad. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    frameId: text("frame_id")
      .notNull()
      .references(() => frames.id),
    status: text("status", { enum: SESSION_STATUSES })
      .notNull()
      .default("berjalan"),
    /** Penanda perangkat (iPad) yang menjalankan sesi. */
    deviceId: text("device_id"),
    startedAt: text("started_at").notNull().default(createdNow),
    finishedAt: text("finished_at"),
    /**
     * Kapan data sesi dibersihkan dari perangkat/server sementara (foto mentah
     * & berkas lokal). Hasil di Google Drive & token QR tetap berlaku.
     */
    clearedAt: text("cleared_at"),
  },
  (t) => [
    index("sessions_frame_idx").on(t.frameId),
    index("sessions_status_idx").on(t.status),
  ],
);

/** Jepretan mentah per sesi, urut sesuai order_index. */
export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    rawUrl: text("raw_url"),
    takenAt: text("taken_at").notNull().default(createdNow),
  },
  (t) => [uniqueIndex("photos_session_order_uq").on(t.sessionId, t.orderIndex)],
);

/** Hasil akhir sesi: satu photostrip gabungan (1:1 dengan sesi). */
export const photostrips = sqliteTable(
  "photostrips",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    /** URL gambar final (link unduh Google Drive / storage). */
    finalUrl: text("final_url"),
    driveFileId: text("drive_file_id"),
    /** Token unik untuk QR Code & halaman unduh publik /unduh/[token]. */
    qrToken: text("qr_token").notNull(),
    /** Ukuran gambar final, mis. "1800x4128". */
    resolution: text("resolution").notNull(),
    /** Berapa kali foto diunduh lewat halaman publik. */
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: text("last_downloaded_at"),
    /**
     * Token dicabut (mis. atas permintaan pelanggan/operator). QR tetap
     * berlaku selamanya kecuali kolom ini terisi.
     */
    tokenRevokedAt: text("token_revoked_at"),
    createdAt: text("created_at").notNull().default(createdNow),
  },
  (t) => [
    uniqueIndex("photostrips_session_uq").on(t.sessionId),
    uniqueIndex("photostrips_qr_token_uq").on(t.qrToken),
  ],
);

export const UPLOAD_STATUSES = [
  "menunggu",
  "mengunggah",
  "berhasil",
  "gagal",
] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

/**
 * Sesi unggahan hasil foto ke Google Drive: satu baris per photostrip,
 * mencatat status, jumlah percobaan, dan error terakhir untuk coba ulang.
 */
export const uploads = sqliteTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    photostripId: text("photostrip_id")
      .notNull()
      .references(() => photostrips.id, { onDelete: "cascade" }),
    status: text("status", { enum: UPLOAD_STATUSES })
      .notNull()
      .default("menunggu"),
    /** Jumlah percobaan unggah yang sudah dilakukan. */
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    /** Kapan boleh dicoba lagi (ISO) setelah gagal; null = segera. */
    nextRetryAt: text("next_retry_at"),
    fileName: text("file_name").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    md5: text("md5").notNull(),
    driveFileId: text("drive_file_id"),
    driveFolderId: text("drive_folder_id"),
    createdAt: text("created_at").notNull().default(createdNow),
    updatedAt: text("updated_at").notNull().default(createdNow),
    finishedAt: text("finished_at"),
  },
  (t) => [
    uniqueIndex("uploads_photostrip_uq").on(t.photostripId),
    index("uploads_status_idx").on(t.status, t.nextRetryAt),
  ],
);

export const PAPER_SIZE_VALUES = ["4R", "A6", "A5", "A4"] as const;
export const ORIENTATION_VALUES = ["potret", "lanskap"] as const;

/**
 * Pengaturan cetak per acara/perangkat. Baris "default" berlaku untuk semua
 * iPad; baris dengan device_id tertentu menimpa untuk iPad itu saja.
 * Fitur cetak dinyalakan/dimatikan cukup dengan mengubah printer_enabled.
 */
export const printSettings = sqliteTable(
  "print_settings",
  {
    id: text("id").primaryKey(),
    /** null = pengaturan umum acara; terisi = khusus satu iPad. */
    deviceId: text("device_id"),
    printerEnabled: integer("printer_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    paperSize: text("paper_size", { enum: PAPER_SIZE_VALUES })
      .notNull()
      .default("4R"),
    orientation: text("orientation", { enum: ORIENTATION_VALUES })
      .notNull()
      .default("potret"),
    /** Jumlah photostrip per lembar: 1, 2, atau 4. */
    stripsPerSheet: integer("strips_per_sheet").notNull().default(2),
    updatedAt: text("updated_at").notNull().default(createdNow),
  },
  (t) => [uniqueIndex("print_settings_device_uq").on(t.deviceId)],
);

export const PRINT_JOB_STATUSES = [
  "dikirim",
  "mencetak",
  "berhasil",
  "gagal",
  "dibatalkan",
] as const;
export type PrintJobStatus = (typeof PRINT_JOB_STATUSES)[number];

/** Permintaan cetak photostrip (opsional), beserta pengaturan saat dicetak. */
export const printJobs = sqliteTable(
  "print_jobs",
  {
    id: text("id").primaryKey(),
    photostripId: text("photostrip_id")
      .notNull()
      .references(() => photostrips.id, { onDelete: "cascade" }),
    paperSize: text("paper_size", { enum: PAPER_SIZE_VALUES }).notNull(),
    orientation: text("orientation", { enum: ORIENTATION_VALUES }).notNull(),
    /** Susunan, mis. "2" = 2 strip per lembar. */
    layout: text("layout").notNull(),
    status: text("status", { enum: PRINT_JOB_STATUSES })
      .notNull()
      .default("dikirim"),
    copies: integer("copies").notNull().default(1),
    deviceId: text("device_id"),
    error: text("error"),
    requestedAt: text("requested_at").notNull().default(createdNow),
    updatedAt: text("updated_at").notNull().default(createdNow),
  },
  (t) => [
    index("print_jobs_photostrip_idx").on(t.photostripId),
    index("print_jobs_status_idx").on(t.status),
  ],
);

export type FrameRow = typeof frames.$inferSelect;
export type NewFrameRow = typeof frames.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type PhotoRow = typeof photos.$inferSelect;
export type NewPhotoRow = typeof photos.$inferInsert;
export type PhotostripRow = typeof photostrips.$inferSelect;
export type NewPhotostripRow = typeof photostrips.$inferInsert;
export type UploadRow = typeof uploads.$inferSelect;
export type PrintSettingsRow = typeof printSettings.$inferSelect;
export type PrintJobRow = typeof printJobs.$inferSelect;
export type NewUploadRow = typeof uploads.$inferInsert;
