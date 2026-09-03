// Tests for facilitator dialect negotiation. The `kinds` fixtures below are the LITERAL shapes
// returned by the live facilitators on 2026-09-03 (probed, not imagined), so if a facilitator
// changes its advertised support these tests are the thing that should be updated first.

import { describe, it, expect, beforeEach } from "vitest";
import {
  chooseDialect,
  sameNetwork,
  facilitatorDialect,
  toDialectPayload,
  _clearSupportedCache,
  type SupportedKind,
} from "./_x402_negotiate";

/** https://facilitator.payai.network/supported — the only keyless facilitator serving Base mainnet. */
const PAYAI: SupportedKind[] = [
  { x402Version: 1, scheme: "exact", network: "base-sepolia" },
  { x402Version: 1, scheme: "exact", network: "base" },
  { x402Version: 1, scheme: "exact", network: "avalanche" },
  { x402Version: 1, scheme: "exact", network: "polygon" },
];

/** https://x402.org/facilitator/supported — v2, but Base SEPOLIA only: cannot move real USDC. */
const X402ORG: SupportedKind[] = [
  { x402Version: 2, scheme: "exact", network: "eip155:84532" },
  { x402Version: 2, scheme: "upto", network: "eip155:84532" },
  { x402Version: 2, scheme: "exact", network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" },
];

const BASE_MAINNET = "eip155:8453";

beforeEach(() => _clearSupportedCache());

describe("sameNetwork", () => {
  it("treats the slug and CAIP-2 spellings of one chain as one chain", () => {
    expect(sameNetwork("base", BASE_MAINNET)).toBe(true);
    expect(sameNetwork(BASE_MAINNET, "base")).toBe(true);
    expect(sameNetwork("base-sepolia", "eip155:84532")).toBe(true);
  });

  it("does not confuse mainnet with testnet — the difference is real money", () => {
    expect(sameNetwork("base", "eip155:84532")).toBe(false);
    expect(sameNetwork(BASE_MAINNET, "base-sepolia")).toBe(false);
    expect(sameNetwork("", BASE_MAINNET)).toBe(false);
  });
});

describe("chooseDialect", () => {
  it("picks v1 for PayAI on Base mainnet — the bug this module exists to fix", () => {
    expect(chooseDialect(PAYAI, BASE_MAINNET)).toBe(1);
  });

  it("refuses x402.org for Base mainnet: it only settles on Sepolia", () => {
    expect(chooseDialect(X402ORG, BASE_MAINNET)).toBeNull();
    expect(chooseDialect(X402ORG, "eip155:84532")).toBe(2);
  });

  it("prefers v2 when a facilitator offers both", () => {
    const both: SupportedKind[] = [
      { x402Version: 1, scheme: "exact", network: "base" },
      { x402Version: 2, scheme: "exact", network: BASE_MAINNET },
    ];
    expect(chooseDialect(both, BASE_MAINNET)).toBe(2);
  });

  it("ignores schemes we do not implement", () => {
    expect(chooseDialect([{ x402Version: 2, scheme: "upto", network: BASE_MAINNET }], BASE_MAINNET)).toBeNull();
  });
});

function stubFetch(status: number, body: unknown) {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

describe("facilitatorDialect", () => {
  it("negotiates v1 against a PayAI-shaped /supported", async () => {
    const r = await facilitatorDialect("https://f.test", BASE_MAINNET, {}, stubFetch(200, { kinds: PAYAI }));
    expect(r.version).toBe(1);
  });

  it("reports the unusable case distinctly so the caller can refuse rather than guess", async () => {
    const r = await facilitatorDialect("https://f2.test", BASE_MAINNET, {}, stubFetch(200, { kinds: X402ORG }));
    expect(r.version).toBeNull();
    expect(r.reason).toContain("no exact scheme");
  });

  it("falls back silently (version null, different reason) when /supported is absent", async () => {
    const r = await facilitatorDialect("https://f3.test", BASE_MAINNET, {}, stubFetch(404, {}));
    expect(r.version).toBeNull();
    expect(r.reason).toContain("404");
    expect(r.reason).not.toContain("no exact scheme"); // must NOT trigger the hard refusal
  });

  it("survives a thrown fetch without breaking the payment path", async () => {
    const boom = (async () => {
      throw new Error("dns");
    }) as unknown as typeof fetch;
    const r = await facilitatorDialect("https://f4.test", BASE_MAINNET, {}, boom);
    expect(r.version).toBeNull();
    expect(r.reason).toContain("unreachable");
  });

  it("caches /supported so a burst of paid calls asks once", async () => {
    let calls = 0;
    const counting = (async () => {
      calls++;
      return { ok: true, status: 200, json: async () => ({ kinds: PAYAI }) } as unknown as Response;
    }) as unknown as typeof fetch;
    await facilitatorDialect("https://f5.test", BASE_MAINNET, {}, counting);
    await facilitatorDialect("https://f5.test", BASE_MAINNET, {}, counting);
    expect(calls).toBe(1);
  });
});

describe("toDialectPayload", () => {
  const signed = {
    x402Version: 2,
    scheme: "exact",
    network: BASE_MAINNET,
    payload: {
      signature: "0xsig",
      authorization: { from: "0xa", to: "0xb", value: "1000", nonce: "0xn" },
    },
  };

  it("downgrades the envelope to v1 slug form for a v1 facilitator", () => {
    const out = toDialectPayload(signed, 1);
    expect(out.x402Version).toBe(1);
    expect(out.network).toBe("base");
  });

  it("NEVER touches the signed material — signature and authorization pass through identically", () => {
    for (const v of [1, 2] as const) {
      expect(toDialectPayload(signed, v).payload).toEqual(signed.payload);
    }
    // in particular the recipient inside the signed tuple is untouched
    expect((toDialectPayload(signed, 1).payload as typeof signed.payload).authorization.to).toBe("0xb");
  });

  it("leaves a payload with no network field alone rather than inventing one", () => {
    const out = toDialectPayload({ x402Version: 1, scheme: "exact" }, 2);
    expect(out.network).toBeUndefined();
    expect(out.x402Version).toBe(2);
  });
});
