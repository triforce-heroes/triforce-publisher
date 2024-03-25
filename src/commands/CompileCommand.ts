import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";
import {
  supportedLanguages,
  translate,
} from "@triforce-heroes/triforce-core/Translator";
import PQueue from "p-queue";

import { loadEngineDriver } from "../drivers/index.js";
import { DataEntryPublishable } from "../types/DataEntryPublishable.js";
import { DataEntryTranslated } from "../types/DataEntryTranslated.js";
import { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";
import { getEntryKey } from "../utils/entry.js";
import { guessLocale, simplifyLocales } from "../utils/locale.js";
import { printProgress } from "../utils/progress.js";

interface CompileOptions {
  letters?: boolean;
  uniques?: boolean;
  translate?: string;
  translateRetry?: boolean;
}

function loadEntries(language: string) {
  if (existsSync(`./${language}/entries_default.json`)) {
    return JSON.parse(
      readFileSync(`./${language}/entries_default.json`, "utf8"),
    ) as DataEntryTranslated[];
  }

  if (existsSync(`./entries_${language}.json`)) {
    return JSON.parse(
      readFileSync(`./entries_${language}.json`, "utf8"),
    ) as DataEntryTranslated[];
  }

  fatal(`No entries.json found in ${language}`);
}

type DataEntryTranslationPair =
  | [source: string, translation: string, translationIndex: string]
  | [source: string];

function swapMap(map: Map<string, string[]>) {
  return Object.fromEntries(
    [...map.entries()].map(([key, value]) => [
      simplifyLocales(value).join(","),
      key,
    ]),
  );
}

export async function CompileCommand(
  engineDriver: string,
  languagesInput: string,
  options?: CompileOptions,
) {
  const engineDriverInstance = loadEngineDriver(engineDriver);

  if (engineDriverInstance === undefined) {
    fatal(`Unsupported engine driver: ${engineDriver}`);
  }

  const languagesDirectories = languagesInput.split(" ");

  if (languagesDirectories.length === 0) {
    fatal("No languages specified");
  }

  if (
    options?.translate !== undefined &&
    !supportedLanguages.includes(options.translate)
  ) {
    fatal(`Invalid source language: ${options.translate}`);
  }

  const languages = new Map<string, string>();

  for (const language of languagesDirectories) {
    const languageGuessed = guessLocale(language);

    if (languageGuessed === undefined) {
      fatal(`Unsupported language: ${language}`);
    }

    languages.set(language, languageGuessed);
  }

  const rawEntries = new Map<string, Map<string, DataEntryTranslationPair>>();

  for await (const [language, languageGuessed] of languages.entries()) {
    const entries = loadEntries(language);

    if (options?.translate === undefined) {
      rawEntries.set(
        languageGuessed,
        new Map<string, DataEntryTranslationPair>(
          entries.map((entry) => [getEntryKey(entry), [entry.source]]),
        ),
      );
    } else {
      process.stdout.write(`Translating from ${language}...\n\n`);

      const cachedTranslations = new Map<string, string | null>();

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

      printProgress(0, entries.length);

      const queue = new PQueue({ concurrency: 8 });

      for (const entry of entries) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        void queue.add(async () => {
          const commands = engineDriverInstance.parse(entry.source);
          const commandsCompressed = commands.toCompressed();
          const commandsText = commandsCompressed.toText();

          let entryTranslation: string | null = null;

          if (cachedTranslations.has(commandsText)) {
            entryTranslation = cachedTranslations.get(commandsText)!;
          } else {
            for (let i = 0; i < 10; i++) {
              try {
                entryTranslation = await translate(
                  "http://127.0.0.1:7900",
                  languageGuessed,
                  options.translate!,
                  commandsText,
                  true,
                  Boolean(options.translateRetry),
                );

                cachedTranslations.set(commandsText, entryTranslation);

                break;
              } catch {
                // Empty.
              }
            }
          }

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

      rawEntries.set(
        languageGuessed,
        new Map<string, DataEntryTranslationPair>(
          entries.map((entry) => [
            getEntryKey(entry),
            [entry.source, entry.translation!, entry.translationIndex!],
          ]),
        ),
      );
    }
  }

  process.stdout.write("Preparing publishables... ");

  const publishables: DataEntryPublishable[] = [];

  const entries = loadEntries(languagesDirectories.at(0)!);

  for (const [entryIndex, entry] of entries.entries()) {
    const entryKey = getEntryKey(entry);

    const entrySources = new Map<string, string[]>();
    const entryTranslations = new Map<string, string[]>();

    for (const language of languages.values()) {
      const languageEntry = rawEntries.get(language);

      if (languageEntry === undefined) {
        continue;
      }

      const [source, translation] = languageEntry.get(entryKey)!;

      if (entrySources.has(source)) {
        entrySources.get(source)!.push(language);
      } else {
        entrySources.set(source, [language]);
      }

      if (options?.translate !== undefined) {
        if (entryTranslations.has(translation!)) {
          entryTranslations.get(translation!)!.push(language);
        } else {
          entryTranslations.set(translation!, [language]);
        }
      }
    }

    const entryTranslationIndex = rawEntries
      .get(languagesDirectories.at(0)!)
      ?.get(entryKey)?.[2];

    const publishable: DataEntryPublishable = {
      index: entryIndex + 1,
      resource: entry.resource,
      reference: entry.reference,
      ...(entry.context !== undefined && {
        context: entry.context,
      }),
      sourceIndex: entry.sourceIndex,
      ...(options?.translate !== undefined &&
        entryTranslationIndex !== undefined && {
          translationIndex: entryTranslationIndex,
        }),
      sources: swapMap(entrySources),
      ...(options?.translate !== undefined && {
        translations: swapMap(entryTranslations),
      }),
    };

    publishables.push(publishable);
  }

  if (options?.uniques) {
    const uniques = new Set<string>();

    for (const publishable of publishables) {
      for (const source of Object.values(publishable.sources)) {
        uniques.add(source);
      }
    }

    writeFileSync("./uniques.json", JSON.stringify([...uniques], null, 2));
  }

  if (options?.letters) {
    const letters = new Set<string>();

    for (const publishable of publishables) {
      for (const source of Object.values(publishable.sources)) {
        for (const letter of source) {
          letters.add(letter);
        }
      }
    }

    writeFileSync(
      "./letters.txt",
      [...letters]
        .map((s) => s.codePointAt(0)!)
        .sort((a, b) => a - b)
        .join(","),
    );
  }

  writeFileSync("./publishable.json", JSON.stringify(publishables, null, 2));

  process.stdout.write("OK");
}
