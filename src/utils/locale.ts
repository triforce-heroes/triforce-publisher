export const supportedLocales = [
  "en_us",
  "es_us",
  "fr_us",

  "en",
  "es",
  "fr",
  "it",
  "de",
  "nl",

  "jp",

  "ch",
  "ch_tw",
  "kr",
];

const guessableLocales: Array<
  [(typeof supportedLocales)[number], ...string[]]
> = [
  ["en_us", "USen"],
  ["es_us", "USes"],
  ["fr_us", "USfr"],

  ["en", "EUen"],
  ["es", "EUes"],
  ["fr", "EUfr"],
  ["it", "EUit"],
  ["de", "EUde"],
  ["nl", "EUnl"],

  ["jp", "JPja"],

  ["ch", "CNzh"],
  ["ch_tw", "TWzh"],
  ["kr", "KRko"],
];

export function guessLocale(language: string) {
  return guessableLocales.find((locale) =>
    locale.find((name) => name === language),
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
