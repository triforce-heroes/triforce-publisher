import { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const MSBTDriver: {
    resourceEntries(resource: string): DataEntryRaw[];
    readonly name: string;
    readonly pattern: string;
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string, engineDriver: import("@triforce-heroes/triforce-commands").Driver): Promise<{
        sourceIndex: string;
        resource: string;
        reference: string;
        context?: string;
        source: string;
    }[]>;
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
};
