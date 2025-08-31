const guessableLocales: Array<[SupportedLocale, ...string[]]> = [
  [
    "en",
    "en_us",
    "en_eu",
    "en-EU",
    "USen",
    "EUen",
    "english",
    "ukenglish",
    "Msgus",
    "Msguk",
  ],
  [
    "es",
    "es_us",
    "es_eu",
    "es-EU",
    "USes",
    "EUes",
    "spanish",
    "naspanish",
    "Msgsp",
    "Msgussp",
  ],
  [
    "fr",
    "fr_us",
    "fr_eu",
    "fr-EU",
    "USfr",
    "EUfr",
    "french",
    "nafrench",
    "Msgfr",
    "Msgusfr",
  ],
  ["it", "EUit", "italian", "Msgit"],
  ["pt", "pt_pt", "pt_br", "pt-BR", "EUpt", "portuguese"],
  ["de", "EUde", "german", "Msgde"],
  ["nl", "EUnl", "dutch"],
  ["ja", "jp", "JPja", "ja_Kanji", "japanese"],
  [
    "ch",
    "ch_tw",
    "ch_TW",
    "ch_zh",
    "ch_ZH",
    "zh",
    "zh_tw",
    "tw",
    "CNzh",
    "TWzh",
    "CNzh",
    "cntraditional",
    "cnsimplified",
  ],
  ["ko", "kr", "KRko", "KOkr", "korean"],
  ["ru", "EUru", "russian"],
];

export const supportedLocales = [
  "en",
  "es",
  "fr",
  "it",
  "pt",
  "de",
  "nl",
  "ja",
  "ch",
  "ko",
  "ru",
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const supportedLocalesExtended = [
  ...supportedLocales,

  "en-EU",
  "fr-EU",
  "es-EU",

  "zh",
  "zh_tw",
] as const;

export type SupportedLocaleExtended = (typeof supportedLocalesExtended)[number];

export const weakLocales = ["ja", "zh", "ko"];
export const weakLocalesFull = [
  ...weakLocales,
  "fr",
  "fr-EU",
  "it",
  "de",
  "nl",
  "ru",
];

export function guessLocale(language: string) {
  return guessableLocales.find(
    (locale) => locale.find((name) => name === language) !== undefined,
  )?.[0];
}

export function simplifyLocales(locales: string[]) {
  const result = new Set<string>();

  for (const locale of locales) {
    if (locale.endsWith("-EU")) {
      const [baseLocale] = locale.split("-", 2) as [string];

      if (!locales.includes(baseLocale)) {
        result.add(locale);
      }
    } else {
      result.add(locale);
    }
  }

  return [...result];
}
