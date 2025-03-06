import type { DataEntryRaw } from "../types/DataEntryRaw.js";
import type { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
export declare abstract class Driver {
    readonly name: string;
    readonly pattern: string;
    constructor(name: string, pattern: string);
    validate(_resource: Buffer): boolean;
    entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
        sourceIndex: string;
        resource: string;
        reference: string;
        context?: string | undefined;
        source: string;
    }[]>;
    reassignLocales(entries: DataEntryRaw[]): Record<string, DataEntryRaw[]>;
    abstract resourceEntries(path: string, resource: Buffer): DataEntryRaw[];
}
