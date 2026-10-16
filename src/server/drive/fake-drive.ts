import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DriveFile, DriveService } from "./types";

interface FakeIndex {
  folders: Record<string, string>; // "parent/nama" → id
  files: Record<
    string,
    DriveFile & { folderId: string; appProperties?: Record<string, string> }
  >;
}

/**
 * Drive tiruan untuk pengembangan tanpa kredensial: berkas ditulis ke
 * data/drive-tiruan, metadata di index.json. Perilakunya meniru Drive
 * (folder bertingkat, md5, appProperties, publik).
 */
export function createFakeDrive(
  root = path.join(process.cwd(), "data", "drive-tiruan"),
): DriveService {
  const indexFile = path.join(root, "index.json");

  async function load(): Promise<FakeIndex> {
    try {
      return JSON.parse(await readFile(indexFile, "utf8")) as FakeIndex;
    } catch {
      return { folders: {}, files: {} };
    }
  }
  async function save(index: FakeIndex) {
    await mkdir(root, { recursive: true });
    await writeFile(indexFile, JSON.stringify(index, null, 2));
  }
  const newId = (prefix: string) =>
    `${prefix}-${crypto.randomUUID().slice(0, 12)}`;

  return {
    mode: "tiruan",

    async ensureFolderPath(segments) {
      const index = await load();
      let parent = "akar";
      for (const name of segments) {
        const key = `${parent}/${name}`;
        index.folders[key] ??= newId("folder");
        parent = index.folders[key];
      }
      await save(index);
      return parent;
    },

    async uploadFile({ name, mimeType, data, folderId, appProperties }) {
      const index = await load();
      const id = newId("berkas");
      await mkdir(path.join(root, "berkas"), { recursive: true });
      await writeFile(path.join(root, "berkas", id), data);
      const file = {
        id,
        name,
        mimeType,
        size: data.length,
        md5Checksum: createHash("md5").update(data).digest("hex"),
        webViewLink: `tiruan://drive/${id}`,
        folderId,
        appProperties,
      };
      index.files[id] = file;
      await save(index);
      return file;
    },

    async makePublic() {
      /* tiruan: semua berkas dianggap publik */
    },

    async getFile(fileId) {
      return (await load()).files[fileId] ?? null;
    },

    async findByAppProperty(key, value) {
      const files = Object.values((await load()).files);
      return files.find((f) => f.appProperties?.[key] === value) ?? null;
    },

    async downloadFile(fileId) {
      if (!/^berkas-[a-f0-9-]+$/.test(fileId)) return null;
      try {
        return await readFile(path.join(root, "berkas", fileId));
      } catch {
        return null;
      }
    },
  };
}
