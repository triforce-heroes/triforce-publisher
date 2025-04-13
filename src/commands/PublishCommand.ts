import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";

import type { Entry } from "../types/Entry.js";

function escape(value: number | string) {
  return typeof value === "number" ? value : `'${value.replace(/'/g, "''")}'`;
}

export function PublishCommand() {
  if (!existsSync("./publishable.json")) {
    fatal("No publishable.ts found");
  }

  process.stdout.write("Reading publishable entries... ");

  const entries = JSON.parse(
    readFileSync("./publishable.json", "utf8"),
  ) as Entry[];

  process.stdout.write("OK\n");

  const publishableEntries: string[] = [
    `INSERT INTO [entries] ([project], [index], [resource], [reference], [sources]) VALUES`,
  ];

  for (const entry of entries) {
    const queryNumber = Number(entry.index);
    const queryResource = escape(entry.resource);
    const queryReference = escape(entry.reference);
    const querySources = escape(JSON.stringify(entry.sources));

    publishableEntries.push(
      `(2, ${queryNumber}, ${queryResource}, ${queryReference}, ${querySources}),`,
    );
  }

  writeFileSync(
    "./publishable-queries.sql",
    publishableEntries.join("\n\t").slice(0, -1),
  );

  process.stdout.write("\nDONE!\n");
}
