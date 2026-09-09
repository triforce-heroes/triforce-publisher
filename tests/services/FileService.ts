import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

export const tmpDir = join(import.meta.dirname, "tmp");

export async function cleanTmpDir(): Promise<void> {
  await mkdir(tmpDir, { recursive: true });

  const files = await readdir(tmpDir);
  const removals: Array<Promise<void>> = [];

  for (const file of files) {
    if (file !== ".gitignore") {
      removals.push(rm(join(tmpDir, file), { recursive: true }));
    }
  }

  await Promise.all(removals);
}
