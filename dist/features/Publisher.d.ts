import type { PublisherOutput } from "../types/PublisherOutput";
import { PublisherResource } from "./PublisherResource";
export declare class Publisher {
    private readonly projectId;
    private readonly languages;
    private readonly resources;
    constructor(projectId: number);
    addLanguage(name: string, canonical?: string): void;
    createResource(name: string): PublisherResource;
    resolveLanguage(name: string): string;
    dryRun(path: string): PublisherOutput;
    save(path: string): void;
}
