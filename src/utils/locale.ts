const guessableLocales: Array<[SupportedLocale, ...string[]]> = [
  ["en", "en_us", "USen", "EUen", "english", "ukenglish", "Msgus", "Msguk"],
  ["es", "es_us", "USes", "EUes", "spanish", "naspanish", "Msgsp", "Msgussp"],
  ["fr", "fr_us", "USfr", "EUfr", "french", "nafrench", "Msgfr", "Msgusfr"],
  ["it", "EUit", "italian", "Msgit"],
  ["pt", "pt_pt", "pt_br", "EUpt", "portuguese"],
  ["de", "EUde", "german", "Msgde"],
  ["nl", "EUnl", "dutch"],
  ["ja", "jp", "JPja", "japanese"],
  [
    "zh",
    "ch",
    "ch_tw",
    "ch_zh",
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
  "zh",
  "ko",
  "ru",
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const supportedLocalesExtended = [
  ...supportedLocales,

  "en_us",
  "fr_us",
  "es_us",

  "zh_tw",
] as const;

export type SupportedLocaleExtended = (typeof supportedLocalesExtended)[number];

export const weakLocales = ["ja", "zh", "ko"];
export const weakLocalesFull = [
  ...weakLocales,
  "fr",
  "fr_us",
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
    if (locale.endsWith("_us")) {
      const [baseLocale] = locale.split("_", 2) as [string];

      if (!locales.includes(baseLocale)) {
        result.add(locale);
      }
    } else {
      result.add(locale);
    }
  }

  return [...result];
}
