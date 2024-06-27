import { readFileSync } from "node:fs";

import { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
import { normalize } from "@triforce-heroes/triforce-core/Path";
import { glob } from "glob";
import { minimatch } from "minimatch";

import { DataEntryRaw } from "../types/DataEntryRaw.js";

interface Resource {
  path: string;
  resource: Buffer;
}

export abstract class Driver {
  public constructor(
    public readonly name: string,
    public readonly pattern: string,
  ) {}

  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars, class-methods-use-this
  public validate(_resource: Buffer) {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  public async entries(filesMatcher: string, engineDriver: CommandsDriver) {
    return (await glob(normalize(filesMatcher)))
      .filter((file) => minimatch(file, this.pattern, { matchBase: true }))
      .map((path): Resource | undefined => {
        const resource = readFileSync(path);

        return this.validate(resource) ? { path, resource } : undefined;
      })
      .filter((resource) => resource !== undefined)
      .sort((a, b) => a.path.localeCompare(b.path))
      .flatMap((resource) =>
        this.resourceEntries(resource.path, resource.resource),
      )
      .map((entry) => ({
        ...entry,
        sourceIndex: engineDriver.parse(entry.source).toIndex(),
      }));
  }

  // eslint-disable-next-line class-methods-use-this
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
