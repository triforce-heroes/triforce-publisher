import type { DataEntry } from "./DataEntry.js";
export interface DataEntryTranslated extends DataEntry {
    translation?: string;
    translationIndex?: string;
}
