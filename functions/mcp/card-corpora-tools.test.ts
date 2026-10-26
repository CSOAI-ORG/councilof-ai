/**
 * get_card, verify_card and list_cards across the card corpora (public audit 2026-09-28, fixes #3
 * and #4).
 *
 * #3. get_card reads the public-root card-v0 leaves. The signed card index is a separate corpus with
 * zero id overlap (council-os/CARD-CORPORA.md). The audit's id 82994353… is in the signed index,
 * reached get_card's 404 branch, and was answered INVALID ("not a leaf of the live root"): our own
 * tool called a genuine, verifying card invalid. It is now NOT_IN_THIS_CORPUS with one fixed
 * sentence, and INVALID needs the signed index AND the live root's inclusion endpoint to say no.
 *
 * #4. verify_card answered a bare 64-hex id (the "record id" the home page shows) UNCHECKABLE; the
 * first success came on the fourth call. A bare id now resolves to /signed/cards/{id}.json, and
 * list_cards rows carry card_url.
 *
 * The network is the published bytes: every fetch is served from public/ on disk, so each
 * expectation is computed from the same files the site serves, never typed.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCardTool, listCardsTool, NOT_IN_THIS_CORPUS_REASON } from "./_board";
import { sharedToolResult, verifyToolResult } from "./_handlers";
import { onRequest } from "./[[path]]";
import GSPC_TOOLS from "./gspc-tools.json";

const ORIGIN = "https://councilof.ai";
const PUBLIC = resolve(__dirname, "../../public");
const INDEX = JSON.parse(readFileSync(resolve(PUBLIC, "signed/card_index.json"), "utf8")) as {
  cards: { card: string; card_url?: string }[];
};
const SIGNED_IDS = INDEX.cards.map((c) => c.card);
/** The id the audit called with get_card on 28 Sep 2026. */
const AUDIT_ID = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";
const NOBODY = createHash("sha256").update("not a card in any corpus").digest("hex");

type Route = (url: URL) => Response | undefined;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Serve public/ from disk (the site's bytes); /api/* and anything absent is a 404 unless routed. */
function network(routes: Route[] = []) {
  const seen: string[] = [];
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    seen.push(url.pathname + url.search);
    for (const r of routes) {
      const hit = r(url);
      if (hit) return hit;
    }
    const f = resolve(PUBLIC, "." + url.pathname);
    if (!url.pathname.startsWith("/api/") && existsSync(f) && statSync(f).isFile()) {
      return new Response(readFileSync(f), { status: 200, headers: { "content-type": "application/json" } });
    }
    return json(404, { error: "not_found" });
  });
  return seen;
}
afterEach(() => vi.unstubAllGlobals());

const proofSays = (body: Record<string, unknown>, status = 200): Route => (url) =>
  url.pathname === "/api/proof" ? json(status, body) : undefined;

