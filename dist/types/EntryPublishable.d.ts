import { Entry } from "./Entry.js";
export interface EntryPublishable extends Entry {
    engine: string;
    same: number | null;
    sameSources: number | null;
}
