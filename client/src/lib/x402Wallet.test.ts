/**
 * The one thing that must be exactly right is the signed material.
 *
 * A wallet signature is only useful if the struct the buyer signs is byte-identical to the
 * struct the token contract will verify. EIP-712 hashes the ENCODED TYPE STRING, so if the
 * string this module produces equals the canonical EIP-3009 one, the typehash matches by
 * construction — which is checkable here without a keccak implementation or a private key.
 *
 * The canonical string, from EIP-3009 and from USDC's deployed contract:
 *   TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)
 *
 * Field ORDER is part of it. Reordering `value` and `validAfter` produces a different hash and
 * a signature the token rejects — after the buyer has already approved it in their wallet.
 */
import { describe, expect, it, vi } from "vitest";
import {
  buildTypedData,
  chainIdFromNetwork,
  chooseAccept,
  encodePaymentHeader,
  randomNonce,
  type X402Accept,
} from "./x402Wallet";

/** Verbatim from GET https://councilof.ai/api/free-door on 2026-09-06. */
const FREE_DOOR_ACCEPT: X402Accept = {
  scheme: "exact",
  network: "eip155:8453",
  amount: "0",
  maxAmountRequired: "0",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  maxTimeoutSeconds: 300,
  extra: { name: "USD Coin", version: "2", decimals: 6, symbol: "USDC" },
};

const CANONICAL_TYPE =
  "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)";

