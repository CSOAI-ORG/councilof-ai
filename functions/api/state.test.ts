import { describe, expect, it } from "vitest";

import { onRequestGet } from "./state";

describe("GET /api/state corpus truth", () => {
  it("derives and separates public-root leaves from signed-card index entries", async () => {
    const response = await (onRequestGet as unknown as () => Promise<Response>)();
    const body = await response.json();
    expect(body.public_root.corpus_relation).toEqual({
      relationship: "SEPARATE_CORPORA",
      public_root_leaves: 154,
      separately_indexed_signed_cards: 335,
      identifier_overlap: 0,
      ots_covers: "PUBLIC_ROOT_BYTES_ONLY",
    });
    expect(body.signed_cards.corpus_relation.ots_scope).toContain("does not anchor");
  });
});
