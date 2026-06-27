import type { Publisher } from "#/features/Publisher";
import type { PublisherEntry } from "#/types/PublisherEntry";

export class PublisherResource {
  private readonly references = new Map<string, Map<string, Set<string>>>();

  public constructor(
    private readonly publisher: Publisher,
    private readonly name: string,
  ) {}

  public addReference(language: string, reference: string, text: string): void {
    const resolvedLanguage = this.publisher.resolveLanguage(language);

    if (!this.references.has(reference)) {
      this.references.set(reference, new Map());
    }

    const entry = this.references.get(reference)!;

    if (!entry.has(text)) {
      entry.set(text, new Set());
    }

    const languages = entry.get(text)!;

    if (languages.has(resolvedLanguage)) {
      throw new Error(
        `duplicate reference: language "${language}" already has text "${text}" for reference "${reference}"`,
      );
    }

    languages.add(resolvedLanguage);
  }

  public getEntries(): PublisherEntry[] {
    return [...this.references.entries()].map(([reference, sources]) => ({
      resource: this.name,
      reference,
      sources: Object.fromEntries(
        [...sources.entries()].map(([text, languages]) => [text, [...languages]]),
      ),
    }));
  }
}
