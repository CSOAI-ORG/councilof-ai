/**
 * verify.truth.test.ts — the three defects outside tools found in /api/verify on 7 Oct 2026, each
 * pinned with the real committed records so the test fails the day the defect returns.
 *
 * Unlike verify.test.ts this file does NOT mock cardVerify: D1 and D2 are about what the real rule
 * says when the door feeds it the right inputs. fetch is stubbed to serve the repo's own public/
 * tree (did.json, the two ledgers, the cards) and GET /api/corrections from its handler, so every
 * verdict here is computed from committed bytes and no network.
 */
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost, liveAnchors, isCorrectionsLedger } from "./verify";
import { LEDGER, onRequestGet as correctionsGet } from "./corrections";
import { PINNED_ANCHORS } from "../_lib/cardVerify";
import { isPublicRoot } from "../_lib/publicRootVerify";

const PUB = new URL("../../public/", import.meta.url).pathname;
const read = (rel: string) => JSON.parse(readFileSync(PUB + rel, "utf8"));
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

// Real ids from the committed ledgers (read 2026-10-07):
//   WITHDRAWN.jsonl row 1  — C-2026-0914-01, a one-option swarm bank
//   SUPERSEDED.jsonl row 1 — #1155 body-state correction, replaced by e3718416…
//   a signed affect card in neither ledger
const WITHDRAWN_FILE = "interop/mill-cards-signed/signed-swarm-011690c6b88d.json";
const WITHDRAWN_ID = "011690c6b88d5854a291e4df2c54254f41e1c65b812dfb81ad69dfd9d08a7ed4";
const SUPERSEDED_FILE = "interop/mill-cards-signed/signed-affect-0e870854f6bf.json";
const SUPERSEDED_BY = "e37184166a7754ecf1552feba50f4165a2daad9267026df93ed15d37891ab62a";
const LIVE_FILE = "interop/mill-cards-signed/signed-affect-0377d52b937b.json";
const LIVE_ID = "0377d52b937b7b294a71e16fe67b59329ed605d10a30498353a2a02db072bbb6";

type Override = (pathname: string) => Response | null | undefined;
let override: Override = () => undefined;

function serveFromPublic(input: RequestInfo | URL): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const u = new URL(url);
  const o = override(u.pathname);
  if (o) return Promise.resolve(o);
  if (u.pathname === "/api/corrections") return (correctionsGet as any)({ request: new Request(url) });
  const p = PUB + u.pathname.replace(/^\//, "");
  if (existsSync(p)) return Promise.resolve(new Response(readFileSync(p), { status: 200 }));
  return Promise.resolve(new Response("not found", { status: 404 }));
}

beforeEach(() => {
  override = () => undefined;
  vi.stubGlobal("fetch", vi.fn(serveFromPublic));
});
afterEach(() => vi.unstubAllGlobals());

