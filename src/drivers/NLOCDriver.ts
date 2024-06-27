import { readFileSync } from "node:fs";

import { transpile } from "@triforce-heroes/triforce-nloc/Transpile";

import { DataEntryRaw } from "../types/DataEntryRaw.js";

import { Driver } from "./Driver.js";

export const NLOCDriver = new (class extends Driver {
  public constructor() {
    super("nloc", "*.data");
  }

  // eslint-disable-next-line class-methods-use-this
  public resourceEntries(resource: string): DataEntryRaw[] {
    return transpile(readFileSync(resource))[1].map(([reference, source]) => ({
      resource: resource.slice(0, -5),
      reference: String(reference),
      source,
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  public reassignLocales(entries: DataEntryRaw[]) {
    return Object.fromEntries(
      Object.entries(Object.groupBy(entries, (entry) => entry.resource)).map(
        ([resource, resourceEntries]) => [
          resource,
          resourceEntries!.map((entry) => ({
            ...entry,
            resource: "default",
          })),
        ],
      ),
    );
  }
})();
