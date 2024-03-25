import { readFileSync } from "node:fs";

import { transpile } from "@triforce-heroes/triforce-msbt";

import { DataEntryRaw } from "../types/DataEntryRaw.js";

import { Driver } from "./Driver.js";

export const MSBTDriver = new (class extends Driver {
  public constructor() {
    super("msbt", "*.msbt");
  }

  // eslint-disable-next-line class-methods-use-this
  public resourceEntries(resource: string): DataEntryRaw[] {
    return transpile(readFileSync(resource)).map(([reference, source]) => ({
      resource: resource.slice(0, -5),
      reference,
      source,
    }));
  }
})();