const post = async (body: unknown) =>
  (await (onRequestPost as any)({ request: new Request("https://councilof.ai/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) })).json();
const viaRecordUrl = async (recordUrl: string) =>
  (await (onRequestGet as any)({ request: new Request("https://councilof.ai/api/verify?record_url=" + encodeURIComponent(recordUrl)) })).json();
const codes = (b: any): string[] => b.checks.map((c: any) => c.code);

describe("D1 — a withdrawn card never comes back plain VALID", () => {
  it("a withdrawn id from the real ledger → state WITHDRAWN, cryptographic_state VALID, with the ledger's facts", async () => {
    const b = await post(read(WITHDRAWN_FILE));
    expect(b.id).toBe(WITHDRAWN_ID);
    expect(b.cryptographic_state).toBe("VALID");
    expect(b.status).toBe("WITHDRAWN");
    expect(b.state).toBe("WITHDRAWN");
    expect(b.state).not.toBe("VALID");
    expect(b.reasons).toContain("withdrawn");
    expect(b.withdrawal).toMatchObject({ withdrawn_at: "2026-09-14T10:39:19Z", correction_id: "C-2026-0914-01" });
    expect(b.withdrawal.reason).toMatch(/one-option/);
    expect(b.withdrawal.ledger).toMatch(/WITHDRAWN\.jsonl$/);
    expect(codes(b)).toContain("status_withdrawn");
    expect(b.note).toMatch(/WITHDRAWN/);
  });

  it("a live card → VALID with status LIVE", async () => {
    const b = await post(read(LIVE_FILE));
    expect(b.id).toBe(LIVE_ID);
    expect(b.cryptographic_state).toBe("VALID");
    expect(b.status).toBe("LIVE");
    expect(b.state).toBe("VALID");
    expect(b.withdrawal).toBeNull();
    expect(b.supersession).toBeNull();
    expect(codes(b)).toContain("status_live");
  });

  it("a superseded id → state SUPERSEDED, naming the replacement", async () => {
    const b = await post(read(SUPERSEDED_FILE));
    expect(b.cryptographic_state).toBe("VALID");
    expect(b.status).toBe("SUPERSEDED");
    expect(b.state).toBe("SUPERSEDED");
    expect(b.supersession).toMatchObject({ superseded_by: SUPERSEDED_BY, superseded_at: "2026-09-03T05:14:29Z" });
    expect(b.supersession.superseded_by_url).toBe("https://councilof.ai/interop/mill-cards-signed/signed-affect-e37184166a77.json");
    expect(b.reasons).toContain("superseded");
  });

  it("a withdrawn id with a tampered body → INVALID: the cryptographic failure wins, the withdrawal is still reported", async () => {
    const card = read(WITHDRAWN_FILE);
    card.body.n = card.body.n + 1;
    const b = await post(card);
    expect(b.id).toBe(WITHDRAWN_ID);
    expect(b.cryptographic_state).toBe("INVALID");
    expect(b.state).toBe("INVALID");
    expect(b.reasons).toContain("preimage_mismatch");
    expect(b.status).toBe("WITHDRAWN");
    expect(b.withdrawal.correction_id).toBe("C-2026-0914-01");
  });

  it("an unreadable ledger is UNCHECKED, never LIVE — and never turns a verdict into WITHDRAWN", async () => {
    override = (p) => (p.endsWith("WITHDRAWN.jsonl") ? new Response("down", { status: 503 }) : undefined);
    const b = await post(read(LIVE_FILE));
    expect(b.cryptographic_state).toBe("VALID");
    expect(b.status).toBe("UNCHECKED");
    expect(b.state).toBe("VALID");
    expect(codes(b)).toContain("status_unchecked");
    expect(b.checks.find((c: any) => c.code === "status_unchecked").ok).toBeNull();
  });

  it("the same answer through GET ?record_url=", async () => {
    const b = await viaRecordUrl(`https://councilof.ai/${WITHDRAWN_FILE}`);
    expect(b.state).toBe("WITHDRAWN");
    expect(b.cryptographic_state).toBe("VALID");
    expect(b.withdrawal.correction_id).toBe("C-2026-0914-01");
  });

  it("GET documents all five states and the status field", async () => {
    const b = await (await (onRequestGet as any)({ request: new Request("https://councilof.ai/api/verify") })).json();
    for (const s of ["VALID", "INVALID", "UNCHECKABLE", "WITHDRAWN", "SUPERSEDED"]) expect(b.states).toHaveProperty(s);
    for (const s of ["LIVE", "WITHDRAWN", "SUPERSEDED", "UNCHECKED"]) expect(b.status.values).toHaveProperty(s);
    expect(b.families).toHaveProperty("csoai.public-root/v1");
    expect(b.families).toHaveProperty("csoai.corrections/0.1");
  });
});

describe("D2 — the live did.json cross-check compares real key bytes", () => {
  it("guard: liveAnchors never returns an empty hex, and carries the pinned board key", async () => {
    const anchors = await liveAnchors("https://councilof.ai");
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) expect(a.hex).toMatch(/^[0-9a-f]{64}$/);
    expect(anchors.some((a) => a.hex === "")).toBe(false);
    const board = PINNED_ANCHORS.find((a) => a.id === "did:web:csoai.org#board-attestation-1")!;
    expect(anchors.find((a) => a.id === board.id)?.hex).toBe(board.hex);
  });

  it("a card signed by a key in the live DID document → live_anchor_agrees", async () => {
    const b = await post(read(LIVE_FILE));
    const row = b.checks.find((c: any) => c.check === "Live anchor cross-check");
    expect(row.code).toBe("live_anchor_agrees");
    expect(row.ok).toBe(true);
  });

  it("a card whose key is absent from the live DID document → live_anchor_disagrees (the pinned set still decides)", async () => {
    const did = read(".well-known/did.json");
    did.verificationMethod = did.verificationMethod.filter((m: any) => m.id !== "did:web:csoai.org#board-attestation-1");
    override = (p) => (p === "/.well-known/did.json" ? new Response(JSON.stringify(did), { status: 200 }) : undefined);
    const b = await post(read(LIVE_FILE));
    const row = b.checks.find((c: any) => c.check === "Live anchor cross-check");
    expect(row.code).toBe("live_anchor_disagrees");
    expect(row.ok).toBe(false);
    expect(b.cryptographic_state).toBe("VALID");
  });

  it("an unreachable did.json → live_anchor_unavailable, never disagrees", async () => {
    override = (p) => (p === "/.well-known/did.json" ? new Response("", { status: 500 }) : undefined);
    const b = await post(read(LIVE_FILE));
    expect(b.checks.find((c: any) => c.check === "Live anchor cross-check").code).toBe("live_anchor_unavailable");
  });
});

describe("D3 — our own root and our own ledger are checkable by our own verifier", () => {
  it("the committed public/root.json → VALID, both components", async () => {
    const root = read("root.json");
    expect(isPublicRoot(root)).toBe(true);
    const b = await post(root);
    expect(b.family).toBe("csoai.public-root/v1");
    expect(b.state).toBe("VALID");
    expect(b.components).toEqual({ signature: "VALID", merkle: "VALID" });
    expect(b.id).toBe(root.merkle_root);
    expect(b.card_count).toBe(root.card_sha256.length);
    expect(b.status).toBeNull();
    expect(codes(b)).toEqual(expect.arrayContaining(["signature_valid", "count_binds", "merkle_match"]));
  });

  it("root.json with one leaf changed → INVALID merkle_mismatch; the signature component stays VALID", async () => {
    const root = read("root.json");
    root.card_sha256[0] = "0".repeat(64);
    const b = await post(root);
    expect(b.state).toBe("INVALID");
    expect(b.components).toEqual({ signature: "VALID", merkle: "INVALID" });
    expect(b.reasons).toContain("merkle_mismatch");
  });

  it("root.json with a signed field changed → INVALID signature_invalid", async () => {
    const root = read("root.json");
    root.as_of = "2026-01-01T00:00:00Z";
    const b = await post(root);
    expect(b.state).toBe("INVALID");
    expect(b.components.signature).toBe("INVALID");
    expect(b.reasons).toContain("signature_invalid");
  });

  it("root.json without its leaves → UNCHECKABLE, naming the component that could not be checked", async () => {
    const root = read("root.json");
    delete root.card_sha256;
    const b = await post(root);
    expect(b.state).toBe("UNCHECKABLE");
    expect(b.components).toEqual({ signature: "VALID", merkle: "UNCHECKABLE" });
    expect(b.reasons).toEqual(["leaves_absent"]);
  });

  it("root.json through GET ?record_url= is the same verdict", async () => {
    const b = await viaRecordUrl("https://councilof.ai/root.json");
    expect(b.state).toBe("VALID");
    expect(b.components).toEqual({ signature: "VALID", merkle: "VALID" });
  });

  it("the committed corrections ledger → VALID", async () => {
    expect(isCorrectionsLedger(LEDGER)).toBe(true);
    const b = await post(clone(LEDGER));
    expect(b.family).toBe("csoai.corrections/0.1");
    expect(b.state).toBe("VALID");
    expect(b.ledger_signature_state).toBe("VALID");
    expect(b.id).toBe((LEDGER.signature as { id: string }).id);
    expect(codes(b)).toEqual(expect.arrayContaining(["content_id_match", "signature_valid"]));
  });

  it("the ledger as GET /api/corrections serves it (wrapper fields and all) → VALID through record_url", async () => {
    const b = await viaRecordUrl("https://councilof.ai/api/corrections");
    expect(b.family).toBe("csoai.corrections/0.1");
    expect(b.state).toBe("VALID");
    expect(b.fetched.http_status).toBe(200);
  });

  it("an entry appended without a re-issue → INVALID content_id_mismatch (what /api/corrections calls STALE)", async () => {
    const l = clone(LEDGER) as any;
    l.corrections.unshift({ id: "C-TEST", date: "2026-10-07", what_was_wrong: "x" });
    const b = await post(l);
    expect(b.state).toBe("INVALID");
    expect(b.reasons).toContain("content_id_mismatch");
    expect(b.ledger_signature_state).toBe("STALE");
  });

  it("corrupt attestation signature bytes → INVALID signature_invalid", async () => {
    const l = clone(LEDGER) as any;
    l.signature.signature = l.signature.signature.slice(0, -2) + (l.signature.signature.endsWith("00") ? "11" : "00");
    const b = await post(l);
    expect(b.state).toBe("INVALID");
    expect(b.reasons).toContain("signature_invalid");
  });

  it("a ledger with no signature → UNCHECKABLE unsigned, never VALID", async () => {
    const l = clone(LEDGER) as any;
    delete l.signature;
    const b = await post(l);
    expect(b.state).toBe("UNCHECKABLE");
    expect(b.reasons).toEqual(["unsigned"]);
  });
});