describe("get_card: a signed-card-index id is NOT_IN_THIS_CORPUS, never INVALID (#3)", () => {
  it("the audit's id answers NOT_IN_THIS_CORPUS with the one sentence and points at verify_card", async () => {
    expect(SIGNED_IDS).toContain(AUDIT_ID);
    network();
    const r = (await getCardTool(ORIGIN, { sha256: AUDIT_ID })) as Record<string, any>;
    expect(r.state).toBe("NOT_IN_THIS_CORPUS");
    expect(r.reason).toBe("This id is in the signed card index, not the public root. Use verify_card.");
    expect(NOT_IN_THIS_CORPUS_REASON).toBe(r.reason);
    expect(r.corpus).toBe("signed_card_index");
    expect(r.card_url).toBe(`${ORIGIN}/signed/cards/${AUDIT_ID}.json`);
    expect(r.next).toEqual({ tool: "verify_card", arguments: { card: AUDIT_ID } });
  });

  it("every one of the signed index's ids: never INVALID from get_card", async () => {
    network();
    const states = new Map<string, number>();
    for (const id of SIGNED_IDS) {
      const r = (await getCardTool(ORIGIN, { sha256: id })) as { state: string };
      states.set(r.state, (states.get(r.state) ?? 0) + 1);
    }
    expect(states.get("INVALID") ?? 0).toBe(0);
    expect(states.get("NOT_IN_THIS_CORPUS")).toBe(SIGNED_IDS.length);
  });

  it("the MCP answer's first line carries the sentence (tools/call on /mcp/free)", async () => {
    network();
    const res = await onRequest({
      request: new Request(`${ORIGIN}/mcp/free`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "get_card", arguments: { sha256: AUDIT_ID } } }),
      }),
      env: {},
      params: {},
    } as never);
    const text = await res.text();
    const data = text.includes("data:") ? text.split("\n").find((l) => l.startsWith("data:"))!.slice(5) : text;
    const msg = JSON.parse(data) as { result: { content: { text: string }[]; structuredContent: { state: string } } };
    expect(msg.result.structuredContent.state).toBe("NOT_IN_THIS_CORPUS");
    expect(msg.result.content[0].text.split("\n")[0]).toBe(
      "NOT_IN_THIS_CORPUS — This id is in the signed card index, not the public root. Use verify_card.",
    );
  });

  it("an id in neither corpus is INVALID only after the index and the live root both said no", async () => {
    const seen = network([proofSays({ error: "not_found", reason: "not a leaf" }, 404)]);
    const r = (await getCardTool(ORIGIN, { sha256: NOBODY })) as Record<string, any>;
    expect(r.state).toBe("INVALID");
    expect(r.reason).toBe("not a leaf of the live root, and not in the signed card index");
    expect(seen).toContain("/signed/card_index.json");
    expect(seen).toContain(`/api/proof?sha=${NOBODY}`);
  });

  it("an unreadable signed index makes the 404 UNCHECKABLE, never INVALID", async () => {
    network([(u) => (u.pathname === "/signed/card_index.json" ? json(503, {}) : undefined)]);
    const r = (await getCardTool(ORIGIN, { sha256: AUDIT_ID })) as Record<string, any>;
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reason).toMatch(/Could not check is not INVALID/);
  });

  it("an unreadable inclusion endpoint makes an unknown id UNCHECKABLE, never INVALID", async () => {
    network([proofSays({}, 503)]);
    const r = (await getCardTool(ORIGIN, { sha256: NOBODY })) as Record<string, any>;
    expect(r.state).toBe("UNCHECKABLE");
  });

  it("a live-root leaf whose wrapper is missing is UNCHECKABLE (the leaf is included; its body was not fetched)", async () => {
    network([proofSays({ kind: "inclusion", merkle_root: "ab".repeat(32) })]);
    const r = (await getCardTool(ORIGIN, { sha256: NOBODY })) as Record<string, any>;
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reason).toMatch(/a leaf of the live root/);
  });

  it("a public-root wrapper still answers VALID, as before", async () => {
    network();
    const dir = resolve(PUBLIC, "cards");
    const file = readdirSync(dir).find((f) => /^[0-9a-f]{16}\.json$/.test(f))!;
    const w = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
    const sha = String((w.card || w).sha256);
    expect(sha.slice(0, 16)).toBe(file.slice(0, 16));
    const r = (await getCardTool(ORIGIN, { sha256: sha })) as Record<string, any>;
    expect(r.state).toBe("VALID");
  });
});

