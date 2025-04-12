import type { DataEntryRaw } from "../types/DataEntryRaw.js";
export declare abstract class Driver {
    readonly name: string;
    readonly pattern: string;
    constructor(name: string, pattern: string);
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string): Promise<DataEntryRaw[]>;
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
    abstract resourceEntries(path: string, resource: Buffer): DataEntryRaw[];
}
