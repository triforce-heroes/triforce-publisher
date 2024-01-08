import { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
import { Driver } from "./Driver.js";
export declare const supportedSourceDrivers: {
    msbt: {
        resourceEntries(resource: string): Omit<import("../types/DataEntry.js").DataEntry, "sourceIndex">[];
        readonly name: string;
        readonly pattern: string;
        entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
            sourceIndex: string;
            context?: string | undefined;
            reference: string;
            resource: string;
            source: string;
        }[]>;
    };
};
export declare function loadSourceDriver(name: string): Driver | undefined;
export declare function loadEngineDriver(name: string): CommandsDriver | undefined;
