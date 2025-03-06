import type { DataEntry } from "./DataEntry.js";

export type DataEntryRaw = Omit<DataEntry, "sourceIndex">;
