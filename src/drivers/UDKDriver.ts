import { readFileSync } from "node:fs";

import { Language, LocalizationSystem } from "@triforce-heroes/triforce-udk";

import { Driver } from "./Driver.js";

import type { DataEntryRaw } from "../types/DataEntryRaw.js";
import type { SupportedLocaleExtended } from "../utils/locale.js";

const locales = new Map<Language, SupportedLocaleExtended>([
  [Language.ENGLISH_EUROPE, "en"],
  [Language.FRENCH_EUROPE, "fr"],
  [Language.SPANISH_EUROPE, "es"],

  [Language.GERMAN, "de"],
  [Language.ITALIAN, "it"],

  [Language.JAPONESE, "ja"],

  [Language.ENGLISH_AMERICA, "en_us"],
  [Language.FRENCH_AMERICA, "fr_us"],
  [Language.SPANISH_AMERICA, "es_us"],

  [Language.DUTCH, "nl"],

  [Language.CHINESE_SIMPLIFIED, "zh"],
  [Language.CHINESE_TRADITIONAL, "zh_tw"],

  [Language.KOREAN, "ko"],
]);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UDKDriver = new (class extends Driver {
  public constructor() {
    super("udk", "*.udk");
  }

  public override resourceEntries(path: string): DataEntryRaw[] {
    return [
      ...new LocalizationSystem(readFileSync(path)).languages.entries(),
    ].flatMap(([language, languageData]) =>
      [...languageData.items.values()].map((item) => ({
        resource: locales.get(language)!,
        reference: String(item.messageId),
        context: `${item.messageName}.${item.messageContext}`,
        source: item.message,
      })),
    );
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
