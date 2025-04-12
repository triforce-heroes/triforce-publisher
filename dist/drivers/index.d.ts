import type { Driver } from "./Driver.js";
import type { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
export declare const supportedSourceDrivers: {
    bmg: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    koei: {
        validate(resource: Buffer): boolean;
        resourceEntries(path: string, resource: Buffer): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
        readonly name: string;
        readonly pattern: string;
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    lbrs: {
        resourceEntries(_path: string, resource: Buffer): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): {
            [k: string]: {
                resource: string;
                reference: string;
                source: string;
            }[];
        };
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    msbt: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    nloc: {
        resourceEntries(resource: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): {
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
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    pkla: {
        resourceEntries(path: string, resource: Buffer): import("../types/DataEntryRaw.js").DataEntryRaw[];
        readonly name: string;
        readonly pattern: string;
        validate(_resource: Buffer): boolean;
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): Record<string, import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
    udk: {
        resourceEntries(path: string): import("../types/DataEntryRaw.js").DataEntryRaw[];
        reassignLocales(entries: import("../types/DataEntryRaw.js").DataEntryRaw[]): {
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
        entries(filesMatcher: string): Promise<import("../types/DataEntryRaw.js").DataEntryRaw[]>;
    };
};
export declare function loadSourceDriver(name: string): Driver | undefined;
export declare function loadEngineDriver(name: string): CommandsDriver | undefined;
