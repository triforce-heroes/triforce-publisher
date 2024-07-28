export interface Entry {
  index: number;
  resource: string;
  reference: string;
  context?: string;
  sources?: Record<string, string>;
  translations?: Record<string, string>;
  sourceIndex?: string | null;
  translationIndex?: string | null;
}