describe("verify_card: a bare 64-hex card id resolves to /signed/cards/{id}.json (#4)", () => {
  it("the audit's id verifies VALID on the first call, and says what it fetched", async () => {
    network();
    const r = await sharedToolResult("verify_card", { card: AUDIT_ID }, ORIGIN);
    const sc = r.structuredContent as Record<string, any>;
    expect(sc.state).toBe("VALID");
    expect(sc.id).toBe(AUDIT_ID);
    expect(sc.resolved_from).toEqual({ id: AUDIT_ID, url: `${ORIGIN}/signed/cards/${AUDIT_ID}.json` });
    expect(r.content[0].text).toMatch(/^VALID — 82994353b8f94337… verifies under the published key\./);
  });

  it("case and surrounding space do not matter", async () => {
    network();
    const r = await sharedToolResult("verify_card", { card: `  ${AUDIT_ID.toUpperCase()}\n` }, ORIGIN);
    expect((r.structuredContent as { state: string }).state).toBe("VALID");
  });

  it("every id in the signed index verifies by bare id", async () => {
    network();
    const bad: string[] = [];
    for (const id of SIGNED_IDS) {
      const r = await sharedToolResult("verify_card", { card: id }, ORIGIN);
      const s = (r.structuredContent as { state: string }).state;
      if (s !== "VALID") bad.push(`${id}: ${s}`);
    }
    expect(bad).toEqual([]);
  }, 60_000);

  it("the unlisted `verify` alias resolves a bare id the same way", async () => {
    network();
    const r = await verifyToolResult({ card: AUDIT_ID }, ORIGIN);
    expect((r.structuredContent as Record<string, unknown>).state).toBe("VALID");
  });

  it("an id with no signed body is UNCHECKABLE with the next step, never INVALID", async () => {
    network();
    const r = await sharedToolResult("verify_card", { card: NOBODY }, ORIGIN);
    const sc = r.structuredContent as Record<string, any>;
    expect(sc.state).toBe("UNCHECKABLE");
    expect(sc.reason).toMatch(/no signed card body at https:\/\/councilof\.ai\/signed\/cards\/[0-9a-f]{64}\.json \(HTTP 404\)/);
    expect(sc.reason).toMatch(/use get_card or verify_inclusion/);
    expect(sc.resolved_from.id).toBe(NOBODY);
  });

  it("a file that carries a different id than the one asked for is UNCHECKABLE for the id asked", async () => {
    const other = SIGNED_IDS.find((id) => id !== AUDIT_ID)!;
    network([(u) => (u.pathname === `/signed/cards/${other}.json` ? new Response(readFileSync(resolve(PUBLIC, `signed/cards/${AUDIT_ID}.json`))) : undefined)]);
    const r = await sharedToolResult("verify_card", { card: other }, ORIGIN);
    const sc = r.structuredContent as Record<string, any>;
    expect(sc.state).toBe("UNCHECKABLE");
    expect(sc.reasons).toContain("id_mismatch_with_request");
  });

  it("the input schema says it takes a 64-hex card id", () => {
    const tool = (GSPC_TOOLS as { tools: any[] }).tools.find((t) => t.name === "verify_card");
    expect(tool.inputSchema.properties.card.description).toContain("or a 64-hex card id");
    expect(tool.description).toContain("a 64-hex card id");
  });

  it("get_card's definition names NOT_IN_THIS_CORPUS", () => {
    const tool = (GSPC_TOOLS as { tools: any[] }).tools.find((t) => t.name === "get_card");
    expect(tool.description).toContain("NOT_IN_THIS_CORPUS");
    expect(tool.outputSchema.properties.state.description).toContain("NOT_IN_THIS_CORPUS");
  });
});

describe("list_cards rows carry card_url (#4)", () => {
  it("each row's card_url is the absolute signed body for that row's id, and it is served", async () => {
    network();
    const out = (await listCardsTool(ORIGIN, { limit: 25 })) as { rows: { card: string; card_url: string }[] };
    expect(out.rows.length).toBe(25);
    for (const row of out.rows) {
      expect(row.card_url).toBe(`${ORIGIN}/signed/cards/${row.card}.json`);
      expect(existsSync(resolve(PUBLIC, `signed/cards/${row.card}.json`)), row.card).toBe(true);
    }
  });

  it("the row shape is declared in the output schema", () => {
    const tool = (GSPC_TOOLS as { tools: any[] }).tools.find((t) => t.name === "list_cards");
    expect(tool.outputSchema.properties.rows.items.properties).toHaveProperty("card_url");
    expect(tool.description).toContain("card_url");
  });
});

