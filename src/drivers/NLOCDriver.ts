import { readFileSync } from "node:fs";

import { transpile } from "@triforce-heroes/triforce-nloc/Transpile";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NLOCDriver = new (class extends Driver {
  public constructor() {
    super("nloc", "*.data");
  }

  public override resourceEntries(resource: string): DataEntryRaw[] {
    return transpile(readFileSync(resource))[1].map(([reference, source]) => ({
      resource: resource.slice(0, -5),
      reference: String(reference),
      source,
    }));
  }

  public override reassignLocales(entries: DataEntryRaw[]) {
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
