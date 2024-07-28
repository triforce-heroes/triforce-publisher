import { EntryPublishable } from "../types/EntryPublishable.js";
export declare function getEntries(engine: string, testRun: boolean): Promise<{
    sources: Record<string, string>;
    translations: Record<string, string>;
    index: number;
    sourceIndex: string | null;
    translationIndex: string | null;
    same: number | null;
    sameSources: number | null;
}[]>;
export declare function updateEntries(engine: string, entries: EntryPublishable[]): Promise<import("@libsql/client").ResultSet[]>;