/** EIP-712 encodeType for the primary type — the exact preimage of the typehash. */
const encodeType = (typedData: ReturnType<typeof buildTypedData>["typedData"]) => {
  const fields = typedData.types.TransferWithAuthorization;
  return `TransferWithAuthorization(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
};

describe("EIP-3009 signed material", () => {
  it("produces the canonical TransferWithAuthorization type string", () => {
    const { typedData } = buildTypedData(FREE_DOOR_ACCEPT, "0x1111111111111111111111111111111111111111");
    expect(encodeType(typedData)).toBe(CANONICAL_TYPE);
  });

  it("keeps the field order the token verifies", () => {
    const { typedData } = buildTypedData(FREE_DOOR_ACCEPT, "0x1111111111111111111111111111111111111111");
    expect(typedData.types.TransferWithAuthorization.map((f) => f.name)).toEqual([
      "from",
      "to",
      "value",
      "validAfter",
      "validBefore",
      "nonce",
    ]);
  });

  it("binds the domain to the TOKEN, not to our API", () => {
    const { typedData } = buildTypedData(FREE_DOOR_ACCEPT, "0x1111111111111111111111111111111111111111");
    expect(typedData.domain).toEqual({
      name: "USD Coin",
      version: "2",
      chainId: 8453,
      verifyingContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
  });

  it("puts payTo inside the signed message, so the envelope cannot redirect the money", () => {
    const { typedData, authorization } = buildTypedData(
      FREE_DOOR_ACCEPT,
      "0x1111111111111111111111111111111111111111",
    );
    expect(typedData.message.to).toBe(FREE_DOOR_ACCEPT.payTo);
    expect(authorization.to).toBe(FREE_DOOR_ACCEPT.payTo);
  });

  it("signs the amount the server asked for, including zero", () => {
    const { authorization } = buildTypedData(FREE_DOOR_ACCEPT, "0xabc");
    expect(authorization.value).toBe("0");
  });

  it("refuses to sign when the challenge names no amount", () => {
    const open = { ...FREE_DOOR_ACCEPT, amount: undefined, maxAmountRequired: undefined };
    expect(() => buildTypedData(open, "0xabc")).toThrow(/no amount/i);
  });

  it("derives validBefore from the challenge's own timeout", () => {
    const { authorization } = buildTypedData(FREE_DOOR_ACCEPT, "0xabc", 1_000_000);
    expect(authorization.validAfter).toBe("0");
    expect(authorization.validBefore).toBe("1000300");
  });
});

describe("network handling", () => {
  it("reads the chain id the door settles on", () => {
    expect(chainIdFromNetwork("eip155:8453")).toBe(8453);
    expect(chainIdFromNetwork("base")).toBe(8453);
    expect(chainIdFromNetwork("84532")).toBe(84532);
  });

  it("refuses to guess an unknown network rather than sign for the wrong chain", () => {
    expect(() => chainIdFromNetwork("mainnet-ish")).toThrow(/refusing to guess/i);
    expect(() => chainIdFromNetwork("")).toThrow();
  });
});

describe("the X-PAYMENT envelope", () => {
  it("base64-encodes a v2 envelope our own server can decode", () => {
    const { authorization } = buildTypedData(FREE_DOOR_ACCEPT, "0xabc");
    const header = encodePaymentHeader(FREE_DOOR_ACCEPT, authorization, "0xsig");
    // functions/api/_x402.ts:314 — base64 unless it already starts with "{"
    const decoded = JSON.parse(atob(header));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe("eip155:8453");
    // toDialectPayload passes payload.payload through untouched, so this is the load-bearing part
    expect(decoded.payload.signature).toBe("0xsig");
    expect(decoded.payload.authorization).toEqual(authorization);
  });

  it("chooses the exact scheme and refuses anything else", () => {
    expect(chooseAccept({ accepts: [FREE_DOOR_ACCEPT] }).scheme).toBe("exact");
    expect(() => chooseAccept({ accepts: [] })).toThrow(/no accepts/i);
    expect(() =>
      chooseAccept({ accepts: [{ ...FREE_DOOR_ACCEPT, scheme: "upto" }] }),
    ).toThrow(/only signs EIP-3009 exact/i);
  });
});

describe("nonce", () => {
  it("is 32 bytes and does not repeat", () => {
    const a = randomNonce();
    const b = randomNonce();
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

/**
 * The whole client path, with a fake wallet and a stubbed network.
 *
 * This is as close to "MetaMask pays /api/free-door" as can be proven without a browser
 * extension in the loop: a 402 is detected, the challenge is parsed, typed data is built,
 * the provider is asked for a signature, the header is attached, and the retry is made.
 * The only step it does not cover is a human approving in the wallet UI.
 */
describe("payAndFetch — 402, sign, retry", () => {
  const CHALLENGE = { x402Version: 2, accepts: [FREE_DOOR_ACCEPT] };
  const PAYER = "0x1111111111111111111111111111111111111111";

  function fakeWallet(overrides: Record<string, unknown> = {}) {
    const calls: { method: string; params?: unknown[] }[] = [];
    return {
      calls,
      wallet: {
        info: { uuid: "u", name: "Fake Wallet", icon: "", rdns: "test.fake" },
        provider: {
          async request({ method, params }: { method: string; params?: unknown[] }) {
            calls.push({ method, params });
            if (method in overrides) return overrides[method];
            if (method === "eth_requestAccounts") return [PAYER];
            if (method === "eth_chainId") return "0x2105"; // 8453
            if (method === "eth_signTypedData_v4") return "0xdeadbeef";
            throw new Error(`unexpected method ${method}`);
          },
        },
      },
    };
  }

  it("signs the challenge and retries with X-PAYMENT", async () => {
    const seen: RequestInit[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      seen.push(init ?? {});
      if (seen.length === 1)
        return new Response(JSON.stringify(CHALLENGE), { status: 402 });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "x-payment-response": "settled" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { wallet, calls } = fakeWallet();
    const { payAndFetch } = await import("./x402Wallet");
    const result = await payAndFetch("https://councilof.ai/api/free-door", wallet as never);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(200);
    expect(result.paymentResponse).toBe("settled");
    expect(result.payer).toBe(PAYER);

    // the retry carried a decodable v2 envelope
    const header = new Headers(seen[1].headers).get("X-PAYMENT");
    expect(header).toBeTruthy();
    const decoded = JSON.parse(atob(header as string));
    expect(decoded.payload.signature).toBe("0xdeadbeef");
    expect(decoded.payload.authorization.to).toBe(FREE_DOOR_ACCEPT.payTo);
    expect(decoded.payload.authorization.value).toBe("0");

    // and the wallet was asked for exactly the right things, in order
    expect(calls.map((c) => c.method)).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "eth_signTypedData_v4",
    ]);
    vi.unstubAllGlobals();
  });

  it("refuses to sign on the wrong chain instead of burning a signature", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(CHALLENGE), { status: 402 })),
    );
    const { wallet, calls } = fakeWallet({ eth_chainId: "0x1" }); // ethereum mainnet
    const { payAndFetch } = await import("./x402Wallet");
    await expect(payAndFetch("https://councilof.ai/api/free-door", wallet as never)).rejects.toThrow(
      /chain 1 but this door settles on 8453/,
    );
    expect(calls.map((c) => c.method)).not.toContain("eth_signTypedData_v4");
    vi.unstubAllGlobals();
  });

  it("does not ask the wallet for anything when the door is not metered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    const { wallet, calls } = fakeWallet();
    const { payAndFetch } = await import("./x402Wallet");
    const result = await payAndFetch("https://councilof.ai/api/gspc", wallet as never);
    expect(result.status).toBe(200);
    expect(calls).toEqual([]);
    vi.unstubAllGlobals();
  });
});
