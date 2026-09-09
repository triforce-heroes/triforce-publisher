export interface PublisherEntry {
  resource: string;
  reference: string;
  sources: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}
