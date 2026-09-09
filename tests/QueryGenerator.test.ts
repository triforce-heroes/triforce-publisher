import { describe, expect, it } from "vitest";

import type { GeneratorEntry } from "#/QueryGenerator";
import { queryGenerator } from "#/QueryGenerator";

describe("QueryGenerator", () => {
  type Test = [entries: GeneratorEntry[], query: string | null];

  const tests: Test[] = [
    [[], null],
    [
      [{ reference: 123, sources: { hello: ["en"] } }],
      "INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `metadata`, `updatedAt`) VALUES (1, NULL, 123, '{\"hello\":[\"en\"]}', NULL, 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END), `translationBy` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END), `translationAt` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END), `metadata` = (CASE WHEN (`excluded`.`metadata` IS NULL AND `sources` != `excluded`.`sources`) THEN NULL WHEN `excluded`.`metadata` IS NULL THEN `metadata` ELSE JSON_PATCH(COALESCE(`metadata`, '{}'), `excluded`.`metadata`) END)",
    ],
    [
      [
        { reference: 1, sources: { hello: ["en"] } },
        { reference: 2, sources: { hello: ["en"], world: ["pt", "es"] } },
      ],
      'INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `metadata`, `updatedAt`) VALUES (1, NULL, 1, \'{"hello":["en"]}\', NULL, 0), (1, NULL, 2, \'{"hello":["en"],"world":["pt","es"]}\', NULL, 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END), `translationBy` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END), `translationAt` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END), `metadata` = (CASE WHEN (`excluded`.`metadata` IS NULL AND `sources` != `excluded`.`sources`) THEN NULL WHEN `excluded`.`metadata` IS NULL THEN `metadata` ELSE JSON_PATCH(COALESCE(`metadata`, \'{}\'), `excluded`.`metadata`) END)',
    ],
    [
      [{ reference: 123, sources: { hello: ["en"] }, metadata: { level: 5 } }],
      'INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `metadata`, `updatedAt`) VALUES (1, NULL, 123, \'{"hello":["en"]}\', \'{"metadata":{"level":5}}\', 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END), `translationBy` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END), `translationAt` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END), `metadata` = (CASE WHEN (`excluded`.`metadata` IS NULL AND `sources` != `excluded`.`sources`) THEN NULL WHEN `excluded`.`metadata` IS NULL THEN `metadata` ELSE JSON_PATCH(COALESCE(`metadata`, \'{}\'), `excluded`.`metadata`) END)',
    ],
    [
      [{ reference: 123, sources: { hello: ["en"] }, metadata: {} }],
      "INSERT INTO `projectEntries` (`projectId`, `resource`, `reference`, `sources`, `metadata`, `updatedAt`) VALUES (1, NULL, 123, '{\"hello\":[\"en\"]}', NULL, 0) ON CONFLICT (`projectId`, `resource`, `reference`) DO UPDATE SET `sources` = `excluded`.`sources`, `updatedAt` = `excluded`.`updatedAt`, `translation` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translation` END), `translationBy` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationBy` END), `translationAt` = (CASE WHEN `sources` != `excluded`.`sources` THEN NULL ELSE `translationAt` END), `metadata` = (CASE WHEN (`excluded`.`metadata` IS NULL AND `sources` != `excluded`.`sources`) THEN NULL WHEN `excluded`.`metadata` IS NULL THEN `metadata` ELSE JSON_PATCH(COALESCE(`metadata`, '{}'), `excluded`.`metadata`) END)",
    ],
  ];

  it.each(tests)("#%# generateQuery()", (entries, query) => {
    expect(queryGenerator(1, entries, 0)).toStrictEqual(query);
  });
});
