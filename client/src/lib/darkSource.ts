/**
 * The GitHub organisations that held our MCP server sources are unavailable (CSOAI-ORG flagged since
 * 2 Sep 2026). A link into them is a dead end for a reader, so pages show the source as not publicly
 * hosted instead of linking it. The registry data keeps the recorded URL unchanged.
 */
const DARK = /^https:\/\/github\.com\/(CSOAI-ORG|CouncilofAI-CSOAI)(\/|$)/i;

export const DARK_SOURCE_NOTE =
  "Source not publicly hosted at present: the GitHub organisation that held it is unavailable.";

/** The URL to link, or null when it points into an unavailable organisation. */
export function publicSourceUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return DARK.test(url) ? null : url;
}
