import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

export const tmpDir = join(import.meta.dirname, "tmp");

export function cleanTmpDir(): void {
  mkdirSync(tmpDir, { recursive: true });

  for (const file of readdirSync(tmpDir)) {
    if (file !== ".gitignore") {
      rmSync(join(tmpDir, file), { recursive: true });
    }
  }
}
