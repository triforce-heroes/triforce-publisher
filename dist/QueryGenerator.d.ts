export interface GeneratorEntry {
    resource?: string;
    reference: number | string;
    sources: Record<string, string[]>;
}
export declare function queryGenerator(projectId: number, entries: GeneratorEntry[], updatedAt?: number): string | null;
