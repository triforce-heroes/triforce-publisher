import type { Publisher } from "./Publisher";
import type { PublisherEntry } from "../types/PublisherEntry";
export declare class PublisherResource {
    private readonly publisher;
    private readonly name;
    private readonly references;
    constructor(publisher: Publisher, name: string);
    addReference(language: string, reference: string, text: string): void;
    getEntries(): PublisherEntry[];
}
