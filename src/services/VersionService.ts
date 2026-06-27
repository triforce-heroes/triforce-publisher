import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { regex } from "arkregex";

import type { MapObject } from "#/types/MapObject";
import type { VersionHashes } from "#/types/VersionHashes";

import { parseAs } from "#/services/JsonService";

const VERSION_PATTERN = regex("^query_v(?<version>\\d+)\\.json$");

function getVersions(path: string) {
  const versions: Array<{ path: string; version: number }> = [];

  if (!existsSync(path)) {
    return versions;
  }

  for (const file of readdirSync(path)) {
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

export function getVersionHashes(path: string): VersionHashes {
  const hashes = new Map<string, Map<string, string>>();
  const versions = getVersions(path);

  for (const { path: versionPath } of versions) {
    const entries = Object.entries(parseAs<MapObject>(readFileSync(versionPath, "utf8"), {}));

    for (const [resource, references] of entries) {
      hashes.set(resource, new Map<string, string>(Object.entries(references)));
    }
  }

  return hashes;
}

export function getLatestVersion(path: string) {
  return getVersions(path).at(-1)?.version ?? 0;
}
