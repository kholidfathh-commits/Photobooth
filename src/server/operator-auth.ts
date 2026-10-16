import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Otorisasi operator sederhana: header `Authorization: Bearer <OPERATOR_TOKEN>`.
 * Bila OPERATOR_TOKEN kosong: diizinkan hanya di pengembangan, ditolak di
 * produksi (agar pengaturan acara tidak bisa diubah sembarang orang).
 */
export function isOperatorRequest(headers: Headers): boolean {
  const expected = process.env.OPERATOR_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  const given = headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
