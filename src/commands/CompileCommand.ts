import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";
import { secureHash } from "@triforce-heroes/triforce-core/Hash";
import {
  supportedLanguages,
  translate,
} from "@triforce-heroes/triforce-core/Translator";
import chalk from "chalk";
import PQueue from "p-queue";

import { loadEngineDriver } from "../drivers/index.js";
import { DataEntryPublishable } from "../types/DataEntryPublishable.js";
import { DataEntryTranslated } from "../types/DataEntryTranslated.js";
import { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";
import { getEntryKey } from "../utils/entry.js";
import { translationService } from "../utils/libre.js";
import { guessLocale, simplifyLocales } from "../utils/locale.js";
import { printProgress } from "../utils/progress.js";

interface CompileOptions {
  letters?: boolean;
  uniques?: boolean;
  translate?: string;
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

class CommandDriver {
  public constructor(
    public toTranslator: (message: string) => string,
    public fromTranslator: (message: string) => string,
  ) {}
}

class DropCommandDriver extends CommandDriver {
  public constructor() {
    super(
      (m) => toReplaceCommands(m, () => " ").trim(),
      (m) => m,
    );
  }
}

function toReplaceCommands(
  message: string,
  pattern: (index: number) => string,
) {
  return message.replaceAll(/<(\d+)>/g, (_, match: string) =>
    pattern(Number(match)),
  );
}

function fromReplaceCommands(_: string, match: string) {
  return `<${match}>`;
}

const commandDrivers: CommandDriver[] = [
  new CommandDriver(
    (m) => toReplaceCommands(m, (index) => ` <${String(index)}> `),
    (m) => m.replaceAll(/\s*<\s*(\d+)\s*>\s*/g, fromReplaceCommands),
  ),
  new CommandDriver(
    (m) => toReplaceCommands(m, (index) => ` (${String(index)}%) `),
    (m) => m.replaceAll(/\s*\(\s*(\d+)\s*%\s*\)\s*/g, fromReplaceCommands),
  ),
  new CommandDriver(
    (m) => toReplaceCommands(m, (index) => ` <<${String(index)}>> `),
    (m) => m.replaceAll(/\s*<\s*<\s*(\d+)\s*>\s*>\s*/g, fromReplaceCommands),
  ),
  new DropCommandDriver(),
];

function getCommandsOrder(message: string) {
  return [...message.matchAll(/<(\d+)>/g)].map((match) => Number(match[1]));
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

  let translatorPort: number;

  if (options?.translate !== undefined) {
    process.stdout.write(`Initializing translation service on port... `);

    const languagesGuessed = new Set<string>();

    for await (const languageGuessed of languages.values()) {
      languagesGuessed.add(languageGuessed);
    }

    translatorPort = await translationService(
      [...languagesGuessed],
      options.translate,
    );

    process.stdout.write(`${String(translatorPort)}\n`);
  }

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

      const cachedTranslationsPath = `./cached-translations.${languageGuessed}.json`;
      const cachedTranslations = new Map<string, string | null>(
        existsSync(cachedTranslationsPath)
          ? (JSON.parse(readFileSync(cachedTranslationsPath, "utf8")) as Array<
              [string, string]
            >)
          : [],
      );

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

      // eslint-disable-next-line no-inner-declarations
      function saveCache() {
        process.stdout.write(chalk.greenBright("  CACHE SAVED\n\n"));

        writeFileSync(
          cachedTranslationsPath,
          JSON.stringify([...cachedTranslations.entries()], null, 2),
        );
      }

      const saveCacheInterval = setInterval(saveCache, 60_000);

      printProgress(0, entries.length);

      const queue = new PQueue({ concurrency: 1 });

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
            const commandsOrdering = getCommandsOrder(commandsText);

            for (const commandDriver of commandDrivers) {
              try {
                entryTranslation = await translate(
                  `http://127.0.0.1:${String(translatorPort)}`,
                  languageGuessed,
                  options.translate!,
                  commandDriver.toTranslator(commandsText),
                );

                if (entryTranslation === null) {
                  continue;
                }

                if (commandsOrdering.length > 0) {
                  if (
                    JSON.stringify(commandsOrdering) !==
                    JSON.stringify(getCommandsOrder(entryTranslation))
                  ) {
                    continue;
                  }

                  entryTranslation =
                    commandDriver instanceof DropCommandDriver
                      ? commandsText
                      : commandDriver.fromTranslator(entryTranslation);
                }

                cachedTranslations.set(commandsText, entryTranslation);
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

      clearInterval(saveCacheInterval);
      saveCache();

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

  for await (const entry of entries.values()) {
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
