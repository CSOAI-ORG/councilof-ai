import { describe, expect, it } from "vitest";
import { badgeSnippet, cardSnippet, CARD_EMBED_HEIGHT, CARD_EMBED_WIDTH } from "./embedSnippet";

describe("glass embed snippets", () => {
  it("pastes a compact card iframe that still points at the same verify widget", () => {
    const s = cardSnippet("/signals/cross-border-card.signed.json");
    expect(s).toContain("/embed/verify?card=/signals/cross-border-card.signed.json");
    expect(s).toContain(`width="${CARD_EMBED_WIDTH}"`);
    expect(s).toContain(`height="${CARD_EMBED_HEIGHT}"`);
    expect(s.length).toBeLessThan(280);
    expect(s).not.toMatch(/VRO|Emilia|XLS-70|OpenTimestamp/);
  });

  it("pastes a one-line badge at /api/badge", () => {
    expect(badgeSnippet("governance")).toContain("/api/badge?axis=governance");
    expect(badgeSnippet()).toContain("/api/badge");
    expect(badgeSnippet("governance").length).toBeLessThan(200);
  });
});
