import { readFileSync } from "fs";
import { basename } from "path";

import { extract } from "@triforce-heroes/triforce-pkla";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PKLADriver = new (class extends Driver {
  public constructor() {
    super("dat", "*.dat");
  }

  public override resourceEntries(path: string): DataEntryRaw[] {
    const entries = extract(
      readFileSync(path),
      readFileSync(`${path.slice(0, -4)}.tbl`),
    );

    return entries.map((entry) => ({
      resource: basename(path, ".dat"),
      reference: entry.name,
      source: entry.message,
    }));
  }
})();
