import { batch, execute } from "./Database.js";

import type { Row } from "./Database.js";
import type { EntryPublishable } from "../types/EntryPublishable.js";

interface Entry {
  index: number;
  sources: Record<string, string>;
  translations: Record<string, string>;
  sourceIndex: string | null;
  translationIndex: string | null;
  same: number | null;
  sameSources: number | null;
}

export async function getEntries(engine: string, testRun: boolean) {
  let entriesOffset = 0;
  const entries: Array<Row<Entry>> = [];

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const requestEntries = await execute<Entry>(
      "SELECT [index], [sources], [translations], [sourceIndex], [translationIndex], [same], [sameSources] FROM [entries] WHERE [engine] = @engine LIMIT @limit OFFSET @offset",
      { engine, limit: testRun ? 50 : 1000, offset: entriesOffset },
    );

    entries.push(...requestEntries);

    if (testRun || requestEntries.length === 0) {
      break;
    }

    entriesOffset += 1000;
  }

  return entries.map((entry) => ({
    ...entry,
    sources: JSON.parse(entry.sources) as Record<string, string>,
    translations: JSON.parse(entry.translations) as Record<string, string>,
  }));
}

export async function updateEntries(
  engine: string,
  entries: EntryPublishable[],
) {
  return batch(
    entries.map((entry) => [
      "INSERT INTO [entries] ([engine], [index], [resource], [reference], [context], [sources], [translations], [sourceIndex], [translationIndex], [same], [sameSources], [updatedAt]) VALUES (@engine, @index, @resource, @reference, @context, @sources, @translations, @sourceIndex, @translationIndex, @same, @sameSources, @updatedAt) ON CONFLICT ([engine], [index]) DO UPDATE SET [sources] = @sources, [translations] = @translations, [sourceIndex] = @sourceIndex, [translationIndex] = IIF([translatedAt] IS NOT NULL, [translationIndex], @translationIndex), [same] = @same, [sameSources] = @sameSources, [translatedAt] = IIF([translatedAt] IS NOT NULL, @updatedAt, NULL), [updatedAt] = @updatedAt",
      {
        engine,
        index: entry.index,
        resource: entry.resource,
        reference: entry.reference,
        context: entry.context ?? null,
        sources: JSON.stringify(entry.sources),
        translations: JSON.stringify(entry.translations),
        sourceIndex: entry.sourceIndex ?? null,
        translationIndex: entry.translationIndex ?? null,
        same: entry.same ?? null,
        sameSources: entry.sameSources ?? null,
        updatedAt: Date.now(),
      },
    ]),
  );
}
