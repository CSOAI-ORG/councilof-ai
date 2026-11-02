/** Types for the shared dependency-free JS contract. Validation returns its original input or throws. */
export const STATUSES: readonly ["draft", "adopted", "review", "last-call", "published", "withdrawn", "superseded"];
export function validateCatalog<T>(catalog: T): T;
type SearchDocument = { id: string; title: string; summary: string; groupId: string; status: string };
type SearchCatalog = { groups: Array<{ id: string; axes?: string[] }>; documents: SearchDocument[] };
export function selectDocuments<T extends SearchCatalog>(
  catalog: T,
  filters?: { query?: string; group?: string; status?: string },
): Array<T["documents"][number]>;
type SourceDocument = { source: { commit: string; path: string } };
export function sourceUrl(doc: SourceDocument): string;
type ReviewDocument = SourceDocument & {
  id: string; title: string; groupId: string; version: number; discussionUrl: string | null;
};
export function reviewDraft(
  catalog: { documents: ReviewDocument[]; forum: string },
  documentId: string,
  fields?: { observation?: string; conflicts?: string },
): string;
