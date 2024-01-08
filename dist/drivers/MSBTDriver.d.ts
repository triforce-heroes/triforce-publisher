import { DataEntry } from "../types/DataEntry.js";
export declare const MSBTDriver: {
    resourceEntries(resource: string): Array<Omit<DataEntry, "sourceIndex">>;
    readonly name: string;
    readonly pattern: string;
    entries(filesMatcher: string, engineDriver: import("@triforce-heroes/triforce-commands").Driver): Promise<{
        sourceIndex: string;
        context?: string | undefined;
        reference: string;
        resource: string;
        source: string;
    }[]>;
};
