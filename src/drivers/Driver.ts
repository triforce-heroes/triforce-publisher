import { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
import { normalize } from "@triforce-heroes/triforce-core/Path";
import { glob } from "glob";
import { minimatch } from "minimatch";

import { DataEntry } from "../types/DataEntry.js";

export abstract class Driver {
  public constructor(
    public readonly name: string,
    public readonly pattern: string,
  ) {}

  // eslint-disable-next-line class-methods-use-this
  public async entries(filesMatcher: string, engineDriver: CommandsDriver) {
    return (await glob(filesMatcher))
      .filter((file) => minimatch(file, this.pattern, { matchBase: true }))
      .map((file) => normalize(file))
      .sort()
      .flatMap((file) => this.resourceEntries(file))
      .map((entry) => ({
        ...entry,
        sourceIndex: engineDriver.parse(entry.source).toIndex(),
      }));
  }

  public abstract resourceEntries(
    resource: string,
  ): Array<Omit<DataEntry, "sourceIndex">>;
}
