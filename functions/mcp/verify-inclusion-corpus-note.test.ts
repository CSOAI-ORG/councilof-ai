/**
 * verify_inclusion and /api/proof: "not a leaf" carries a corpus note (anonymous end-to-end test,
 * 2026-09-30). An agent got VALID from verify_card for
 * /interop/mill-cards-signed/signed-jail-4ca9e0079d1d.json and then INVALID "not a leaf" from
 * verify_inclusion for the same card's id. Both were right about their own bytes; the reader could
 * not tell. The state enum and the tool count are unchanged; the answer now says which corpus the
 * public root covers and where a known card of another corpus is verified.
 *
 * The network is the published bytes: public/ is served from disk and /api/proof is the real
 * Function (functions/api/proof.ts) answering over those bytes, so every expectation below is read
 * from the files the site serves, never typed.
 */
import { createHash } from "node:crypto";
import FLEET_LOCK_FOR_COUNT from "./tool-fleet.lock.json";
const LOCK_FREE: string[] = FLEET_LOCK_FOR_COUNT.free;
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyInclusionTool } from "./_board";
import { onRequest } from "./[[path]]";
import { onRequestGet as proofGet } from "../api/proof";
import { CORPUS_KINDS } from "../_lib/corpusNote";
import GSPC_TOOLS from "./gspc-tools.json";

const ORIGIN = "https://councilof.ai";
const PUBLIC = resolve(__dirname, "../../public");
const readPublic = (p: string) => JSON.parse(readFileSync(resolve(PUBLIC, "." + p), "utf8"));
const ROOT = readPublic("/root.json") as { card_sha256: string[]; card_count: number; as_of: string; merkle_root: string };
const INDEX = readPublic("/signed/card_index.json") as { head: string; n_cards: number; cards: { card: string; card_url?: string }[] };
const POINTER = readPublic("/interop/card-root-latest.json") as { root_url: string; ots_url: string };
const MILL_ROOT = readPublic(POINTER.root_url) as { n_leaves: number; as_of: string; leaves: { id: string; leaf: string; card: string; index: number }[] };

/** The mill card the anonymous test verified with verify_card, then saw INVALID from verify_inclusion. */
const MILL_ID = "4ca9e0079d1d3c3a35184063c4221458866cd7c14bb508449fa4cce88676c05a";
/** A real public-root leaf, named in the brief. */
const REAL_LEAF = "056a1efd58d1324912ee3fcfced1c7308e7571348167dfe27e0e261701dbce54";
const RANDOM = createHash("sha256").update("a sha in no corpus, 2026-09-30").digest("hex");

