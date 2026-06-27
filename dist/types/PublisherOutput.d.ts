import type { PublisherEntry } from "./PublisherEntry";
export interface PublisherOutput {
    entries: PublisherEntry[];
    letters: Set<number>;
    uniques: Set<string>;
    version: {
        needed: boolean;
        sql: string | null;
        json: Record<string, Record<string, string>> | null;
        hashes: Record<string, Record<string, string>>;
    };
}
