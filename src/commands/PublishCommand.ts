import { existsSync, readFileSync } from "node:fs";

import {
  DDBBatchWrite,
  DDBGetItem,
} from "@triforce-heroes/triforce-core/AWS/DDB";
import { DDBQueryBuilder } from "@triforce-heroes/triforce-core/AWS/DDBQueryBuilder";
import { fatal } from "@triforce-heroes/triforce-core/Console";
import { deepEqual } from "fast-equals";

import { DataEntryPublishable } from "../types/DataEntryPublishable.js";

interface DataPublishableEntry {
  engine: string;
  index: number;
  reference: string;
  resource: string;
  context?: string;
  source?: string;
  translation?: string;
}

interface DataPublishableSources {
  engine: string;
  index: number;
  sources: Record<string, string>;
  translations: Record<string, string>;
}

export async function PublishCommand(engineName: string) {
  if (!existsSync("./publishable.json")) {
    fatal("No publishable.ts found");
  }

  process.stdout.write("Reading publishable entries... ");

  const entries = JSON.parse(
    readFileSync("./publishable.json", "utf8"),
  ) as DataEntryPublishable[];

  process.stdout.write("OK\n");

  const engine = await DDBGetItem("tapp_engines", "engine", engineName);

  if (engine === null) {
    fatal(`Engine not found: ${engineName}`);
  }

  const publishedEntriesQuery = new DDBQueryBuilder<DataPublishableEntry>(
    "tapp_entries",
    "engine",
    engineName,
  );

  publishedEntriesQuery.pushProjections(
    "index",
    "reference",
    "resource",
    "context",
    "source",
  );

  const publishedEntries = new Map(
    (await publishedEntriesQuery.get()).map((entry) => [entry.index, entry]),
  );

  const publishableEntries: DataPublishableEntry[] = [];

  const publishedSourcesQuery = new DDBQueryBuilder<DataPublishableSources>(
    "tapp_sources",
    "engine",
    engineName,
  );

  publishedSourcesQuery.pushProjections("index", "sources", "translations");

  const publishedSources = new Map(
    (await publishedSourcesQuery.get()).map((entry) => [entry.index, entry]),
  );

  const publishableSources: DataPublishableSources[] = [];

  for (const entry of entries) {
    const publishedEntry = publishedEntries.get(entry.index);

    if (
      publishedEntry === undefined ||
      publishedEntry.reference !== entry.reference ||
      publishedEntry.resource !== entry.resource ||
      publishedEntry.source !== entry.sourceIndex
    ) {
      publishableEntries.push({
        engine: engineName,
        index: entry.index,
        reference: entry.reference,
        resource: entry.resource,
        ...(entry.context === undefined ? {} : { context: entry.context }),
        ...(entry.sourceIndex === undefined
          ? {}
          : { source: entry.sourceIndex }),
        ...(entry.translationIndex === undefined
          ? {}
          : { translation: entry.translationIndex }),
      });
    }

    const publishedSource = publishedSources.get(entry.index);

    if (
      publishedSource === undefined ||
      !deepEqual(publishedSource.sources, entry.sources) ||
      !deepEqual(publishedSource.translations, entry.translations)
    ) {
      publishableSources.push({
        engine: engineName,
        index: entry.index,
        sources: entry.sources,
        translations: entry.translations,
      });
    }
  }

  process.stdout.write(`Publishing entries (${publishableEntries.length})... `);

  await DDBBatchWrite("tapp_entries", publishableEntries);

  process.stdout.write("OK\n");

  process.stdout.write(`Publishing sources (${publishableSources.length})... `);

  await DDBBatchWrite("tapp_sources", publishableSources);

  process.stdout.write("OK\n");
}
