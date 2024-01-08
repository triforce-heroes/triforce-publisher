import { writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";
import {
  supportedLanguages,
  translate,
} from "@triforce-heroes/triforce-core/Translator";
import PQueue from "p-queue";

import { loadEngineDriver, loadSourceDriver } from "../drivers/index.js";
import { DataEntryTranslated } from "../types/DataEntryTranslated.js";
import { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";
import { printProgress } from "../utils/progress.js";

interface CompileOptions {
  translate?: string;
}

export async function PrepareCommand(
  engineDriver: string,
  sourceDriver: string,
  filesMatcher: string,
  options?: CompileOptions,
) {
  const sourceDriverInstance = loadSourceDriver(sourceDriver);

  if (sourceDriverInstance === undefined) {
    fatal(`Unsupported source driver: ${sourceDriver}`);
  }

  const engineDriverInstance = loadEngineDriver(engineDriver);

  if (engineDriverInstance === undefined) {
    fatal(`Unsupported engine driver: ${engineDriver}`);
  }

  let languageSource: string | undefined;
  let languageTarget: string | undefined;

  if (options?.translate !== undefined) {
    [languageSource, languageTarget] = options.translate.split(":");

    if (languageSource === undefined || languageTarget === undefined) {
      fatal(`Invalid translate pairs option: ${options.translate}`);
    }

    if (!supportedLanguages.includes(languageSource)) {
      fatal(`Invalid source language: ${languageSource}`);
    }

    if (!supportedLanguages.includes(languageTarget)) {
      fatal(`Invalid target language: ${languageTarget}`);
    }
  }

  process.stdout.write("Compiling... ");

  const entries = await sourceDriverInstance.entries(
    filesMatcher,
    engineDriverInstance,
  );

  writeFileSync("entries.json", JSON.stringify(entries, null, 2));

  process.stdout.write("OK\n");

  if (languageSource !== undefined && languageTarget !== undefined) {
    process.stdout.write("Translating...\n\n");

    printProgress(0, entries.length);

    let translatedEntries = 0;

    let translatedLast: DataEntryTranslationProgress | undefined;
    let translatedLastProgress: DataEntryTranslationProgress | undefined;

    const translationProgressInterval = setInterval(() => {
      if (translatedLast !== translatedLastProgress) {
        translatedLastProgress = translatedLast;

        printProgress(
          translatedEntries,
          entries.length,
          translatedLastProgress,
        );
      }
    }, 1000);

    const queue = new PQueue({ concurrency: 8 });

    for (const entry of entries as DataEntryTranslated[]) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      void queue.add(async () => {
        const commands = engineDriverInstance.parse(entry.source);
        const commandsCompressed = commands.toCompressed();
        const commandsText = commandsCompressed.toText();

        const entryTranslation = await translate(
          "http://127.0.0.1:7900",
          languageSource!,
          languageTarget!,
          commandsText,
        );

        translatedEntries++;

        // eslint-disable-next-line require-atomic-updates
        entry.translation = commandsCompressed.fromCompressed(
          entryTranslation ?? "",
          commands,
        );

        entry.translationIndex = engineDriverInstance
          .parse(entry.translation)
          .toIndex();

        translatedLast = {
          from: commands.toIndex(),
          to: entry.translationIndex,
        };
      });
    }

    await queue.onIdle();

    clearInterval(translationProgressInterval);
    printProgress(entries.length, entries.length);

    writeFileSync("entries.json", JSON.stringify(entries, null, 2));

    process.stdout.write("DONE\n");
  }
}
