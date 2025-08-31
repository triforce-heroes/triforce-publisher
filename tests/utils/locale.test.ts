import { describe, expect, it } from "vitest";

import { guessLocale, simplifyLocales } from "../../src/utils/locale.js";

describe("locale", () => {
  const guessLocaleTests = [
    ["en", "en"],
    ["EUen", "en"],
    ["en-EU", "en"],
    ["USen", "en"],
    ["jp", "ja"],
    ["JPja", "ja"],
    ["kr", "ko"],
    ["unknown", undefined],
  ] as const;

  it.each(guessLocaleTests)(
    "function guessLocale(%j) === %j",
    (input, output) => {
      expect(guessLocale(input)).toStrictEqual(output);
    },
  );

  const simplifyLocalesTests: Array<[input: string[], output: string[]]> = [
    [["en"], ["en"]],
    [["en-EU"], ["en-EU"]],
    [["en", "en-EU"], ["en"]],
    [["en-EU", "en"], ["en"]],
    [["en", "en"], ["en"]],
    [["en-EU", "en-EU"], ["en-EU"]],
    [
      ["es", "es-EU", "en-EU", "en"],
      ["es", "en"],
    ],
  ];

  it.each(simplifyLocalesTests)(
    "function simplifyLocales(%j) === %j",
    (input, output) => {
      expect(simplifyLocales(input)).toStrictEqual(output);
    },
  );
});
