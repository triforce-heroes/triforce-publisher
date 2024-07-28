import { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const BMGDriver: {
    resourceEntries(resource: string): DataEntryRaw[];
    readonly name: string;
    readonly pattern: string;
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string, engineDriver: import("@triforce-heroes/triforce-commands").Driver): Promise<{
        sourceIndex: string;
        resource: string;
        reference: string;
        context?: string | undefined;
        source: string;
    }[]>;
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
};
