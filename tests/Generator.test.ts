import { describe, expect, it } from "vitest";

import type { GeneratorEntry } from "@/Generator";

import { generateQuery } from "@/Generator";

describe("generator", () => {
  type Test = [entries: GeneratorEntry[], query: string | null];

  const tests: Test[] = [
    [[], null],
    [
      [{ reference: 123, sources: { hello: ["en"] } }],
      'INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `updatedAt`) VALUES (1, NULL, 123, "{""hello"":[""en""]}", 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END, `translationBy` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END, `translationAt` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END, `metadata` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `metadata` END',
    ],
    [
      [
        { reference: 1, sources: { hello: ["en"] } },
        { reference: 2, sources: { hello: ["en"], world: ["pt", "es"] } },
      ],
      'INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `updatedAt`) VALUES (1, NULL, 1, "{""hello"":[""en""]}", 0), (1, NULL, 2, "{""hello"":[""en""],""world"":[""pt"",""es""]}", 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END, `translationBy` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END, `translationAt` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END, `metadata` = CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `metadata` END',
    ],
  ];

  it.each(tests)("#%# generateQuery()", (entries, query) => {
    expect(generateQuery(1, entries, 0)).toStrictEqual(query);
  });
});
