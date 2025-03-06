import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { Entries, EntryText } from "@triforce-heroes/triforce-commands";
import { fatal } from "@triforce-heroes/triforce-core/Console";
import { secureHash } from "@triforce-heroes/triforce-core/Hash";
import chalk from "chalk";
import PQueue from "p-queue";

import { loadEngineDriver } from "../drivers/index.js";
import { commandDrivers } from "../types/CommandDriver.js";
import { DropCommandDriver } from "../types/DropCommandDriver.js";
import { getEntryKey } from "../utils/entry.js";
import { translate } from "../utils/google.js";
import { guessLocale, simplifyLocales, weakLocales } from "../utils/locale.js";
import { printProgress } from "../utils/progress.js";
import { delay } from "../utils/utils.js";

import type { DataEntryTranslated } from "../types/DataEntryTranslated.js";
import type { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";
import type { Entry } from "../types/Entry.js";

interface CompileOptions {
  letters?: boolean;
  uniques?: boolean;
  translate?: string;
  cookieId?: string;
  concurrences: number;
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

function getCommandsOrder(message: string) {
  return [...message.matchAll(/<(?<command>\d+)>/g)].map((match) =>
    Number(match.groups!["command"]),
  );
}

const smallFixes = [
  [", or ", " or "],
  [", and ", " and "],
] as const;

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

  if (options?.translate !== undefined) {
    for (const language of languagesDirectories) {
      if (guessLocale(language) === undefined) {
        fatal(`Invalid source language: ${options.translate}`);
      }
    }
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

  for (const [language, languageGuessed] of languages.entries()) {
    const entries = loadEntries(language);

    if (options?.translate === undefined) {
      rawEntries.set(
        languageGuessed,
        new Map<string, DataEntryTranslationPair>(
          entries.map((entry) => [getEntryKey(entry), [entry.source]]),
        ),
      );
    } else {
      process.stdout.write(
        `Translating from ${language} as ${languageGuessed}...\n\n`,
      );

      const cachedTranslationsPath = `./cached-translations.${languageGuessed}.json`;
      const cachedTranslations = new Map<string, string | null>(
        existsSync(cachedTranslationsPath)
          ? (JSON.parse(readFileSync(cachedTranslationsPath, "utf8")) as Array<
              [string, string]
            >)
          : [],
      );

      let translatedEntries = 0;

      let translatedLast: DataEntryTranslationProgress | undefined = undefined;
      let translatedLastProgress: DataEntryTranslationProgress | undefined =
        undefined;

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

      function saveCache() {
        process.stdout.write(chalk.greenBright("  CACHE SAVED\n\n"));

        writeFileSync(
          cachedTranslationsPath,
          JSON.stringify([...cachedTranslations.entries()], null, 2),
        );
      }

      const saveCacheInterval = setInterval(saveCache, 60_000);

      printProgress(0, entries.length);

      const queue = new PQueue({ concurrency: options.concurrences });

      for (const entry of entries) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        void queue.add(async () => {
          const commands = new Entries(
            engineDriverInstance
              .parse(entry.source)
              .entries.map((entryText) => {
                if (entryText instanceof EntryText) {
                  let { text } = entryText;

                  for (const [from, to] of smallFixes) {
                    text = text.replaceAll(from, to);
                  }

                  return new EntryText(text);
                }

                return entryText;
              }),
          );
          const commandsPreCompressed = commands.toCompressed();
          const commandsCompressed = commandsPreCompressed.toCompressed();
          const commandsText = commandsCompressed.toText();

          let entryTranslation: string | null = null;

          if (cachedTranslations.has(commandsText)) {
            entryTranslation = cachedTranslations.get(commandsText)!;
          } else {
            const commandsOrdering = getCommandsOrder(commandsText);

            retry: for (let retryIndex = 0; retryIndex < 3; retryIndex++) {
              for (const commandDriver of commandDrivers) {
                entryTranslation = null;

                if (commandDriver instanceof DropCommandDriver) {
                  break retry;
                }

                try {
                  // eslint-disable-next-line no-await-in-loop
                  entryTranslation = await translate(
                    languageGuessed,
                    options.translate!,
                    commandDriver.toTranslator(commandsText),
                    options.cookieId,
                  );
                } catch (err) {
                  if ((err as Error).message === "Too Many Requests") {
                    fatal(`Too many requests: requires --cookie-id`);
                  }

                  // eslint-disable-next-line no-await-in-loop
                  await delay(1000 * retryIndex);

                  continue retry;
                }

                if (
                  commandsOrdering.length > 0 &&
                  JSON.stringify(commandsOrdering) !==
                    JSON.stringify(
                      getCommandsOrder(
                        commandDriver.fromTranslator(entryTranslation),
                      ),
                    )
                ) {
                  if (weakLocales.includes(languageGuessed)) {
                    entryTranslation = null;

                    break retry;
                  }

                  continue;
                }

                entryTranslation =
                  commandDriver.fromTranslator(entryTranslation);

                if (entryTranslation.includes("><")) {
                  continue;
                }

                cachedTranslations.set(commandsText, entryTranslation);

                break retry;
              }
            }
          }

          translatedEntries++;

          entry.translation = commandsPreCompressed.fromCompressed(
            commandsCompressed.fromCompressed(
              entryTranslation ?? "",
              commandsPreCompressed,
            ),
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

      // eslint-disable-next-line no-await-in-loop
      await queue.onIdle();

      clearInterval(saveCacheInterval);
      saveCache();

      clearInterval(translationProgressInterval);
      printProgress(entries.length, entries.length);

      rawEntries.set(
        language,
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

  const publishables: Entry[] = [];

  const entries = loadEntries(languagesDirectories.at(0)!);

  const letters = new Set<number>();

  for (const entry of entries.values()) {
    const entryKey = getEntryKey(entry);

    const entrySources = new Map<string, string[]>();
    const entryTranslations = new Map<string, string[]>();

    for (const [language, languageGuessed] of languages.entries()) {
      const languageEntry = rawEntries.get(language);

      if (languageEntry?.has(entryKey) !== true) {
        continue;
      }

      const [source, translation] = languageEntry.get(entryKey)!;

      if (entrySources.has(source)) {
        entrySources.get(source)!.push(language);
      } else {
        entrySources.set(source, [language]);

        if (
          options?.letters === true &&
          !weakLocales.includes(languageGuessed)
        ) {
          const sourceCommands = engineDriverInstance
            .parse(source)
            .toCompressed()
            .toText();

          for (const letter of sourceCommands) {
            letters.add(letter.codePointAt(0)!);
          }
        }
      }

      if (options?.translate !== undefined) {
        if (entryTranslations.has(translation!)) {
          entryTranslations.get(translation!)!.push(language);
        } else {
          entryTranslations.set(translation!, [language]);

          if (options.letters === true) {
            const translationCommands = engineDriverInstance
              .parse(translation!)
              .toCompressed()
              .toText();

            for (const letter of translationCommands) {
              letters.add(letter.codePointAt(0)!);
            }
          }
        }
      }
    }

    const entryTranslationIndex = rawEntries
      .get(languagesDirectories.at(0)!)
      ?.get(entryKey)?.[2];

    const publishable: Entry = {
      // eslint-disable-next-line no-await-in-loop
      index: await secureHash(Buffer.from(entryKey)),
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

  if (options?.uniques === true) {
    const uniques = new Set<string>();

    for (const publishable of publishables) {
      for (const source of Object.values(publishable.sources!)) {
        uniques.add(source);
      }
    }

    writeFileSync("./uniques.json", JSON.stringify([...uniques], null, 2));
  }

  if (options?.letters === true) {
    writeFileSync(
      "./letters.txt",
      [...letters].sort((letterA, letterB) => letterA - letterB).join(","),
    );
  }

  writeFileSync("./publishable.json", JSON.stringify(publishables, null, 2));

  process.stdout.write("OK");
}
