export interface GeneratorEntry {
    resource?: string;
    reference: number | string;
    sources: Record<string, string[]>;
}
export declare function generateQuery(projectId: number, entries: GeneratorEntry[], updatedAt?: number): string | null;
