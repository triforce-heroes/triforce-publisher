import { existsSync, readFileSync, writeFileSync } from "node:fs";

import {
  DDBBatchWrite,
  DDBGetItem,
} from "@triforce-heroes/triforce-core/AWS/DDB";
import { DDBQueryBuilder } from "@triforce-heroes/triforce-core/AWS/DDBQueryBuilder";
import { fatal } from "@triforce-heroes/triforce-core/Console";
import { deepEqual } from "fast-equals";

import { DataEntryPublishable } from "../types/DataEntryPublishable.js";
import { weakLocalesFull } from "../utils/locale.js";

interface DataPublishableEntry {
  engine: string;
  index: number;
  reference: string;
  resource: string;
  context?: string;
  source?: string;
  translation?: string;
  same?: number;
  sameSources?: number;
}

interface DataPublishableSources {
  engine: string;
  index: number;
  sources: Record<string, string>;
  translations: Record<string, string>;
}

interface PublishCommandOptions {
  dryRun?: boolean;
}

export async function PublishCommand(
  engineName: string,
  options?: PublishCommandOptions,
) {
  if (!existsSync("./publishable.json")) {
    fatal("No publishable.ts found");
  }

  process.stdout.write("Reading publishable entries... ");

  const entries = JSON.parse(
    readFileSync("./publishable.json", "utf8"),
  ) as DataEntryPublishable[];

  process.stdout.write("OK\n");

  if (options?.dryRun !== true) {
    const engine = await DDBGetItem("tapp_engines", "engine", engineName);

    if (engine === null) {
      fatal(`Engine not found: ${engineName}`);
    }
  }

  const publishedEntriesQuery = new DDBQueryBuilder<DataPublishableEntry>(
    "tapp_entries",
    "engine",
    engineName,
  );

  const publishedEntries = new Map(
    (await publishedEntriesQuery.get()).map((entry) => [entry.index, entry]),
  );

  const publishableEntries: DataPublishableEntry[] = [];
  const publishableEntriesCopy: DataPublishableEntry[] = [];

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
  const publishableSourcesCopy: DataPublishableSources[] = [];

  const publishableHashes = new Map<string, number>();
  const publishableSourcesHashes = new Map<string, number>();

  for (const entry of entries) {
    const publishedEntry = publishedEntries.get(entry.index);

    const publishableHash = JSON.stringify(
      Object.fromEntries(
        Object.entries(entry.sources).flatMap(([key, value]) => {
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
    const publishableHashId = publishableHashes.get(publishableHash);

    if (publishableHashId === undefined) {
      publishableHashes.set(publishableHash, entry.index);
    }

    const publishableSourcesHash = JSON.stringify({ ...entry.sources });
    const publishableSourcesHashId = publishableSourcesHashes.get(
      publishableSourcesHash,
    );

    if (publishableSourcesHashId === undefined) {
      publishableSourcesHashes.set(publishableSourcesHash, entry.index);
    }

    const isSame =
      publishableSourcesHashId !== undefined ||
      publishableHashId !== publishableSourcesHashId;

    const publishableEntry: DataPublishableEntry = {
      engine: engineName,
      index: entry.index,
      reference: entry.reference,
      resource: entry.resource,
      ...publishedEntry,
      ...(entry.context === undefined ? {} : { context: entry.context }),
      ...(isSame || entry.sourceIndex === undefined
        ? {}
        : { source: entry.sourceIndex }),
      ...(isSame || entry.translationIndex === undefined
        ? {}
        : { translation: entry.translationIndex }),
      ...(publishableHashId === undefined ? {} : { same: publishableHashId }),
      ...(publishableSourcesHashId !== undefined &&
      publishableHashId !== publishableSourcesHashId
        ? { sameSources: publishableSourcesHashId }
        : {}),
    };

    publishableEntriesCopy.push(publishableEntry);

    if (
      publishedEntry === undefined ||
      publishedEntry.reference !== publishableEntry.reference ||
      publishedEntry.resource !== publishableEntry.resource ||
      publishedEntry.context !== publishableEntry.context ||
      publishedEntry.source !== publishableEntry.source ||
      publishedEntry.same !== publishableEntry.same ||
      publishedEntry.sameSources !== publishableEntry.sameSources
    ) {
      publishableEntries.push(publishableEntry);
    }

    const publishedSource = publishedSources.get(entry.index);
    const publishableSource: DataPublishableSources = {
      engine: engineName,
      index: entry.index,
      sources: entry.sources,
      translations: entry.translations!,
    };

    if (publishableSourcesHashId === undefined) {
      publishableSourcesCopy.push(publishableSource);

      if (
        publishedSource === undefined ||
        !deepEqual(publishedSource.sources, publishableSource.sources) ||
        !deepEqual(publishedSource.translations, publishableSource.translations)
      ) {
        publishableSources.push(publishableSource);
      }
    }
  }

  writeFileSync(
    "./publishable-entries.json",
    JSON.stringify(publishableEntriesCopy, null, 2),
  );

  if (options?.dryRun !== true) {
    process.stdout.write(
      `Publishing entries (${String(publishableEntries.length)} of ${String(publishableEntriesCopy.length)})... `,
    );

    await DDBBatchWrite("tapp_entries", publishableEntries);

    process.stdout.write("OK\n");
  }

  writeFileSync(
    "./publishable-sources.json",
    JSON.stringify(publishableSourcesCopy, null, 2),
  );

  if (options?.dryRun !== true) {
    process.stdout.write(
      `Publishing sources (${String(publishableSources.length)} of ${String(publishableSourcesCopy.length)})... `,
    );

    await DDBBatchWrite("tapp_sources", publishableSources);

    process.stdout.write("OK\n");
  }

  process.stdout.write("\nDONE!\n");
}
