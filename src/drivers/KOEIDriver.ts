import { basename } from "node:path";

import { validate } from "@triforce-heroes/triforce-koei";
import { transpile } from "@triforce-heroes/triforce-koei/Transpile";

import { Entry } from "@triforce-heroes/triforce-commands/dist/entries/Entry.js";
import { meta } from "../metas/HWAC.js";
import { DataEntryRaw } from "../types/DataEntryRaw.js";

import { Driver } from "./Driver.js";

export const KOEIDriver = new (class extends Driver {
  public constructor() {
    super("koei", "*.koei");
  }

  // eslint-disable-next-line class-methods-use-this
  public validate(resource: Buffer) {
    return validate(resource);
  }

  // eslint-disable-next-line class-methods-use-this
  public resourceEntries(path: string, resource: Buffer): DataEntryRaw[] {
    const [index] = basename(path).slice(0, -5).split("_", 3) as [string];

    return transpile(resource).map((entry, entryIndex) => ({
      resource: index,
      reference: String(entryIndex),
      source: (entry as Entry[])[0]!.toString(),
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  public reassignLocales(entries: DataEntryRaw[]) {
    const metaLocales = meta.locales;

    const locales: Record<string, DataEntryRaw[]> = Object.fromEntries(
      metaLocales.map((locale) => [locale, []]),
    );

    const resources = Object.groupBy(
      entries,
      (entry) => entry.resource,
    ) as Record<string, DataEntryRaw[]>;

    for (const profile of meta.profiles) {
      if (profile[0] === "S") {
        let localeIndex = 0;

        const resourceReference = String(profile[1]).padStart(4, "0");
        let [, referenceIndex] = profile;
        const [, , referenceCopies] = profile;

        while (localeIndex < meta.locales.length) {
          const locale = meta.locales[localeIndex++]!;
          const localeKey = String(referenceIndex++).padStart(4, "0");
          const localeEntries = resources[localeKey]!;

          locales[locale]!.push(
            ...localeEntries.map((entry) => ({
              ...entry,
              resource: resourceReference,
            })),
          );

          if (Object.hasOwn(referenceCopies, locale)) {
            locales[meta.locales[localeIndex++]!]!.push(
              ...localeEntries.map((entry) => ({
                ...entry,
                resource: resourceReference,
              })),
            );
          }
        }

        continue;
      }

      const [, profileOffsetStarts, profileOffsetEnds, profileOffsetStep] =
        profile;

      for (
        let profileIndex = profileOffsetStarts;
        profileIndex <= profileOffsetEnds;
        profileIndex++
      ) {
        for (const [localeIndex, locale] of meta.locales.entries()) {
          const resourceReference = String(profileIndex).padStart(4, "0");
          const resourceKey = String(
            profileIndex + profileOffsetStep * localeIndex,
          ).padStart(4, "0");

          locales[locale]!.push(
            ...resources[resourceKey]!.map((entry) => ({
              ...entry,
              resource: resourceReference,
            })),
          );
        }
      }
    }

    return locales;
  }
})();
