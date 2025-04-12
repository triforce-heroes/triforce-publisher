import type { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const KOEIDriver: {
    validate(resource: Buffer): boolean;
    resourceEntries(path: string, resource: Buffer): DataEntryRaw[];
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
    readonly name: string;
    readonly pattern: string;
    entries(filesMatcher: string): Promise<DataEntryRaw[]>;
};
