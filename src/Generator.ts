import sql from "@rheactor/rheactor-query-builder";

export interface GeneratorEntry {
  resource?: string;
  reference: number | string;
  sources: Record<string, string[]>;
}

export function generateQuery(
  projectId: number,
  entries: GeneratorEntry[],
  updatedAt?: number,
) {
  if (entries.length === 0) {
    return null;
  }

  const query = sql.insert("projectEntries", [
    "projectId",
    "resource",
    "reference",
    "sources",
    "updatedAt",
  ]);

  const project = sql.staticValue(projectId);
  const date = sql.staticValue(updatedAt ?? Date.now());

  for (const entry of entries) {
    query.values(
      project,
      sql.staticValue(entry.resource ?? null),
      sql.staticValue(entry.reference),
      sql.jsonStaticValue(entry.sources),
      date,
    );
  }

  return query.build().query;
}
