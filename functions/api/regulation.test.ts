import { describe, expect, it } from "vitest";
import { REGULATION_FEED, onRequestGet } from "./regulation";

describe("GET /api/regulation", () => {
  it("serves the bounded cited deadline register and no generic write surface", async () => {
    const response = await onRequestGet({ env: {} } as never);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.schema).toBe("csoai.regulation-deadlines/0.1");
    expect(body.scope_note).toContain("not a determination");
    expect(body.deadlines).toHaveLength(22);
    expect(body).not.toHaveProperty("received");
    expect(body).not.toHaveProperty("signature");
    expect(REGULATION_FEED.deadlines.every((item) => item.basis)).toBe(true);
  });

  it("surfaces a configured-but-invalid signing key without a fake signature", async () => {
    const response = await onRequestGet({
      env: { BOARD_SIGN_KEY_PKCS8_B64: "not-base64-key-material" },
    } as never);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.signature).toEqual({
      error: "signing key present but unusable — no signature was emitted",
    });
  });
});

// FU-1 (29 Sep 2026): the Treaty Office chart is the primary source for CETS 225 and it is not in
// dispute. The feed states the status it records; C-2026-0929-03 is the ledger entry for CETS 225.
describe("/api/regulation CETS 225", () => {
  const all = JSON.stringify(REGULATION_FEED);
  const cets = REGULATION_FEED.resolved_disputes.find((r) => r.item.includes("CETS 225"));

  it("is no longer listed as disputed", () => {
    expect(REGULATION_FEED.disputed).toHaveLength(0);
    expect(all).not.toContain("sources disagree");
    expect(all).not.toContain("stated honestly rather than guessed");
  });

  it("states the status from the Treaty Office chart", () => {
    expect(cets?.status).toBe("NOT_IN_FORCE");
    expect(cets?.statement).toMatch(/^Not in force\./);
    expect(cets?.statement).toContain("status as of 29/09/2026");
    expect(cets?.statement).toContain("European Union on 15 May 2026");
    expect(cets?.statement).toContain("21 signatories");
    expect(cets?.statement).toContain("at least three Council of Europe member States");
    expect(cets?.statement).toContain("Art. 30(3)");
    expect(cets?.source).toContain("treatynum=225");
    expect(cets?.correction).toContain("C-2026-0929-03");
  });

  it("attributes obligations to the Parties, not to users or deployers", () => {
    expect(cets?.statement).toContain("addressed to the Parties");
    expect(cets?.statement).not.toMatch(/deployer|incident report/i);
  });
});
