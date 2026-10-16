import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";
import { databaseAuthToken, databaseUrl } from "./url";

/**
 * Koneksi database. Lokal memakai file SQLite; produksi memakai Turso
 * (lihat src/db/url.ts untuk nama variabel yang didukung). Hanya untuk server.
 */
const client = createClient({
  url: databaseUrl(),
  authToken: databaseAuthToken(),
});

export const db = drizzle(client, { schema });
export { schema };
