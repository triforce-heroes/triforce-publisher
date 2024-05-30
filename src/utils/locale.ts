export const supportedLocales = [
  "en",
  "es",
  "fr",
  "it",
  "de",
  "nl",
  "ja",
  "zh",
  "ko",
];

export const weakLocales = ["jp", "ch", "kr"];
export const weakLocalesFull = [...weakLocales, "fr", "it", "de", "nl"];

const guessableLocales: Array<
  [(typeof supportedLocales)[number], ...string[]]
> = [
  ["en", "en_us", "USen", "EUen"],
  ["es", "es_us", "USes", "EUes"],
  ["fr", "fr_us", "USfr", "EUfr"],
  ["it", "EUit"],
  ["de", "EUde"],
  ["nl", "EUnl"],
  ["ja", "jp", "JPja"],
  ["zh", "ch", "ch_tw", "ch_zh", "CNzh", "TWzh", "CNzh"],
  ["ko", "kr", "KRko"],
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
