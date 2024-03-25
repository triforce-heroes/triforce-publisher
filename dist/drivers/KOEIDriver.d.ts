/// <reference types="node" resolution-mode="require"/>
import { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare const KOEIDriver: {
    validate(resource: Buffer): boolean;
    resourceEntries(path: string, resource: Buffer): DataEntryRaw[];
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
    readonly name: string;
    readonly pattern: string;
    entries(filesMatcher: string, engineDriver: import("@triforce-heroes/triforce-commands").Driver): Promise<{
        sourceIndex: string;
        resource: string;
        reference: string;
        context?: string | undefined;
        source: string;
    }[]>;
};