function network(override?: (url: URL) => Response | undefined) {
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    const hit = override?.(url);
    if (hit) return hit;
    if (url.pathname === "/api/proof") {
      return (proofGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request(url.toString()), env: {} });
    }
    const f = resolve(PUBLIC, "." + url.pathname);
    if (!url.pathname.startsWith("/api/") && existsSync(f) && statSync(f).isFile()) {
      return new Response(readFileSync(f), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

const vi_ = (sha: string) => verifyInclusionTool(ORIGIN, { sha256: sha }) as Promise<Record<string, any>>;

describe("the fixtures are what the brief says they are (read from the served bytes)", () => {
  it("the mill card is a leaf of the mill-card root and NOT of the public root; the real leaf is", () => {
    expect(ROOT.card_sha256).not.toContain(MILL_ID);
    expect(MILL_ROOT.leaves.some((l) => l.id === MILL_ID)).toBe(true);
    expect(ROOT.card_sha256).toContain(REAL_LEAF);
    expect(ROOT.card_sha256.length).toBe(ROOT.card_count);
  });
});

describe("verify_inclusion: not a leaf says which corpus, never reads as forged", () => {
  it("a known mill card id: INVALID (enum unchanged) with the mill-card root, its leaf and where to verify", async () => {
    network();
    const r = await vi_(MILL_ID);
    expect(r.state).toBe("INVALID");
    expect(r.corpus).toBe("mill_card_root");
    const leaf = MILL_ROOT.leaves.find((l) => l.id === MILL_ID)!;
    expect(r.corpus_note).toContain(`commits ${ROOT.card_count} catalogued public-root card-v0 leaves only`);
    expect(r.corpus_note).toContain(`as_of ${ROOT.as_of}`);
    expect(r.corpus_note).toContain("not \"forged\"");
    expect(r.corpus_note).toContain(leaf.card);
    expect(r.corpus_note).toContain(POINTER.root_url);
    expect(r.mill_card_root).toMatchObject({ root_url: POINTER.root_url, leaf_sha256: leaf.leaf, index: leaf.index, n_leaves: MILL_ROOT.n_leaves, root_bytes_match_pointer: true });
    expect(r.verify_with).toMatchObject({ tool: "verify_card", arguments: { card: `/interop/mill-cards-signed/${leaf.card}` } });
    // No anchoring asserted anywhere in the note.
    expect(r.corpus_note).not.toMatch(/\banchored\b/i);
  });

  it("a known signed-card-index id: INVALID with the index, its head and verify_card", async () => {
    network();
    const id = INDEX.cards[0].card;
    expect(ROOT.card_sha256).not.toContain(id);
    const r = await vi_(id);
    expect(r.state).toBe("INVALID");
    expect(r.corpus).toBe("signed_card_index");
    expect(r.corpus_note).toContain(`head ${INDEX.head}`);
    expect(r.corpus_note).toContain(`${INDEX.n_cards} cards`);
    expect(r.corpus_note).toContain("no anchoring is claimed");
    expect(r.verify_with).toMatchObject({ tool: "verify_card", arguments: { card: id } });
  });

  it("a real public-root leaf still answers VALID, with no corpus note", async () => {
    network();
    const r = await vi_(REAL_LEAF);
    expect(r.state).toBe("VALID");
    expect(r.merkle_root).toBe(ROOT.merkle_root);
    expect(r.corpus_note).toBeUndefined();
  });

  it("a random sha is still INVALID, with the generic note", async () => {
    network();
    const r = await vi_(RANDOM);
    expect(r.state).toBe("INVALID");
    expect(r.corpus).toBe("none_known");
    expect(r.corpus_note).toContain("Not a leaf of the public root.");
    expect(r.corpus_note).toContain("also not a card id in the signed card index");
    expect(r.verify_with).toBeUndefined();
  });

  it("an unreadable other corpus never guesses membership: the note says it could not check", async () => {
    network((u) => (u.pathname === "/signed/card_index.json" || u.pathname === "/interop/card-root-latest.json" ? new Response("", { status: 503 }) : undefined));
    const r = await vi_(MILL_ID);
    expect(r.state).toBe("INVALID");
    expect(r.corpus).toBe("unchecked");
    expect(r.corpus_note).toMatch(/could not be checked/);
  });

  it("mill-card root bytes that do not match the pointer are not quoted", async () => {
    network((u) => (u.pathname === POINTER.root_url ? new Response(JSON.stringify({ leaves: [{ id: MILL_ID, leaf: "0".repeat(64), card: "x.json", index: 0 }] })) : undefined));
    const r = await vi_(MILL_ID);
    expect(r.corpus).toBe("unchecked");
    expect(r.mill_card_root).toBeUndefined();
  });

  it("an older /api/proof body without a note still gets one (same helper)", async () => {
    network((u) => (u.pathname === "/api/proof" ? new Response(JSON.stringify({ error: "not_found", reason: "not a leaf" }), { status: 404 }) : undefined));
    const r = await vi_(MILL_ID);
    expect(r.state).toBe("INVALID");
    expect(r.corpus).toBe("mill_card_root");
  });

  it("an unreachable proof endpoint stays UNCHECKABLE", async () => {
    network((u) => (u.pathname === "/api/proof" ? new Response("", { status: 503 }) : undefined));
    const r = await vi_(MILL_ID);
    expect(r.state).toBe("UNCHECKABLE");
  });

  it("every state reached is in the unchanged three-state enum; every corpus is a declared kind", async () => {
    network();
    for (const sha of [MILL_ID, REAL_LEAF, RANDOM, INDEX.cards[1].card]) {
      const r = await vi_(sha);
      expect(["VALID", "INVALID", "UNCHECKABLE"]).toContain(r.state);
      if (r.corpus) expect(CORPUS_KINDS as readonly string[]).toContain(r.corpus);
    }
  });
});

describe("/api/proof carries the same note (one producer)", () => {
  it("404 not_found for the mill card, with corpus and corpus_note; reason unchanged", async () => {
    network();
    const res = await (proofGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request(`${ORIGIN}/api/proof?sha=${MILL_ID}`), env: {} });
    expect(res.status).toBe(404);
    const b = (await res.json()) as Record<string, any>;
    expect(b.error).toBe("not_found");
    expect(b.reason).toBe("sha is not a leaf of the last published root (trail is that root only)");
    expect(b.corpus).toBe("mill_card_root");
    expect(b.card_count).toBe(ROOT.card_count);
  });
});

describe("the MCP surface: tool count unchanged, and the first line leads with the note", () => {
  it("tools/list still lists the locked free tools; verify_inclusion's definition is untouched", () => {
    const tools = (GSPC_TOOLS as { tools: { name: string }[] }).tools;
    expect(tools.map((t) => t.name)).toEqual(LOCK_FREE);
    expect(tools.map((t) => t.name)).toContain("verify_inclusion");
  });

  it("tools/call verify_inclusion on /mcp/free: INVALID, and the first line is the corpus note", async () => {
    network();
    const res = await onRequest({
      request: new Request(`${ORIGIN}/mcp/free`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "verify_inclusion", arguments: { sha256: MILL_ID } } }),
      }),
      env: {},
      params: {},
    } as never);
    const text = await res.text();
    const data = text.includes("data:") ? text.split("\n").find((l) => l.startsWith("data:"))!.slice(5) : text;
    const msg = JSON.parse(data) as { result: { content: { text: string }[]; structuredContent: Record<string, any> } };
    expect(msg.result.structuredContent.state).toBe("INVALID");
    expect(msg.result.content[0].text.split("\n")[0]).toMatch(/^INVALID — Not a leaf of the public root\./);
  });
});
