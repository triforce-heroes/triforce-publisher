# AGENTS.md

## 1. Project overview

`@triforce-heroes/triforce-publisher` generates SQL upsert queries and versioned output files for
the TAPP translation platform. It manages multilingual text entries organized by resource and
reference, with incremental versioning that only emits changed entries.

Stack: strict TypeScript (ESM), Bun, tsdown, oxlint/oxfmt, Vitest.

Single entry point: `src/index.ts` bundles to `dist/index.mjs` (+ `dist/index.d.mts`, platform
`node`). Public exports: `Publisher`, `queryGenerator`.

```
src/
  features/
    Publisher.ts          # Publisher class — orchestrates everything
  services/
    HashService.ts        # SHA-256 hashing
    MapService.ts         # Map<string, Map<string, string>> → Record conversion
    MetadataService.ts    # metadata validation/normalization (normalizeMetadata)
    VersionService.ts     # Async reads/merges of versioned query_v{N}.json files
  types/
    MapObject.ts          # Record<string, Record<string, string>>
    PublisherEntry.ts     # { resource, reference, sources, metadata? }
    PublisherOutput.ts    # Full output of dryRun()
    VersionHashes.ts      # Map<string, Map<string, string>>
  QueryGenerator.ts       # queryGenerator + GeneratorEntry (PostgreSQL upsert SQL)
  index.ts                # Public exports: Publisher, queryGenerator
tests/
  Publisher.test.ts       # Tests for Publisher
  VersionService.test.ts  # Tests for version file merging logic
  QueryGenerator.test.ts  # Tests for SQL generation
  services/
    FileService.ts        # tmpDir + async cleanTmpDir() helper
    tmp/                  # Shared temp dir for tests (only .gitignore is committed)
```

## 2. Mandatory rules

1. New file placement: orchestration in `src/features/`, I/O and pure logic in
   `src/services/<Name>Service.ts`, shared shapes in `src/types/`. Only `src/index.ts` exports are
   public API.
2. Internal imports use the `#/` alias (`./src/*`); tests may additionally use `#tests/*`
   (`./tests/*`). Import order and formatting belong to oxfmt — never hand-order imports.
3. `type` imports use `import type { ... }`.
4. `public` modifier on all class methods.
5. Error messages: lowercase, no trailing period — `language "x" is not registered`.
6. Use `parseAs<T>()` and `exists()` from `@rheactor/rheactor-core` instead of raw `JSON.parse()`
   and `node:fs` existence checks; use `arkregex` instead of raw `RegExp`; use
   `Object.fromEntries()` for Map-to-object conversion.
7. `Publisher` I/O is async: `dryRun(path): Promise<PublisherOutput>`, `save(path): Promise<void>`,
   `getVersionHashes`/`getLatestVersion` return promises.
8. Data flow: `addLanguage(name, canonical?)` registers a language (alias resolves to canonical);
   `publisher.addReference(language, resource, reference, text, metadata?)` merges same texts across
   languages and throws on duplicates; an optional plain-object `metadata` is stored as the entry's
   absolute value (last write wins, empty objects count as absent) and normalized by
   `normalizeMetadata`; the SQL `metadata` column receives it as-is as the full JSON value (never
   wrapped as `{"metadata": ...}`); `await publisher.dryRun(path)` computes without writing;
   `await publisher.save(path)` writes `entries.json`, `letters.json`, `uniques.json` plus
   `query_v{N}.sql`/`.json` only for changed entries (chunks of 100).
9. Error contract: `addLanguage` throws if name or canonical is already registered;
   `resolveLanguage` throws if language is not registered; `addReference` throws if the same
   language+reference+text is added twice; `normalizeMetadata` throws if metadata is not a plain
   object.
10. `README.md`, `AGENTS.md`, and `CHANGELOG.md` are maintained by the `/create-agents` skill, which
    audits them against the code. Never generate or regenerate them with ad hoc scripts.

## 3. Testing policy

- Framework: Vitest, always executed through `bun run test` (single run) or `bun run test:watch`.
- Tests live in `tests/*.test.ts`, mirroring the `src` file name; shared fixtures live in
  `tests/services/FileService.ts` (`tmpDir`, `cleanTmpDir()`). `MetadataService` has no dedicated
  test file; it is covered indirectly through the `Publisher` and `QueryGenerator` tests.
- Test files run sequentially (`fileParallelism: false` in vitest.config.ts) because they share
  `tests/tmp/`; it is cleaned (except `.gitignore`) before and after each test.
- Every async test opens with `expect.assertions(N)` carrying the exact assertion count.
- Use `await publisher.dryRun(tmpDir)` in tests — it needs a path to read existing version files.
- Use `expect.stringContaining()` or `expect.stringMatching()` for SQL assertions; use `Set`
  comparisons for `letters` and `uniques`.
- No coverage threshold is configured; do not introduce one without need.
- Every bug fix MUST include a regression test that reproduces the bug before the fix.

## 4. Documentation format

README API entries use `### name` followed by a TypeScript signature code block (every overload in
the same block), one to three sentences (what it does, when to use it, notable edge-case behavior),
then a minimal TypeScript example with the expected output as a comment. Entries are grouped under
`##` headings per area (`Publisher`, `QueryGenerator`, `Types`), methods ordered as declared in
code.

## 5. Dependency policy

- Bun is the official package manager (`bun.lock`); install with `bun install`.
- Zero new runtime dependencies without justification. Org packages use `github:` specs
  (`@rheactor/*`, `@triforce-heroes/*`).

## 6. Build and publish

- `tsdown` bundles `src/index.ts` into `dist/` (platform `node`, minified, `.mjs` + `.d.mts`);
  `bun run build` runs lint and tests first.
- Only `dist/` is published to npm.

## 7. Quality gates

Scripts available in `package.json`:

| Command              | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `bun run build`      | Lint + test + bundle with tsdown                      |
| `bun run lint`       | Full lint pipeline (typecheck + oxlint + oxfmt check) |
| `bun run lint:fix`   | Auto-fix lint issues                                  |
| `bun run oxfmt`      | Check formatting of `./src ./tests`                   |
| `bun run oxfmt:fix`  | Format `./src ./tests`                                |
| `bun run oxlint`     | Lint `./src ./tests`                                  |
| `bun run oxlint:fix` | Auto-fix lint of `./src ./tests`                      |
| `bun run test`       | Run tests (vitest, single run, sequential files)      |
| `bun run test:watch` | Run tests in watch mode                               |
| `bun run typecheck`  | Type checking without emit                            |

> Always use `bun run <script>` (the `package.json` scripts), never a direct binary: bare
> `bunx vitest`, for instance, bypasses the project's pinned toolchain.