describe("list_cards carries its own state (talk UI label, 2026-09-29)", () => {
  it("LIVE when the signed card index was read on this call", async () => {
    network();
    const out = (await listCardsTool(ORIGIN, { limit: 3 })) as { state: string; state_basis: string };
    expect(out.state).toBe("LIVE");
    expect(out.state_basis).toMatch(/not verification/i);
  });

  it("UNREACHABLE when the index cannot be fetched, with no row invented", async () => {
    network([(url) => (url.pathname === "/signed/card_index.json" ? json(503, { error: "down" }) : undefined)]);
    const out = (await listCardsTool(ORIGIN, { limit: 3 })) as { state: string; rows: unknown };
    expect(out.state).toBe("UNREACHABLE");
    expect(out.rows).toBeNull();
  });

  it("the state is declared in the output schema", () => {
    const tool = (GSPC_TOOLS as { tools: any[] }).tools.find((t) => t.name === "list_cards");
    expect(tool.outputSchema.properties.state.enum).toEqual(["LIVE", "UNREACHABLE"]);
  });
});

describe("list_cards quotes what the store's count includes (2026-10-07)", () => {
  // /api/cards counts the signed index rows plus the cross-border East-West card when published
  // (functions/api/cards.ts). The tool showed 335 beside 336 under "the disagreement is the
  // finding"; it now carries the endpoint's own flag and definition, and still adjusts neither number.
  const n = INDEX.cards.length;
  const NOTE =
    "count = signed measurement cards in the living registry plus cross-border East-West card when published. kid identifies the signing key.";
  const cardsSay = (body: Record<string, unknown>): Route => (url) =>
    url.pathname === "/api/cards" ? json(200, body) : undefined;

  it("flags the cross-border card and quotes the endpoint's definition, leaving both counts as served", async () => {
    network([cardsSay({ cross_border: { card: "cross-border-card" }, cards: { count: n + 1, signed: n + 1, signed_under_did_key: n }, note: NOTE })]);
    const out = (await listCardsTool(ORIGIN, { limit: 1 })) as Record<string, any>;
    expect(out.card_store_count_endpoint.count).toBe(n + 1);
    expect(out.card_store_count_endpoint.signed_under_did_key).toBe(n);
    expect(out.card_store_count_endpoint.includes_cross_border_card).toBe(true);
    expect(out.card_store_count_endpoint.count_definition_as_published).toBe(
      "count = signed measurement cards in the living registry plus cross-border East-West card when published.",
    );
    expect(out.index.rows_carried).toBe(n);
  });

  it("does not flag it when the endpoint carries no cross-border card", async () => {
    network([cardsSay({ cross_border: null, cards: { count: n, signed: n } })]);
    const out = (await listCardsTool(ORIGIN, { limit: 1 })) as Record<string, any>;
    expect(out.card_store_count_endpoint.includes_cross_border_card).toBe(false);
    expect(out.card_store_count_endpoint.count_definition_as_published).toBeNull();
  });

  it("the MCP answer's first line names the cross-border card only when the endpoint flags it", async () => {
    const firstLine = async () => {
      const res = await onRequest({
        request: new Request(`${ORIGIN}/mcp/free`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "list_cards", arguments: { limit: 1 } } }),
        }),
        env: {},
        params: {},
      } as never);
      const text = await res.text();
      const data = text.includes("data:") ? text.split("\n").find((l) => l.startsWith("data:"))!.slice(5) : text;
      return (JSON.parse(data) as { result: { content: { text: string }[] } }).result.content[0].text.split("\n")[0];
    };
    network([cardsSay({ cross_border: { card: "cross-border-card" }, cards: { count: n + 1, signed: n + 1 }, note: NOTE })]);
    const flagged = await firstLine();
    expect(flagged).toContain("cross-border East-West card");
    expect(flagged).toContain("not reconciled here");
    vi.unstubAllGlobals();
    network([cardsSay({ cross_border: null, cards: { count: n, signed: n } })]);
    expect(await firstLine()).not.toContain("cross-border");
  });
});
