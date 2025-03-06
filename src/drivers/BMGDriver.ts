import { readFileSync } from "node:fs";

import { extract } from "@triforce-heroes/triforce-bmg/Extract";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BMGDriver = new (class extends Driver {
  public constructor() {
    super("bmg", "**/*.bmg");
  }

  public override resourceEntries(resource: string): DataEntryRaw[] {
    return extract(readFileSync(resource)).map(([reference, source]) => ({
      resource: resource.slice(resource.indexOf("\\") + 1, -4),
      reference: String(reference),
      source,
    }));
  }
})();
