import { basename } from "path";

import { extract } from "@triforce-heroes/triforce-lost/Extract";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const LOSTDriver = new (class extends Driver {
  public constructor() {
    super("dat", "*.bin");
  }

  public override resourceEntries(
    path: string,
    resource: Buffer,
  ): DataEntryRaw[] {
    return extract(resource).map((entry, entryIndex) => ({
      resource: basename(path, ".bin").slice(0, -3),
      reference: String(entryIndex),
      source: entry,
    }));
  }
})();
