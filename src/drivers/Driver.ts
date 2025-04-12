import { readFileSync } from "node:fs";

import { normalize } from "@triforce-heroes/triforce-core/Path";
import { glob } from "glob";
import { minimatch } from "minimatch";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

interface Resource {
  path: string;
  resource: Buffer;
}

export abstract class Driver {
  public constructor(
    public readonly name: string,
    public readonly pattern: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public validate(_resource: Buffer) {
    return true;
  }

  public async entries(filesMatcher: string) {
    return (await glob(normalize(filesMatcher)))
      .filter((file) => minimatch(file, this.pattern, { matchBase: true }))
      .map((path): Resource | undefined => {
        const resource = readFileSync(path);

        return this.validate(resource) ? { path, resource } : undefined;
      })
      .filter((resource) => resource !== undefined)
      .sort((pathA, pathB) => pathA.path.localeCompare(pathB.path))
      .flatMap((resource) =>
        this.resourceEntries(resource.path, resource.resource),
      );
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public reassignLocales(
    entries: DataEntryRaw[],
  ): Record<string, DataEntryRaw[]> {
    return { default: entries };
  }

  public abstract resourceEntries(
    path: string,
    resource: Buffer,
  ): DataEntryRaw[];
}
