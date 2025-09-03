export class DraftRegistry {
  private supportedDrafts: Set<string>;

  constructor(supportedDrafts?: string[]) {
    this.supportedDrafts = new Set(
      supportedDrafts || [
        'https://json-schema.org/draft/2020-12/schema',
        'https://json-schema.org/draft/2019-09/schema',
      ],
    );
  }

  addDraft(draftVersion: string): void {
    this.supportedDrafts.add(draftVersion);
  }

  isSupportedDraft(draftVersion?: string): boolean {
    if (!draftVersion) return false;

    return Array.from(this.supportedDrafts).some((supportedDraft) =>
      draftVersion.startsWith(supportedDraft),
    );
  }

  getSupportedDrafts(): string[] {
    return Array.from(this.supportedDrafts);
  }
}
