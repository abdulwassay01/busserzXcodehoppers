import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir(): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  return DATA_DIR;
}

export async function readJsonStore<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = path.join(await ensureDataDir(), fileName);

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonStore<T>(fileName: string, data: T): Promise<void> {
  const filePath = path.join(await ensureDataDir(), fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function deleteJsonStore(fileName: string): Promise<void> {
  const filePath = path.join(await ensureDataDir(), fileName);
  try {
    await unlink(filePath);
  } catch {
    // ignore if file does not exist
  }
}
