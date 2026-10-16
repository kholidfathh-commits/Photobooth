import "server-only";

import { JWT, OAuth2Client } from "google-auth-library";

import type { DriveAuthConfig } from "./config";
import { DriveError, type DriveFile, type DriveService } from "./types";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const FOLDER_MIME = "application/vnd.google-apps.folder";
const FILE_FIELDS =
  "id,name,md5Checksum,size,mimeType,webViewLink,webContentLink";
const TIMEOUT_MS = 60_000;

function createAuth(auth: DriveAuthConfig): OAuth2Client {
  if (auth.kind === "service-account") {
    return new JWT({ email: auth.email, key: auth.privateKey, scopes: SCOPES });
  }
  const client = new OAuth2Client({
    clientId: auth.clientId,
    clientSecret: auth.clientSecret,
  });
  client.setCredentials({ refresh_token: auth.refreshToken });
  return client;
}

/** Kutip nilai untuk kueri pencarian Drive (escape \ dan '). */
function q(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function toDriveFile(json: Record<string, unknown>): DriveFile {
  return {
    id: String(json.id),
    name: String(json.name ?? ""),
    md5Checksum: json.md5Checksum as string | undefined,
    size: json.size ? Number(json.size) : undefined,
    mimeType: json.mimeType as string | undefined,
    webViewLink: json.webViewLink as string | undefined,
    webContentLink: json.webContentLink as string | undefined,
  };
}

/** Layanan Google Drive v3 via REST (Service Account / OAuth). */
export function createGoogleDrive(options: {
  rootFolderId: string;
  auth: DriveAuthConfig;
  /** Ganti klien auth (untuk uji); bawaan dibuat dari `auth`. */
  authClient?: Pick<OAuth2Client, "getRequestHeaders">;
}): DriveService {
  const auth = options.authClient ?? createAuth(options.auth);
  const folderCache = new Map<string, string>();

  async function request(
    url: string,
    init: RequestInit & { allow404?: boolean } = {},
  ): Promise<Response | null> {
    let authorization: string | null;
    try {
      const headers = await auth.getRequestHeaders();
      authorization = headers.get("authorization");
    } catch (err) {
      throw new DriveError(
        `Gagal masuk ke Google: ${(err as Error).message}`,
        null,
        false,
      );
    }
    const target = new URL(url);
    target.searchParams.set("supportsAllDrives", "true");

    let res: Response;
    try {
      res = await fetch(target, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          authorization: authorization ?? "",
        },
        signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new DriveError(
        `Koneksi ke Google Drive gagal: ${(err as Error).message}`,
        null,
        true,
      );
    }
    if (res.ok) return res;
    if (res.status === 404 && init.allow404) return null;

    const body = await res.text().catch(() => "");
    const rateLimited =
      res.status === 429 ||
      (res.status === 403 &&
        /rateLimitExceeded|userRateLimitExceeded/.test(body));
    throw new DriveError(
      `Google Drive menolak permintaan (${res.status}): ${body.slice(0, 300)}`,
      res.status,
      rateLimited || res.status >= 500,
    );
  }

  async function findChildFolder(parentId: string, name: string) {
    const url = new URL(`${API}/files`);
    url.searchParams.set(
      "q",
      `name = ${q(name)} and mimeType = ${q(FOLDER_MIME)} and ${q(parentId)} in parents and trashed = false`,
    );
    url.searchParams.set("fields", "files(id,name)");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("pageSize", "1");
    const res = await request(url.toString());
    const json = (await res!.json()) as { files?: { id: string }[] };
    return json.files?.[0]?.id ?? null;
  }

  async function createFolder(parentId: string, name: string) {
    const url = new URL(`${API}/files`);
    url.searchParams.set("fields", "id");
    const res = await request(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [parentId],
      }),
    });
    return String(((await res!.json()) as { id: string }).id);
  }

  return {
    mode: "google",

    async ensureFolderPath(path) {
      let parent = options.rootFolderId;
      for (const name of path) {
        const cacheKey = `${parent}/${name}`;
        let id = folderCache.get(cacheKey);
        if (!id) {
          id =
            (await findChildFolder(parent, name)) ??
            (await createFolder(parent, name));
          folderCache.set(cacheKey, id);
        }
        parent = id;
      }
      return parent;
    },

    async uploadFile({
      name,
      mimeType,
      data,
      folderId,
      description,
      appProperties,
    }) {
      const boundary = `photobooth-${crypto.randomUUID()}`;
      const metadata = JSON.stringify({
        name,
        mimeType,
        parents: [folderId],
        description,
        appProperties,
      });
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
            `--${boundary}\r\ncontent-type: ${mimeType}\r\n\r\n`,
        ),
        data,
        Buffer.from(`\r\n--${boundary}--`),
      ]);
      const url = new URL(`${UPLOAD_API}/files`);
      url.searchParams.set("uploadType", "multipart");
      url.searchParams.set("fields", FILE_FIELDS);
      const res = await request(url.toString(), {
        method: "POST",
        headers: { "content-type": `multipart/related; boundary=${boundary}` },
        body,
      });
      return toDriveFile((await res!.json()) as Record<string, unknown>);
    },

    async makePublic(fileId) {
      await request(`${API}/files/${encodeURIComponent(fileId)}/permissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      });
    },

    async getFile(fileId) {
      const url = new URL(`${API}/files/${encodeURIComponent(fileId)}`);
      url.searchParams.set("fields", FILE_FIELDS);
      const res = await request(url.toString(), { allow404: true });
      return res
        ? toDriveFile((await res.json()) as Record<string, unknown>)
        : null;
    },

    async findByAppProperty(key, value) {
      const url = new URL(`${API}/files`);
      url.searchParams.set(
        "q",
        `appProperties has { key=${q(key)} and value=${q(value)} } and trashed = false`,
      );
      url.searchParams.set("fields", `files(${FILE_FIELDS})`);
      url.searchParams.set("includeItemsFromAllDrives", "true");
      url.searchParams.set("pageSize", "1");
      const res = await request(url.toString());
      const json = (await res!.json()) as { files?: Record<string, unknown>[] };
      return json.files?.[0] ? toDriveFile(json.files[0]) : null;
    },

    async downloadFile(fileId) {
      const url = new URL(`${API}/files/${encodeURIComponent(fileId)}`);
      url.searchParams.set("alt", "media");
      const res = await request(url.toString(), { allow404: true });
      return res ? Buffer.from(await res.arrayBuffer()) : null;
    },
  };
}
