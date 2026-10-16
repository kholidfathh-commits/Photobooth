import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

/**
 * Koneksi database. Lokal memakai file SQLite (default), produksi memakai
 * Turso/libSQL lewat DATABASE_URL + DATABASE_AUTH_TOKEN. Hanya untuk server.
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/photobooth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
