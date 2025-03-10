import { weakLocalesFull } from "./locale.js";

import type { Entry } from "../types/Entry.js";

export function getEntryHash({ sources }: Entry) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(sources!).flatMap(([key, value]) => {
        const keys = key
          .split(",")
          .filter((locale) => !weakLocalesFull.includes(locale));

        if (keys.length === 0) {
          return [];
        }

        return [[keys.sort().join(","), value]];
      }),
    ),
  );
}
