# AGENTS.md

## Overview

`@triforce-heroes/triforce-publisher` generates SQL upsert queries and versioned output files for the TAPP translation platform.
It manages multilingual text entries organized by resource and reference, with incremental versioning that only emits changed entries.

## Directory Structure

```
src/
  features/
    Publisher.ts          # Main class — orchestrates everything
    PublisherResource.ts  # Represents a single resource file with its references
  services/
    HashService.ts        # SHA-256 hashing
    JsonService.ts        # Safe JSON.parse with default value
    MapService.ts         # Map<string, Map<string, string>> → Record conversion
    VersionService.ts     # Reads/merges versioned query_v{N}.json files
  types/
    MapObject.ts          # Record<string, Record<string, string>>
    PublisherEntry.ts     # { resource, reference, sources }
    PublisherOutput.ts    # Full output of dryRun()
    VersionHashes.ts      # Map<string, Map<string, string>>
  QueryGenerator.ts       # SQL INSERT builder using rheactor-query-builder
  index.ts                # Public exports: Publisher, queryGenerator
tests/
  Publisher.test.ts       # Tests for Publisher + PublisherResource
  VersionService.test.ts  # Tests for version file merging logic
  QueryGenerator.test.ts  # Tests for SQL generation
  services/tmp/           # Shared temp dir for tests (cleaned before/after each test)
```

## Architecture

### Publisher (entry point)

```ts
const publisher = new Publisher(projectId);
publisher.addLanguage("en");
publisher.addLanguage("ja", "jp"); // "ja" is an alias, "jp" is canonical
publisher.addLanguage("pt");

const resource = publisher.createResource("dialogs.xml");
resource.addReference("en", "IDD_DIALOG.title", "Hello");
resource.addReference("ja", "IDD_DIALOG.title", "こんにちは");
resource.addReference("pt", "IDD_DIALOG.title", "Olá");

publisher.save("./output");
```

### Data flow

1. `addLanguage(name, canonical?)` — registers a language. If `canonical` is provided, `name` becomes an alias that resolves to `canonical`. Both map to the canonical internally.
2. `createResource(name)` — creates a `PublisherResource` bound to this publisher. Throws if name already exists.
3. `resource.addReference(language, reference, text)` — adds a text for a given language+reference combination. If the same text is added for different languages, they merge into one entry (`{ "banana": ["pt", "en"] }`). Throws if the same language+reference+text combination is added twice.
4. `dryRun(path)` — computes all outputs without writing to disk. Returns `PublisherOutput`.
5. `save(path)` — calls `dryRun`, then writes all files to disk.

### Versioning system

Each `save()` or `dryRun()` call compares current entries against previously saved version files:

- `query_v{N}.json` — snapshot of all entry hashes at version N (key: resource → reference → sha256)
- `query_v{N}.sql` — SQL containing only entries that changed since the previous version

The system reads all `query_v*.json` files from v1 to the latest, merges them (later versions overwrite earlier ones for the same resource), and diffs against current hashes. Only changed entries produce SQL output.

**Important:** each version file is an incremental overlay, not a full snapshot. If resource A appears in v1 and v2, v2's data overwrites v1's for that resource. If resource B only appears in v1, it persists in the merged result.

### Output files

| File              | Content                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `entries.json`    | `PublisherEntry[]` — all entries with resource, reference, sources   |
| `letters.json`    | `number[]` — sorted unique Unicode code points from all source texts |
| `uniques.json`    | `string[]` — all unique source texts across all entries              |
| `query_v{N}.json` | `Record<resource, Record<reference, sha256>>` — hash snapshot        |
| `query_v{N}.sql`  | SQL INSERT with ON CONFLICT upsert (chunked in groups of 100)        |

## Key Types

```ts
interface PublisherEntry {
  resource: string; // "" if no resource name
  reference: string; // e.g. "IDD_DIALOG.title"
  sources: Record<string, string[]>; // { "Hello": ["en"], "Olá": ["pt"] }
}

interface PublisherOutput {
  entries: PublisherEntry[];
  letters: Set<number>; // sorted code points
  uniques: Set<string>; // unique texts
  version: {
    needed: boolean; // true if there are changes vs previous versions
    sql: string | null; // null if !needed
    json: Record<string, Record<string, string>> | null; // null if !needed
    hashes: Record<string, Record<string, string>>; // always present
  };
}

type VersionHashes = Map<string, Map<string, string>>; // resource → reference → hash
type MapObject = Record<string, Record<string, string>>; // JSON-serializable VersionHashes
```

## Dependencies

- `@rheactor/rheactor-query-builder` — SQL DSL for building INSERT queries
- `@triforce-heroes/triforce-core` — `chunk()` utility for splitting arrays
- `arkregex` — typed regex with named groups (used in VersionService)

## Conventions

### Code style

- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`)
- ESM only (`"type": "module"`)
- Path aliases: `#/*` → `./src/*`, `#tests/*` → `./tests/*`
- `public` modifier on all class methods
- Error messages: lowercase, no trailing period — `language "x" is not registered`
- Use `Map.getOrInsert()` instead of manual `has`/`set`/`get` pattern where available
- Use `arkregex` for regex patterns instead of raw `RegExp`
- Use `parseAs<T>()` instead of raw `JSON.parse()`
- Use `Object.fromEntries()` for Map-to-object conversion

### Imports

- External deps first, then `#/types/*`, then `#/services/*`, then `#/features/*`, then `#/QueryGenerator`
- `type` imports use `import type { ... }`

### Error handling

- `addLanguage` throws if name or canonical is already registered
- `createResource` throws if resource name already exists
- `resolveLanguage` throws if language is not registered
- `addReference` throws if same language+reference+text is added twice

## Scripts

| Command              | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `npm test`           | Run tests (vitest, single run, sequential files)      |
| `npm run test:watch` | Run tests in watch mode                               |
| `npm run typecheck`  | Type checking without emit                            |
| `npm run lint`       | Full lint pipeline (typecheck + eslint + oxfmt check) |
| `npm run lint:fix`   | Auto-fix lint issues                                  |
| `npm run build`      | Compile TS + minify with SWC                          |

## Testing

- Uses Vitest
- Test files run sequentially (`fileParallelism: false` in vitest.config.mjs) because they share `tests/tmp/`
- `tests/tmp/` is cleaned (except `.gitignore`) before and after each test via `cleanTmpDir()`
- Use `dryRun(tmpDir)` in tests — `dryRun` requires a path to read existing version files
- Use `expect.stringContaining()` or `expect.stringMatching()` for SQL assertions
- Use `Set` comparisons for `letters` and `uniques`

## Build

- `tspc` (TypeScript with ts-patch) compiles `src/**/*.ts` to `dist/`
- `typescript-transform-paths` rewrites `#/*` → `./*` in emitted JS and `.d.ts`
- `swc` minifies the JS in `dist/`
- Only `dist/` is published to npm
