import { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";
import { DataEntry } from "../types/DataEntry.js";
export declare abstract class Driver {
    readonly name: string;
    readonly pattern: string;
    constructor(name: string, pattern: string);
    entries(filesMatcher: string, engineDriver: CommandsDriver): Promise<{
        sourceIndex: string;
        context?: string | undefined;
        reference: string;
        resource: string;
        source: string;
    }[]>;
    abstract resourceEntries(resource: string): Array<Omit<DataEntry, "sourceIndex">>;
}
