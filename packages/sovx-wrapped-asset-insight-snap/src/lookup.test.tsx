import { describe, expect, it } from "@jest/globals";

import { FOOTNOTE, Insight, NO_RECORD, NOTHING_TO_LOOK_UP, TITLE } from ".";
import { API, contractCaip19, lookup, toRecords } from "./lookup";

const USDCE = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const CAIP = `eip155:42161/erc20:${USDCE}`;
const answer = {
  schema: "csoai.wrapper-caip19/0.1",
  records: [
    { id: "usdc.e:arbitrum", state: "ESCROW_PARITY_READ", as_of: "2026-09-28T22:05:25Z", evidence: "https://councilof.ai/w/usdc.e:arbitrum", card: {} },
  ],
};
const fakeFetch = (status: number, body: unknown, seen: string[] = []) =>
  (async (url: string) => {
    seen.push(url);
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;

/** Every string a rendered element would show, in order. */
const texts = (node: unknown): string[] => {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (node && typeof node === "object") {
    const props = (node as { props?: Record<string, unknown> }).props ?? {};
    return [...(typeof props.href === "string" ? [props.href] : []), ...texts(props.children)];
  }
  return [];
};

describe("contractCaip19", () => {
  it("builds eip155 erc20 CAIP-19 from a CAIP-2 or hex chain id", () => {
    expect(contractCaip19("eip155:42161", USDCE)).toBe(CAIP);
    expect(contractCaip19("0xa4b1", USDCE)).toBe(CAIP);
  });
  it("returns null for contract creation, a non-EVM chain or a malformed address", () => {
    expect(contractCaip19("eip155:1", undefined)).toBeNull();
    expect(contractCaip19("eip155:1", "0x1234")).toBeNull();
    expect(contractCaip19("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", USDCE)).toBeNull();
    expect(contractCaip19("eip155:0", USDCE)).toBeNull();
  });
});

describe("lookup", () => {
  it("fetches the free caip19 preview and keeps state, as_of and the councilof.ai link", async () => {
    const seen: string[] = [];
    const r = await lookup(CAIP, fakeFetch(200, answer, seen));
    expect(seen).toEqual([API + CAIP]);
    expect(r).toEqual({ kind: "records", caip19: CAIP, records: [{ id: "usdc.e:arbitrum", state: "ESCROW_PARITY_READ", asOf: "2026-09-28T22:05:25Z", evidence: "https://councilof.ai/w/usdc.e:arbitrum" }] });
  });
  it("404 is 'no record', not an error", async () => {
    expect(await lookup(CAIP, fakeFetch(404, { error: "not_on_roster" }))).toEqual({ kind: "none", caip19: CAIP });
  });
  it("a server error, a non-JSON body or a thrown fetch is 'could not be fetched'", async () => {
    expect((await lookup(CAIP, fakeFetch(503, {}))).kind).toBe("unavailable");
    expect((await lookup(CAIP, fakeFetch(200, "<html>"))).kind).toBe("unavailable");
    const boom = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await lookup(CAIP, boom)).toEqual({ kind: "unavailable", caip19: CAIP, reason: "offline" });
  });
  it("drops records whose link leaves councilof.ai or whose fields are malformed", () => {
    expect(toRecords({ records: [{ ...answer.records[0], evidence: "https://example.com/phish" }] })).toEqual([]);
    expect(toRecords({ records: [{ ...answer.records[0], state: "<b>SAFE</b>" }] })).toEqual([]);
    expect(toRecords({ records: [{ ...answer.records[0], as_of: "yesterday" }] })).toEqual([]);
    expect(toRecords(null)).toEqual([]);
  });
});

describe("Insight", () => {
  it("says 'Measured state: X as of Y' with a link, and nothing that reads as a score or advice", async () => {
    const r = await lookup(CAIP, fakeFetch(200, answer));
    const shown = texts(Insight({ result: r }));
    expect(shown).toEqual([TITLE, "Measured state: ESCROW_PARITY_READ as of 2026-09-28T22:05:25Z", "https://councilof.ai/w/usdc.e:arbitrum", "Record usdc.e:arbitrum", FOOTNOTE]);
    expect(shown.join(" ")).not.toMatch(/\b(score|safe|unsafe|risk|warning|danger|recommend|trusted|certified|avoid|should)\b/iu);
  });
  it("says there is nothing to look up when the transaction names no contract", () => {
    expect(texts(Insight({ result: null }))).toEqual([TITLE, NOTHING_TO_LOOK_UP]);
  });
  it("names the contract when there is no record, and the reason when the fetch failed", () => {
    expect(texts(Insight({ result: { kind: "none", caip19: CAIP } }))).toEqual([TITLE, NO_RECORD, CAIP]);
    expect(texts(Insight({ result: { kind: "unavailable", caip19: CAIP, reason: "HTTP 503" } }))).toEqual([TITLE, "The record could not be fetched (HTTP 503).", CAIP]);
  });
});
