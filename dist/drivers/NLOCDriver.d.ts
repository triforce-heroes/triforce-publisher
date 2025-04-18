import type { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const NLOCDriver: {
    resourceEntries(resource: string): DataEntryRaw[];
    reassignLocales(entries: DataEntryRaw[]): {
        [k: string]: {
            resource: string;
            reference: string;
            context?: string | undefined;
            source: string;
        }[];
    };
    readonly name: string;
    readonly pattern: string;
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string): Promise<DataEntryRaw[]>;
};
