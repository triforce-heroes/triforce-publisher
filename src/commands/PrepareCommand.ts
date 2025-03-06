import { writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";

import { loadEngineDriver, loadSourceDriver } from "../drivers/index.js";

export async function PrepareCommand(
  engineDriver: string,
  sourceDriver: string,
  filesMatcher: string,
) {
  const sourceDriverInstance = loadSourceDriver(sourceDriver);

  if (sourceDriverInstance === undefined) {
    fatal(`Unsupported source driver: ${sourceDriver}`);
  }

  const engineDriverInstance = loadEngineDriver(engineDriver);

  if (engineDriverInstance === undefined) {
    fatal(`Unsupported engine driver: ${engineDriver}`);
  }

  process.stdout.write("Compiling entries... ");

  const rawEntries = await sourceDriverInstance.entries(
    filesMatcher,
    engineDriverInstance,
  );

  process.stdout.write("OK\n");

  process.stdout.write("Reassigning entries to locales... ");

  const entries = sourceDriverInstance.reassignLocales(rawEntries);

  for (const [locale, localeEntries] of Object.entries(entries)) {
    writeFileSync(
      `entries_${locale}.json`,
      JSON.stringify(localeEntries, null, 2),
    );
  }

  process.stdout.write("OK\n");

  process.stdout.write("\nDONE!");
}
