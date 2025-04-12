import { extract } from "@triforce-heroes/triforce-lbrs/Extract";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";

const locales = new Map<number, string>([
  [1, "en"],
  [2, "fr"],
  [4, "de"],
  [5, "es"],
  [7, "it"],
  [8, "nl"],
]);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const LBRSDriver = new (class extends Driver {
  public constructor() {
    super("lbrs", "*.lbrs");
  }

  public override resourceEntries(
    _path: string,
    resource: Buffer,
  ): DataEntryRaw[] {
    return extract(resource).entries.flatMap(([name, translations]) =>
      (translations as string[])
        .map((translation, translationIndex): DataEntryRaw | undefined =>
          locales.has(translationIndex)
            ? {
                resource: "~",
                reference: name as string,
                source: translation,
                context: locales.get(translationIndex),
              }
            : undefined,
        )
        .filter(Boolean),
    );
  }

  public override reassignLocales(entries: DataEntryRaw[]) {
    return Object.fromEntries(
      Object.entries(Object.groupBy(entries, (entry) => entry.context!)).map(
        ([context, resourceEntries]) => [
          context,
          resourceEntries!.map(({ context: _context, ...entry }) => ({
            ...entry,
          })),
        ],
      ),
    );
  }
})();
