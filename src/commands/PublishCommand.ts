import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";

import { getEngine } from "../database/EngineDatabase.js";
import { getEntries, updateEntries } from "../database/EntryDatabase.js";
import { getEntryHash } from "../utils/HashUtils.js";
import { isSame as objectIsSame } from "../utils/ObjectUtils.js";

import type { Entry } from "../types/Entry.js";
import type { EntryPublishable } from "../types/EntryPublishable.js";

interface PublishCommandOptions {
  dryRun: boolean;
  testRun: boolean;
}

export async function PublishCommand(
  engineName: string,
  options: PublishCommandOptions,
) {
  if (!existsSync("./publishable.json")) {
    fatal("No publishable.ts found");
  }

  process.stdout.write("Reading publishable entries... ");

  const entries = JSON.parse(
    readFileSync("./publishable.json", "utf8"),
  ) as Entry[];

  process.stdout.write("OK\n");

  if (!options.dryRun) {
    const engine = await getEngine(engineName);

    if (engine === null) {
      fatal(`Engine not found: ${engineName}`);
    }
  }

  const publishedEntries = new Map(
    (await getEntries(engineName, options.testRun)).map((entry) => [
      entry.index,
      entry,
    ]),
  );

  const publishableEntries: EntryPublishable[] = [];

  const sameHashes = new Map<string, number>();
  const sameSourcesHashes = new Map<string, number>();

  for (const entry of entries) {
    const publishedEntry = publishedEntries.get(entry.index);

    if (publishedEntry === undefined && options.testRun) {
      continue;
    }

    const sameHash = getEntryHash(entry);
    const sameId = sameHashes.get(sameHash);

    if (sameId === undefined) {
      sameHashes.set(sameHash, entry.index);
    }

    const sameSourcesHash = JSON.stringify({ ...entry.sources });
    const sameSourcesId = sameSourcesHashes.get(sameSourcesHash);

    if (sameSourcesId === undefined) {
      sameSourcesHashes.set(sameSourcesHash, entry.index);
    }

    const isSame = sameId !== undefined || sameSourcesId !== sameId;

    const publishableEntry: EntryPublishable = {
      engine: engineName,
      index: entry.index,
      resource: entry.resource,
      reference: entry.reference,
      context: entry.context,
      sources: isSame ? {} : entry.sources,
      translations: isSame ? {} : entry.translations,
      sourceIndex: isSame ? null : entry.sourceIndex,
      translationIndex: isSame ? null : entry.translationIndex,
      same: sameId ?? null,
      sameSources:
        sameSourcesId !== undefined && sameSourcesId !== sameId
          ? sameSourcesId
          : null,
    };

    if (publishedEntry === undefined) {
      publishableEntries.push(publishableEntry);
    } else if (
      publishableEntry.same !== null &&
      publishableEntry.same !== publishedEntry.same
    ) {
      publishableEntries.push(publishableEntry);
    } else if (
      publishableEntry.sameSources !== null &&
      publishableEntry.sameSources !== publishedEntry.sameSources
    ) {
      publishableEntries.push(publishableEntry);
    } else if (publishableEntry.same === null) {
      if (publishableEntry.sourceIndex !== publishedEntry.sourceIndex) {
        publishableEntries.push(publishableEntry);
      } else if (
        !objectIsSame(publishableEntry.sources, publishedEntry.sources)
      ) {
        publishableEntries.push(publishableEntry);
      } else if (
        !objectIsSame(
          publishableEntry.translations,
          publishedEntry.translations,
        )
      ) {
        publishableEntries.push(publishableEntry);
      }
    }
  }

  writeFileSync(
    "./publishable-unfiltered.json",
    JSON.stringify(publishableEntries, null, 2),
  );

  if (!options.dryRun) {
    for (
      let publishableEntryIndex = 0;
      publishableEntryIndex < publishableEntries.length;
      publishableEntryIndex += 1000
    ) {
      // eslint-disable-next-line no-await-in-loop
      await updateEntries(
        engineName,
        publishableEntries.slice(
          publishableEntryIndex,
          publishableEntryIndex + 1000,
        ),
      );
    }
  }

  process.stdout.write("\nDONE!\n");
}
