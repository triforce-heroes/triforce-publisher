import { describe, expect, it } from "vitest";

import { guessLocale, simplifyLocales } from "../../src/utils/locale.js";

describe("locale", () => {
  const guessLocaleTests = [
    ["en", "en"],
    ["EUen", "en"],
    ["en_us", "en"],
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
    [["en_us"], ["en_us"]],
    [["en", "en_us"], ["en"]],
    [["en_us", "en"], ["en"]],
    [["en", "en"], ["en"]],
    [["en_us", "en_us"], ["en_us"]],
    [
      ["es", "es_us", "en_us", "en"],
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
