/**
 * Which published card the verifier's "Try a published card" loads.
 *
 * Measured on 17 Nov 2026: a uniform pick from /signed/chain.json landed on one of our own overlay
 * models (sov*, clan*) in 37 of 45 draws, so a stranger's first verified record was usually one of
 * ours; the first seen that day was sov-compliance-art5:latest at 4.2%. /signed/card-matrix.json
 * already labels every model own, own_unconfirmed or third_party (scripts/build-own-model-disclosure.mjs),
 * so the example is drawn from third-party cells. Any card verifies the same way: this only chooses
 * what a first-time reader sees, and an empty or unreadable matrix leaves the old pick in place.
 *
 * A cell at exactly 0 is skipped while a non-zero third-party cell exists. The matrix leaves
 * floor-level zeros out of its quotable figures, and a first example should be a quotable record.
 */
export type ExampleCell = { id: string; url: string; model: string };

/** The same rule the example loader applies (lib/publicCardExample). */
const SIGNED_CARD_URL = /^\/signed\/cards\/[0-9a-f]{64}\.json$/;

type MatrixModel = { id?: unknown; kind?: unknown };
type MatrixCell = { model?: unknown; card?: unknown; card_url?: unknown; signed?: unknown; accuracy?: unknown };

export function thirdPartyExampleCells(matrix: unknown): ExampleCell[] {
  if (!matrix || typeof matrix !== "object") return [];
  const { models, cells } = matrix as { models?: unknown; cells?: unknown };
  if (!Array.isArray(models) || !Array.isArray(cells)) return [];
  const thirdParty = new Set(
    (models as MatrixModel[])
      .filter((m) => m && m.kind === "third_party" && typeof m.id === "string")
      .map((m) => m.id as string),
  );
  const usable = (cells as MatrixCell[]).filter(
    (c) =>
      Boolean(c) &&
      c.signed === true &&
      typeof c.model === "string" &&
      thirdParty.has(c.model) &&
      typeof c.card_url === "string" &&
      SIGNED_CARD_URL.test(c.card_url),
  );
  const nonZero = usable.filter((c) => typeof c.accuracy === "number" && c.accuracy > 0);
  return (nonZero.length ? nonZero : usable).map((c) => ({
    id: typeof c.card === "string" && c.card ? c.card : String(c.card_url),
    url: c.card_url as string,
    model: c.model as string,
  }));
}
