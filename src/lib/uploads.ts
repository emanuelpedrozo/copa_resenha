import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const types = [
  {
    mime: "image/jpeg",
    extension: "jpg",
    signature: (data: Buffer) =>
      data.length >= 3 &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff,
  },
  {
    mime: "image/png",
    extension: "png",
    signature: (data: Buffer) =>
      data.length >= 8 &&
      data
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    extension: "webp",
    signature: (data: Buffer) =>
      data.length >= 12 &&
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WEBP",
  },
  {
    mime: "image/gif",
    extension: "gif",
    signature: (data: Buffer) =>
      data.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString()),
  },
  {
    mime: "image/x-icon",
    extension: "ico",
    signature: (data: Buffer) =>
      data.length >= 4 &&
      data[0] === 0 &&
      data[1] === 0 &&
      data[2] === 1 &&
      data[3] === 0,
  },
];
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const maxBytes = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

async function saveImage(file: File, prefix: string) {
  if (file.size === 0 || file.size > maxBytes)
    throw new Error(
      `A imagem deve ter no máximo ${process.env.MAX_UPLOAD_MB || 10} MB.`,
    );
  const data = Buffer.from(await file.arrayBuffer());
  const type = types.find((candidate) => candidate.signature(data));
  if (!type) throw new Error("Formato de imagem não reconhecido.");
  await mkdir(uploadDir, { recursive: true });
  const name = `${prefix}-${randomUUID()}.${type.extension}`;
  await writeFile(path.join(uploadDir, name), data, { flag: "wx" });
  return name;
}
export const saveEvidence = (file: File) => saveImage(file, "evidence");
export const saveTeamCrest = (file: File) => saveImage(file, "team");
export async function loadEvidence(name: string) {
  if (!/^(?:[a-z]+-)?[a-f0-9-]+\.(jpg|png|webp|gif|ico)$/.test(name))
    return null;
  try {
    return await readFile(path.join(uploadDir, name));
  } catch {
    return null;
  }
}
export async function removeUpload(name: string) {
  if (!/^(?:[a-z]+-)?[a-f0-9-]+\.(jpg|png|webp|gif|ico)$/.test(name)) return;
  try {
    await unlink(path.join(uploadDir, name));
  } catch {}
}
export function evidenceMime(name: string) {
  return name.endsWith(".png")
    ? "image/png"
    : name.endsWith(".webp")
      ? "image/webp"
      : name.endsWith(".gif")
        ? "image/gif"
        : name.endsWith(".ico")
          ? "image/x-icon"
          : "image/jpeg";
}
