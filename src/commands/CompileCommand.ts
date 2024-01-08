import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { fatal } from "@triforce-heroes/triforce-core/Console";

import { DataEntryPublishable } from "../types/DataEntryPublishable.js";
import { DataEntryTranslated } from "../types/DataEntryTranslated.js";
import { getEntryKey } from "../utils/entry.js";
import { guessLocale, simplifyLocales } from "../utils/locale.js";

function loadEntries(language: string) {
  return JSON.parse(
    readFileSync(`./${language}/entries.json`, "utf8"),
  ) as DataEntryTranslated[];
}

type DataEntryTranslationPair = [source: string, translation: string];

function transformEntries(entries: DataEntryTranslated[]) {
  return new Map(
    entries.map((entry) => [
      getEntryKey(entry),
      [entry.source, entry.translation] as DataEntryTranslationPair,
    ]),
  );
}

function swapMap(map: Map<string, string[]>) {
  return Object.fromEntries(
    [...map.entries()].map(([key, value]) => [
      simplifyLocales(value).join(","),
      key,
    ]),
  );
}

export function CompileCommand(languagesInput: string) {
  const languagesDirectories = languagesInput.split(" ");

  if (languagesDirectories.length === 0) {
    fatal("No languages specified");
  }

  const languages = new Map<string, string>();

  for (const language of languagesDirectories) {
    const languageGuessed = guessLocale(language);

    if (languageGuessed === undefined) {
      fatal(`Unsupported language: ${language}`);
    }

    languages.set(language, languageGuessed);
  }

  const entries = new Map<string, Map<string, DataEntryTranslationPair>>();

  for (const [language, languageGuessed] of languages.entries()) {
    if (!existsSync(`./${language}/entries.json`)) {
      fatal(`No entries.json found in ${language}`);
    }

    entries.set(languageGuessed, transformEntries(loadEntries(language)));
  }

  process.stdout.write("Preparing publishables... ");

  const publishables: DataEntryPublishable[] = [];

  const languageEntries = loadEntries(languagesDirectories.at(0)!);

  const letters = new Set<string>();

  for (const [entryIndex, entry] of languageEntries.entries()) {
    const entryKey = getEntryKey(entry);

    const entrySources = new Map<string, string[]>();
    const entryTranslations = new Map<string, string[]>();

    for (const language of languages.values()) {
      const languageEntry = entries.get(language);

      if (languageEntry === undefined) {
        continue;
      }

      const [source, translation] = languageEntry.get(entryKey)!;

      if (entrySources.has(source)) {
        entrySources.get(source)!.push(language);
      } else {
        entrySources.set(source, [language]);
      }

      if (entryTranslations.has(translation)) {
        entryTranslations.get(translation)!.push(language);
      } else {
        entryTranslations.set(translation, [language]);
      }
    }

    const publishable: DataEntryPublishable = {
      index: entryIndex + 1,
      resource: entry.resource,
      reference: entry.reference,
      ...(entry.context !== undefined && {
        context: entry.context,
      }),
      sourceIndex: entry.sourceIndex,
      ...(entry.translationIndex !== undefined &&
        entry.translationIndex.length > 0 && {
          translationIndex: entry.translationIndex,
        }),
      sources: swapMap(entrySources),
      translations: swapMap(entryTranslations),
    };

    publishables.push(publishable);

    for (const source of Object.values(publishable.sources)) {
      for (const letter of source) {
        letters.add(letter);
      }
    }

    for (const translation of Object.values(publishable.translations)) {
      for (const letter of translation) {
        letters.add(letter);
      }
    }
  }

  writeFileSync("./publishable.json", JSON.stringify(publishables, null, 2));
  writeFileSync(
    "./letters.txt",
    [...letters]
      .map((s) => s.codePointAt(0)!)
      .sort((a, b) => a - b)
      .join(","),
  );

  process.stdout.write("OK");
}
