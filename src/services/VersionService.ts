import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { parseAs } from "@rheactor/rheactor-core";
import { exists } from "@rheactor/rheactor-core/node";
import { regex } from "arkregex";

import type { MapObject } from "#/types/MapObject";
import type { VersionHashes } from "#/types/VersionHashes";

const VERSION_PATTERN = regex("^query_v(?<version>\\d+)\\.json$");

async function getVersions(path: string) {
  const versions: Array<{ path: string; version: number }> = [];

  if (!(await exists(path))) {
    return versions;
  }

  for (const file of await readdir(path)) {
    const match = VERSION_PATTERN.exec(file);

    if (match) {
      versions.push({
        path: join(path, file),
        version: Number(match.groups.version),
      });
    }
  }

  return versions.toSorted((versionA, versionB) => versionA.version - versionB.version);
}

export async function getVersionHashes(path: string): Promise<VersionHashes> {
  const hashes = new Map<string, Map<string, string>>();
  const versions = await getVersions(path);

  const reads: Array<Promise<string>> = [];

  for (const { path: versionPath } of versions) {
    reads.push(readFile(versionPath, "utf-8"));
  }

  const contents = await Promise.all(reads);

  for (const content of contents) {
    const entries = Object.entries(parseAs<MapObject>(content, {}));

    for (const [resource, references] of entries) {
      hashes.set(resource, new Map<string, string>(Object.entries(references)));
    }
  }

  return hashes;
}

export async function getLatestVersion(path: string) {
  const versions = await getVersions(path);

  return versions.at(-1)?.version ?? 0;
}
