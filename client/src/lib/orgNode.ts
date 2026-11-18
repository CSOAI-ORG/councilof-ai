/**
 * The estate's canonical publisher node — the Organization declared in client/index.html,
 * referenced by the same @id so every JSON-LD node on the site names ONE organisation.
 *
 * Kept in its own module so a global component (PageSchema) can name the publisher without
 * pulling the axis registry that datasetSchema.ts imports into the main bundle.
 */
export const COUNCIL_ORG = {
  "@type": "Organization",
  "@id": "https://councilof.ai/#org",
  name: "Council of AI",
  legalName: "CSOAI LTD",
  url: "https://councilof.ai/",
  identifier: "UK Companies House 16939677",
} as const;
