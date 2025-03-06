import { readFileSync } from "node:fs";

import { transpile } from "@triforce-heroes/triforce-msbt";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MSBTDriver = new (class extends Driver {
  public constructor() {
    super("msbt", "*.msbt");
  }

  public override resourceEntries(resource: string): DataEntryRaw[] {
    return transpile(readFileSync(resource)).map(([reference, source]) => ({
      resource: resource.slice(0, -5),
      reference,
      source,
    }));
  }
})();
