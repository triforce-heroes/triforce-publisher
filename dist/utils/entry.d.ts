import type { DataEntry } from "../types/DataEntry.js";
export declare function getEntryKey(entry: Pick<DataEntry, "context" | "reference" | "resource">): string;
