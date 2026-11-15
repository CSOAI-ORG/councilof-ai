import { describe, expect, it } from "vitest";
import rootWitness from "../../public/interop/root-witness-latest.json";
import { CURRENT_ROOT_OTS, CURRENT_ROOT_OTS_SENTENCE, otsSentence, readOts } from "./_otsClaim";
import { onRequestGet as evidencePack } from "./evidence-pack";
import { lobbyGround } from "./_chatLobby";

// Why this file exists. On 2026-11-14 the live witness said CONFIRMED_BITCOIN (block 975723) while
// GET /api/evidence-pack and the assistant's verify answer still said, in typed text, that the
// root's OTS receipt "is STAMPED_PENDING_BITCOIN" (E2E report 2026-11-14, findings 2 and 3). The
// sentence now derives from the witness bytes; these tests pin the derivation and both call sites.

const confirmed = { witnesses: { ots: { status: "CONFIRMED_BITCOIN", bitcoin_blocks: [975830], observed_at: "2026-11-14T21:42:18Z" } } };
const pending = { witnesses: { ots: { status: "STAMPED_PENDING_BITCOIN", observed_at: "2026-11-01T00:00:00Z" } } };

describe("readOts", () => {
  it("reads status, first block and observed_at from the witness shape", () => {
    expect(readOts(confirmed)).toEqual({ status: "CONFIRMED_BITCOIN", block: 975830, observed_at: "2026-11-14T21:42:18Z" });
  });
  it("names a pending calendar stamp without inventing a block", () => {
    expect(readOts(pending)).toEqual({ status: "STAMPED_PENDING_BITCOIN", block: null, observed_at: "2026-11-01T00:00:00Z" });
  });
  it("is UNCHECKABLE for a missing or malformed witness", () => {
    expect(readOts(undefined).status).toBe("UNCHECKABLE");
    expect(readOts({ witnesses: {} }).status).toBe("UNCHECKABLE");
    expect(readOts({ witnesses: { ots: { status: "", bitcoin_blocks: ["x"] } } })).toEqual({ status: "UNCHECKABLE", block: null, observed_at: null });
  });
});

describe("otsSentence", () => {
  it("says CONFIRMED_BITCOIN with the block, the read time and the source, and never the pending word", () => {
    const s = otsSentence(readOts(confirmed));
    expect(s).toContain("CONFIRMED_BITCOIN at Bitcoin block 975830");
    expect(s).toContain("witness observed 2026-11-14T21:42:18Z");
    expect(s).toContain("GET /interop/root-witness-latest.json → witnesses.ots");
    expect(s).toContain("root.json bytes only");
    expect(s).not.toContain("STAMPED_PENDING_BITCOIN");
  });
  it("says STAMPED_PENDING_BITCOIN is not a Bitcoin proof, and never CONFIRMED", () => {
    const s = otsSentence(readOts(pending));
    expect(s).toContain("STAMPED_PENDING_BITCOIN — a calendar fragment, not yet a Bitcoin proof");
    expect(s).toContain("not a confirmed Bitcoin timestamp");
    expect(s).not.toContain("CONFIRMED_BITCOIN");
  });
  it("names any other state as read and claims no inclusion", () => {
    const s = otsSentence(readOts({ witnesses: { ots: { status: "no_attestation" } } }));
    expect(s).toContain("state reads NO_ATTESTATION");
    expect(s).toContain("no confirmed inclusion in a Bitcoin block is claimed");
    expect(s).not.toMatch(/\bat Bitcoin block\b/);
  });
  it("never carries a price or a certification word", () => {
    for (const w of [confirmed, pending, undefined]) expect(otsSentence(readOts(w))).not.toMatch(/\$|USDC|certif/i);
  });
});

describe("committed bytes", () => {
  const fileStatus = String((rootWitness as { witnesses: { ots: { status: string } } }).witnesses.ots.status).toUpperCase();
  const otherState = fileStatus === "CONFIRMED_BITCOIN" ? "STAMPED_PENDING_BITCOIN" : "CONFIRMED_BITCOIN";

  it("the shipped sentence names the status the committed witness carries, and not the other one", () => {
    expect(CURRENT_ROOT_OTS.status).toBe(fileStatus);
    expect(CURRENT_ROOT_OTS_SENTENCE).toContain(fileStatus);
    expect(CURRENT_ROOT_OTS_SENTENCE).not.toContain(otherState);
  });

  it("GET /api/evidence-pack → active_controls.signing_chain derives from the witness, not from typed text", async () => {
    const res = await evidencePack({ request: new Request("https://councilof.ai/api/evidence-pack"), env: {} } as never);
    const body = (await res.json()) as { active_controls: { signing_chain: string } };
    expect(body.active_controls.signing_chain).toContain(CURRENT_ROOT_OTS_SENTENCE);
    expect(body.active_controls.signing_chain).toContain(fileStatus);
    expect(body.active_controls.signing_chain).not.toContain(otherState);
    expect(body.active_controls.signing_chain).toContain("does not make every cited card time-anchored");
  });

  it("the assistant's verify answer quotes the same derived sentence", () => {
    const a = lobbyGround("How do I verify a signed card?");
    expect(a).not.toBeNull();
    expect(a).toContain(CURRENT_ROOT_OTS_SENTENCE);
    expect(a).not.toContain(otherState);
    expect(a).toContain("No account and no fee are required to verify.");
  });
});
