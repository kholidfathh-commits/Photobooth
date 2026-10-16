import { defineConfig } from "drizzle-kit";

import { databaseAuthToken, databaseUrl } from "./src/db/url";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl(),
    authToken: databaseAuthToken(),
  },
});
