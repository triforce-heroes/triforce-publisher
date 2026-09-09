# @triforce-heroes/triforce-publisher

Project entries generator for TAPP.

## Installation

```sh
bun add @triforce-heroes/triforce-publisher
```

## Quick start

```ts
import { Publisher } from "@triforce-heroes/triforce-publisher";

const publisher = new Publisher(1);
publisher.addLanguage("en");
publisher.addLanguage("pt");
publisher.addReference("en", "dialogs.xml", "IDD_DIALOG.title", "Hello");
publisher.addReference("pt", "dialogs.xml", "IDD_DIALOG.title", "Olá");

await publisher.save("./output");
// writes entries.json, letters.json, uniques.json and query_v1.sql/.json
```

## Publisher

Stateful entry collector. Register languages, add references, then compute (`dryRun`) or persist
(`save`) the outputs. All file I/O is asynchronous.

### constructor

```ts
constructor(projectId: number);
```

Creates a publisher bound to a TAPP project id, which is written into every generated SQL row. Use
one instance per project.

```ts
const publisher = new Publisher(1);
```

### addLanguage

```ts
addLanguage(name: string, canonical?: string): void;
```

Registers a language. When `canonical` is provided, `name` becomes an alias that resolves to it;
both map to the canonical internally. Throws if `name` or `canonical` is already registered.

```ts
publisher.addLanguage("en");
publisher.addLanguage("ja", "jp"); // "ja" resolves to "jp"
```

### resolveLanguage

```ts
resolveLanguage(name: string): string;
```

Returns the canonical language for a registered name or alias. Throws if the language is not
registered. You rarely call this directly; `addReference` resolves aliases for you.

```ts
publisher.resolveLanguage("ja"); // "jp"
```

### addReference

```ts
addReference(
  language: string,
  resource: string,
  reference: string,
  text: string,
  metadata?: Record<string, unknown>,
): void;
```

Adds a source text for a language+resource+reference combination. The same text added for different
languages merges into one entry (`{ banana: ["pt", "en"] }`). Throws on unregistered languages and
when the same language+reference+text combination is added twice. An optional plain-object
`metadata` is stored on the entry as its absolute value (last write wins, empty objects count as
absent); it is emitted as `{"metadata": {...}}` so `metadata.metadata` is always an object.

```ts
publisher.addReference("en", "dialogs.xml", "IDD_DIALOG.title", "Hello", { level: 5 });
```

### getEntries

```ts
getEntries(): PublisherEntry[];
```

Returns all collected entries synchronously, without touching the disk. Each entry carries its
resource, reference, and per-text language lists.

```ts
publisher.getEntries();
// [{ resource: "dialogs.xml", reference: "IDD_DIALOG.title",
//    sources: { Hello: ["en"] } }]
```

### dryRun

```ts
dryRun(path: string): Promise<PublisherOutput>;
```

Computes every output without writing to disk. Reads existing `query_v*.json` files from `path` to
diff current entries against previous versions; `version.needed` is `false` (with null `sql`/`json`)
when nothing changed.

```ts
const output = await publisher.dryRun("./output");
// output.version.needed === true when entries changed
```

### save

```ts
save(path: string): Promise<void>;
```

Awaits `dryRun(path)`, then writes `entries.json`, `letters.json`, and `uniques.json` to `path`.
When the version is needed, also writes `query_v{N}.sql` (changed entries only, in chunks of 100)
and `query_v{N}.json` (hash snapshot), where N is one above the latest existing version.

```ts
await publisher.save("./output");
```

## QueryGenerator

### queryGenerator

```ts
queryGenerator(projectId: number, entries: GeneratorEntry[], updatedAt?: number): string | null;
```

Builds a PostgreSQL upsert (`INSERT ... ON CONFLICT DO UPDATE`) for `projectEntries` rows. Changed
`sources` reset the translation columns to `NULL`. The `INSERT` includes the `metadata` column
(`NULL` when the entry has none, `{"metadata": {...}}` otherwise); on conflict, provided metadata is
deep-merged into the stored JSON via `JSON_PATCH`, preserving unrelated keys, while absent metadata
keeps the previous value (or resets it when `sources` changed). Returns `null` when `entries` is
empty; defaults `updatedAt` to `Date.now()`. You rarely call this directly; `dryRun`/`save` chunk
entries and call it for you.

```ts
queryGenerator(1, [{ reference: "hi", sources: { hello: ["en"] } }], 0);
// 'INSERT INTO `projectEntries` ... ON CONFLICT ... DO UPDATE SET ...'
```

## Types

### GeneratorEntry

```ts
interface GeneratorEntry {
  resource?: string;
  reference: number | string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}
```

One row fed to `queryGenerator`: the resource file (absent becomes SQL `NULL`), the reference key,
the per-text language lists, and the optional metadata object (emitted as `{"metadata": {...}}`;
empty counts as absent).

### PublisherEntry

```ts
interface PublisherEntry {
  resource: string;
  reference: string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}
```

One collected entry as returned by `getEntries` and stored in `entries.json`. `resource` is `""`
when no resource name was given. `metadata` is `undefined` unless provided via `addReference`;
because it feeds the entry hash, metadata changes alone trigger a new version.

### PublisherOutput

```ts
interface PublisherOutput {
  entries: PublisherEntry[];
  letters: Set<number>;
  uniques: Set<string>;
  version: {
    needed: boolean;
    sql: string | null;
    json: Record<string, Record<string, string>> | null;
    hashes: Record<string, Record<string, string>>;
  };
}
```

Full result of `dryRun`: all entries, sorted unique Unicode code points of every source text, unique
source texts, and the version payload (`sql`/`json` are null when `needed` is false, while `hashes`
is always present).

## Output files

| File              | Content                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `entries.json`    | `PublisherEntry[]` — all entries with resource, reference, sources, metadata |
| `letters.json`    | `number[]` — sorted unique Unicode code points from all source texts         |
| `uniques.json`    | `string[]` — all unique source texts across all entries                      |
| `query_v{N}.json` | `Record<resource, Record<reference, sha256>>` — hash snapshot                |
| `query_v{N}.sql`  | SQL upsert with only entries changed since the previous version              |

## Versioning

Each `save()`/`dryRun()` call compares current entry hashes against all `query_v*.json` snapshots in
the output directory (later versions overwrite earlier ones per resource; resources missing from a
newer file persist from older ones). Only changed entries produce SQL. Each version file is an
incremental overlay, not a full snapshot — never delete intermediate versions.
