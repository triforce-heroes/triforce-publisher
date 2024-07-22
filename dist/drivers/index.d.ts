import { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
import { Driver } from "./Driver.js";
export declare const supportedSourceDrivers: {
    bmg: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
            sourceIndex: string;
            resource: string;
            reference: string;
            context?: string;
            source: string;
        }[]>;
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    msbt: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
            sourceIndex: string;
            resource: string;
            reference: string;
            context?: string;
            source: string;
        }[]>;
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    koei: {
        validate(resource: Buffer): boolean;
        resourceEntries(path: string, resource: Buffer): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
        readonly name: string;
        readonly pattern: string;
        entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
            sourceIndex: string;
            resource: string;
            reference: string;
            context?: string;
            source: string;
        }[]>;
    };
    nloc: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): {
            [k: string]: {
                resource: string;
                reference: string;
                context?: string;
                source: string;
            }[];
        };
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
            sourceIndex: string;
            resource: string;
            reference: string;
            context?: string;
            source: string;
        }[]>;
    };
};
export declare function loadSourceDriver(name: string): Driver | undefined;
export declare function loadEngineDriver(name: string): CommandsDriver | undefined;
