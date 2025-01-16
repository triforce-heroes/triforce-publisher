import { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const UDKDriver: {
    resourceEntries(path: string): DataEntryRaw[];
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
    entries(filesMatcher: string, engineDriver: import("@triforce-heroes/triforce-commands").Driver): Promise<{
        sourceIndex: string;
        resource: string;
        reference: string;
        context?: string | undefined;
        source: string;
    }[]>;
};
