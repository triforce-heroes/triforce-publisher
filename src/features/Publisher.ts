import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chunk } from "@triforce-heroes/triforce-core/Array";

import type { PublisherOutput } from "#/types/PublisherOutput";
import type { VersionHashes } from "#/types/VersionHashes";

import { PublisherResource } from "#/features/PublisherResource";
import { queryGenerator } from "#/QueryGenerator";
import { hash } from "#/services/HashService";
import { toObject } from "#/services/MapService";
import { getLatestVersion, getVersionHashes } from "#/services/VersionService";

export class Publisher {
  private readonly languages = new Map<string, string>();

  private readonly resources = new Map<string, PublisherResource>();

  public constructor(private readonly projectId: number) {}

  public addLanguage(name: string, canonical: string = name): void {
    if (this.languages.has(name) || this.languages.has(canonical)) {
      throw new Error(`language "${canonical}" is already registered`);
    }

    this.languages.set(name, canonical);
    this.languages.set(canonical, canonical);
  }

  public createResource(name: string): PublisherResource {
    if (this.resources.has(name)) {
      throw new Error(`resource "${name}" already exists`);
    }

    return this.resources.getOrInsert(name, new PublisherResource(this, name));
  }

  public resolveLanguage(name: string): string {
    const canonical = this.languages.get(name);

    if (canonical === undefined) {
      throw new Error(`language "${name}" is not registered`);
    }

    return canonical;
  }

  public dryRun(path: string): PublisherOutput {
    const entries = [...this.resources.values()].flatMap((resource) => resource.getEntries());

    const letters = new Set<number>();
    const hashes: VersionHashes = new Map();

    for (const entry of entries) {
      for (const reference of Object.keys(entry.sources)) {
        for (let index = 0; index < reference.length; index++) {
          letters.add(reference.codePointAt(index)!);
        }
      }

      let resourceHashes = hashes.get(entry.resource);

      if (!resourceHashes) {
        resourceHashes = new Map();
        hashes.set(entry.resource, resourceHashes);
      }

      resourceHashes.set(entry.reference, hash(JSON.stringify(entry)));
    }

    const hashesMerged = getVersionHashes(path);

    const diffEntries = entries.filter((entry) => {
      const currentHash = hashes.get(entry.resource)?.get(entry.reference);
      const previousHash = hashesMerged.get(entry.resource)?.get(entry.reference);

      return currentHash !== previousHash;
    });

    const needed = diffEntries.length > 0;

    let sql: string | null = null;
    let json: Record<string, Record<string, string>> | null = null;

    if (needed) {
      const chunkedEntries = chunk(diffEntries, 100);
      const date = Date.now();

      sql = chunkedEntries
        .map((partialEntries) => queryGenerator(this.projectId, partialEntries, date)!)
        .join(";\n\n");

      json = toObject(hashes);
    }

    return {
      entries,
      letters: new Set([...letters].toSorted((left, right) => left - right)),
      uniques: new Set(entries.flatMap((entry) => Object.keys(entry.sources))),
      version: { needed, sql, json, hashes: toObject(hashes) },
    };
  }

  public save(path: string): void {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }

    const { entries, letters, uniques, version } = this.dryRun(path);

    writeFileSync(join(path, "entries.json"), JSON.stringify(entries, null, "\t"));
    writeFileSync(join(path, "letters.json"), JSON.stringify([...letters], null, "\t"));
    writeFileSync(join(path, "uniques.json"), JSON.stringify([...uniques], null, "\t"));

    if (version.needed) {
      const nextVersion = getLatestVersion(path) + 1;

      writeFileSync(join(path, `query_v${nextVersion}.sql`), version.sql ?? "");
      writeFileSync(
        join(path, `query_v${nextVersion}.json`),
        JSON.stringify(version.json, null, "\t"),
      );
    }
  }
}
