import { readFileSync } from "node:fs";

import { extract } from "@triforce-heroes/triforce-bmg/Extract";

import { DataEntryRaw } from "../types/DataEntryRaw.js";

import { Driver } from "./Driver.js";

export const BMGDriver = new (class extends Driver {
  public constructor() {
    super("bmg", "**/*.bmg");
  }

  // eslint-disable-next-line class-methods-use-this
  public resourceEntries(resource: string): DataEntryRaw[] {
    return extract(readFileSync(resource)).map(([reference, source]) => ({
      resource: resource.slice(0, -4).replaceAll("\\", "/"),
      reference: String(reference),
      source,
    }));
  }
})();
