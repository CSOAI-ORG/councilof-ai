/**
 * The Services section must show every door the rail publishes — no more, and crucially no
 * fewer. A door that the grouping does not recognise would silently never render, and nobody
 * would notice until a buyer asked why a paid endpoint is not listed.
 *
 * So the load-bearing assertion is `ungrouped` being empty against the REAL manifest, captured
 * verbatim in __fixtures__/x402-manifest-2026-09-06.json (9 resources, mode "live").
 */
import { describe, expect, it } from "vitest";
import manifest from "./__fixtures__/x402-manifest-2026-09-06.json";
import {
  GROUPS,
  buildCatalogue,
  groupFor,
  pathOf,
  toCard,
  type ManifestResource,
} from "./servicesCatalogue";

describe("every published door is grouped", () => {
  it("leaves nothing ungrouped", () => {
    const c = buildCatalogue(manifest);
    // if this fails it names the door that would have vanished from the page
    expect(c.ungrouped).toEqual([]);
  });

  it("renders exactly the doors the manifest publishes — 9, not a typed list", () => {
    const c = buildCatalogue(manifest);
    const rendered = c.groups.flatMap((g) => g.cards).length;
    expect(c.total).toBe(9);
    expect(rendered).toBe(9);
  });

  it("fails loudly when the rail adds a door the mapping does not know", () => {
    const withNew = {
      ...(manifest as object),
      resources: [
        ...(manifest as { resources: ManifestResource[] }).resources,
        { method: "GET", url: "https://councilof.ai/api/brand-new-door", paid_for: "assembly" },
      ],
    };
    const c = buildCatalogue(withNew);
    expect(c.ungrouped).toEqual(["/api/brand-new-door"]);
    // and it is NOT quietly rendered anywhere
    expect(c.groups.flatMap((g) => g.cards).map((x) => x.path)).not.toContain("/api/brand-new-door");
  });

  it("keeps all five groups even when one has no door yet", () => {
    const c = buildCatalogue(manifest);
    expect(c.groups.map((g) => g.group.id)).toEqual(GROUPS.map((g) => g.id));
    // Legacy systems has no door in the current manifest. An empty group renders empty; it is
    // never padded, and never hidden to make the section look fuller.
    const legacy = c.groups.find((g) => g.group.id === "legacy-systems");
    expect(legacy?.cards).toEqual([]);
  });
});

describe("card content comes from the manifest", () => {
  const cards = buildCatalogue(manifest).groups.flatMap((g) => g.cards);

  it("marks free-door free because the MANIFEST says amount 0, not because we decided", () => {
    const free = cards.find((c) => c.path === "/api/free-door");
    expect(free?.freeForever).toBe(true);
    expect(free?.payLine).toMatch(/settles and charges nothing/i);
  });

  it("gives every paid door the pay-as-you-go line and no price", () => {
    for (const c of cards.filter((c) => !c.freeForever)) {
      expect(c.payLine).toBe("Pay-as-you-go x402 at the 402.");
      expect(c.payLine).not.toMatch(/\$|USD|\bprice\b|tier/i);
      expect(c.measures).not.toMatch(/\$\d/);
    }
  });

  it("carries the free preview only where the manifest publishes one", () => {
    const withPreview = cards.filter((c) => c.freePreview).map((c) => c.path).sort();
    expect(withPreview).toEqual([
      "/api/art50/marking-evidence",
      "/api/receipts/batch",
      "/api/rwa/evidence",
    ]);
    // the others genuinely have none — null, never an invented link
    expect(cards.find((c) => c.path === "/api/proof")?.freePreview).toBeNull();
  });

  it("says what a door measures using the manifest's own words", () => {
    const attest = cards.find((c) => c.path === "/api/request-attestation");
    expect(attest?.measures).toBe("Paid for issuance.");
  });
});

describe("grouping", () => {
  it("puts each door where a reader would look for it", () => {
    expect(groupFor("https://councilof.ai/api/rwa/evidence?asset=X")).toBe("finance-rwa");
    expect(groupFor("https://councilof.ai/api/evidence-bundle?obligation=dora")).toBe("compliance");
    expect(groupFor("https://councilof.ai/api/art50/marking-evidence?url=x")).toBe("compliance");
    expect(groupFor("https://councilof.ai/api/request-attestation?subject=x")).toBe("model-measurement");
    expect(groupFor("https://councilof.ai/api/receipts/batch?from=a")).toBe("agent-rails");
    expect(groupFor("https://councilof.ai/api/free-door")).toBe("agent-rails");
  });

  it("returns null rather than guessing a group", () => {
    expect(groupFor("https://councilof.ai/api/unknown")).toBeNull();
  });

  it("reads a path even from a malformed url", () => {
    expect(pathOf("https://councilof.ai/api/proof?bundle=1")).toBe("/api/proof");
    expect(pathOf("/api/proof?bundle=1")).toBe("/api/proof");
  });
});

describe("the section names its source", () => {
  it("cites the manifest and its mode", () => {
    const c = buildCatalogue(manifest);
    expect(c.source).toBe("/.well-known/x402.json");
    expect(c.mode).toBe("live");
  });

  it("renders nothing rather than inventing doors when the manifest is unreachable", () => {
    const c = buildCatalogue(null);
    expect(c.total).toBe(0);
    expect(c.groups.flatMap((g) => g.cards)).toEqual([]);
    expect(c.mode).toBeNull();
  });

  it("never claims a door is free unless the manifest said so", () => {
    const card = toCard({ url: "https://councilof.ai/api/x", paid_for: "assembly" }, "agent-rails");
    expect(card.freeForever).toBe(false);
  });
});
