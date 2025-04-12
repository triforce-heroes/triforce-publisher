import type { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const PKLADriver: {
    resourceEntries(path: string, resource: Buffer): DataEntryRaw[];
    readonly name: string;
    readonly pattern: string;
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string): Promise<DataEntryRaw[]>;
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
};
