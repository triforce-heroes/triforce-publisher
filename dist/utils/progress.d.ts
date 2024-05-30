import { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";
export declare function printFailure(current: number, total: number, driver: string, input: string, output: string): void;
export declare function printProgress(current: number, total: number, lastCase?: DataEntryTranslationProgress): void;
