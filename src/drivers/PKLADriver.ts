import { readFileSync } from "fs";
import { basename, resolve } from "path";

import { extract } from "@triforce-heroes/triforce-pkla";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PKLADriver = new (class extends Driver {
  public constructor() {
    super("dat", "*.dat");
  }

  public override resourceEntries(
    path: string,
    resource: Buffer,
  ): DataEntryRaw[] {
    const japaneseFix = ["ja", "ja_Kanji"].includes(basename(resolve(".")));

    return extract(resource, readFileSync(`${path.slice(0, -4)}.tbl`)).map(
      (entry) => ({
        resource: basename(path, ".dat"),
        reference: entry.name,
        source: japaneseFix
          ? entry.message.slice(0, entry.message.length / 2)
          : entry.message,
      }),
    );
  }
})();
