//#region src/types/PublisherEntry.d.ts
interface PublisherEntry {
  resource: string;
  reference: string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}
//#endregion
//#region src/types/PublisherOutput.d.ts
interface PublisherOutput {
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
//#endregion
//#region src/features/Publisher.d.ts
export declare class Publisher {
  private readonly projectId;
  private readonly languages;
  private readonly references;
  private readonly metadatas;
  constructor(projectId: number);
  addLanguage(name: string, canonical?: string): void;
  resolveLanguage(name: string): string;
  addReference(language: string, resource: string, reference: string, text: string, metadata?: Record<string, unknown>): void;
  getEntries(): PublisherEntry[];
  dryRun(path: string): Promise<PublisherOutput>;
  save(path: string): Promise<void>;
}
//#endregion
//#region src/QueryGenerator.d.ts
interface GeneratorEntry {
  resource?: string;
  reference: number | string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}
export declare function queryGenerator(projectId: number, entries: GeneratorEntry[], updatedAt?: number): string | null;
//#endregion