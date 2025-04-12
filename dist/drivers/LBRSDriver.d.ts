import type { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const LBRSDriver: {
    resourceEntries(_path: string, resource: Buffer): DataEntryRaw[];
    reassignLocales(entries: DataEntryRaw[]): {
        [k: string]: {
            resource: string;
            reference: string;
            source: string;
        }[];
    };
    readonly name: string;
    readonly pattern: string;
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string): Promise<DataEntryRaw[]>;
};
