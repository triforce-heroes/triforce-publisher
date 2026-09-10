import sql from "@rheactor/rheactor-query-builder";

import { normalizeMetadata } from "#/services/MetadataService";

export interface GeneratorEntry {
  resource?: string;
  reference: number | string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}

export function queryGenerator(projectId: number, entries: GeneratorEntry[], updatedAt?: number) {
  if (entries.length === 0) {
    return null;
  }

  const query = sql.insert("projectEntries", [
    "projectId",
    "resource",
    "reference",
    "sources",
    "metadata",
    "updatedAt",
  ]);

  const project = sql.staticValue(projectId);
  const date = sql.staticValue(updatedAt ?? Date.now());

  for (const entry of entries) {
    const metadata = normalizeMetadata(entry.metadata);

    query.values(
      project,
      sql.staticValue(entry.resource ?? null),
      sql.staticValue(entry.reference),
      sql.jsonStaticValue(entry.sources),
      metadata === undefined ? sql.staticValue(null) : sql.jsonStaticValue(metadata),
      date,
    );
  }

  query.onConflict(
    sql
      .conflict(["projectId", "resource", "reference"])
      .set("sources", sql.excluded("sources"))
      .set("updatedAt", sql.excluded("updatedAt"))
      .set(
        "translation",
        sql
          .case()
          .when(sql.neq("sources", sql.excluded("sources")), sql.staticValue(null))
          .else("translation"),
      )
      .set(
        "translationBy",
        sql
          .case()
          .when(sql.neq("sources", sql.excluded("sources")), sql.staticValue(null))
          .else("translationBy"),
      )
      .set(
        "translationAt",
        sql
          .case()
          .when(sql.neq("sources", sql.excluded("sources")), sql.staticValue(null))
          .else("translationAt"),
      )
      .set(
        "metadata",
        sql
          .case()
          .when(
            sql.and(
              sql.isNull(sql.excluded("metadata")),
              sql.neq("sources", sql.excluded("sources")),
            ),
            sql.staticValue(null),
          )
          .when(sql.isNull(sql.excluded("metadata")), "metadata")
          .else(
            sql.call(
              "JSON_PATCH",
              sql.call("COALESCE", "metadata", sql.staticValue("{}")),
              sql.excluded("metadata"),
            ),
          ),
      ),
  );

  return query.build().query;
}
