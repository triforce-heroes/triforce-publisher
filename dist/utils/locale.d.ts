export declare const supportedLocales: readonly ["en", "es", "fr", "it", "pt", "de", "nl", "ja", "ch", "ko", "ru"];
export type SupportedLocale = (typeof supportedLocales)[number];
export declare const supportedLocalesExtended: readonly ["en", "es", "fr", "it", "pt", "de", "nl", "ja", "ch", "ko", "ru", "en_us", "fr_us", "es_us", "zh", "zh_tw"];
export type SupportedLocaleExtended = (typeof supportedLocalesExtended)[number];
export declare const weakLocales: string[];
export declare const weakLocalesFull: string[];
export declare function guessLocale(language: string): "en" | "fr" | "es" | "de" | "it" | "nl" | "ch" | "ja" | "pt" | "ko" | "ru" | undefined;
export declare function simplifyLocales(locales: string[]): string[];
