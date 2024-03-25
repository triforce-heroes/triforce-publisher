export interface DataEntryPublishable {
    index: number;
    resource: string;
    reference: string;
    context?: string;
    sourceIndex?: string;
    translationIndex?: string;
    sources: Record<string, string>;
    translations?: Record<string, string>;
    same?: number;
    sameSources?: number;
}
