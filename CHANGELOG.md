# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [4.0.0] - 2026-09-09

### Added

- Publisher class with incremental versioned publishing (`dryRun`/`save`, `entries.json`,
  `letters.json`, `uniques.json`, `query_v{N}.sql`/`.json` outputs).
- `@rheactor/rheactor-core` runtime dependency (`parseAs`, `exists`).
- Optional `metadata` on `addReference`, `PublisherEntry` and `GeneratorEntry`, emitted as
  `{"metadata": {...}}` (`metadata.metadata` is always an object; empty counts as absent).
- `metadata` column in generated upserts, deep-merged on conflict via `JSON_PATCH`.

### Changed

- Generator query API renamed (`generateQuery` is now `queryGenerator`).
- SQL identifiers use PostgreSQL double quotes instead of backticks.
- Package entry is ESM `dist/index.mjs` (with `.d.mts` and an `exports` map), bundled with tsdown.
- Lint pipeline uses oxlint and oxfmt; scripts run through Bun.
- `addReference` keeps the last provided metadata as the entry's absolute value (no key merging);
  metadata changes alone trigger a new version.

## [3.0.0] - 2026-06-27

### Added

- Upsert support with `ON CONFLICT` clause in generated queries.

### Fixed

- Reset translations when sources change.

## [2.0.0] - 2025-09-12

### Changed

- Simplified codebase to a single implementation.

## [1.0.0] - 2025-08-31

### Added

- Raw SQL generation during publish.
- LBRS and PKLA driver support.

### Fixed

- PKLA driver issues.
