import type { PublisherEntry } from "../types/PublisherEntry";
import type { PublisherOutput } from "../types/PublisherOutput";
export declare class Publisher {
    private readonly projectId;
    private readonly languages;
    private readonly references;
    constructor(projectId: number);
    addLanguage(name: string, canonical?: string): void;
    resolveLanguage(name: string): string;
    addReference(language: string, resource: string, reference: string, text: string): void;
    getEntries(): PublisherEntry[];
    dryRun(path: string): PublisherOutput;
    save(path: string): void;
}
