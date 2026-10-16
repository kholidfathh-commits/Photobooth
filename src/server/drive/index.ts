import "server-only";

import { readDriveConfig } from "./config";
import { createBlobDrive } from "./blob-drive";
import { createFakeDrive } from "./fake-drive";
import { createGoogleDrive } from "./google-drive";
import type { DriveService } from "./types";

export { DriveError } from "./types";
export type { DriveFile, DriveService } from "./types";
export { DriveConfigError } from "./config";

let shared: DriveService | undefined;

/**
 * Layanan Drive bersama untuk server. Memakai Google Drive sungguhan bila
 * kredensial ada; di pengembangan tanpa kredensial memakai Drive tiruan.
 */
export function getDriveService(): DriveService {
  if (!shared) {
    const config = readDriveConfig();
    if (config.mode === "google") {
      shared = createGoogleDrive(config);
    } else if (config.mode === "blob") {
      shared = createBlobDrive();
    } else {
      console.warn(`[drive] memakai Drive tiruan: ${config.reason}`);
      shared = createFakeDrive();
    }
  }
  return shared;
}
