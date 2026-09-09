import { afterEach, describe, expect, it } from "vitest";
import {
  buildTypedData,
  chainIdFromNetwork,
  discoverEIP6963,
  encodePaymentPayload,
  formatPaymentAmount,
  hexToBytes,
  signX402Challenge,
  type EIP1193Provider,
  type X402Challenge,
  type X402PaymentPayload,
} from "./x402Wallet";
import { toDialectPayload } from "../../../functions/api/_x402_negotiate";

const ACCEPTED = {
  scheme: "exact",
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  amount: "20000",
  maxTimeoutSeconds: 300,
  extra: { name: "USD Coin", version: "2", decimals: 6, symbol: "USDC" },
} as const;
const RESOURCE = {
  url: "https://councilof.ai/api/request-attestation",
  description: "A scoped attestation commission.",
  mimeType: "application/json",
};
const LIVE: X402Challenge = {
  x402Version: 2,
  accepted: ACCEPTED,
  resourceInfo: RESOURCE,
  extensions: { bazaar: { info: { input: { type: "http" } } } },
  network: ACCEPTED.network,
  asset: ACCEPTED.asset,
  payTo: ACCEPTED.payTo,
  amount: ACCEPTED.amount,
  resource: RESOURCE.url,
  maxTimeoutSeconds: ACCEPTED.maxTimeoutSeconds,
  extra: ACCEPTED.extra,
  nonce: `0x${"12".repeat(32)}`,
};
const SIGNER = "0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7";
const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined)
    delete (globalThis as { window?: Window }).window;
  else
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
});

describe("EIP-6963 discovery", () => {
  it("hears a provider that announces synchronously during requestProvider", async () => {
    const events = new EventTarget();
    const provider: EIP1193Provider = { request: async () => null };
    const detail = {
      info: {
        rdns: "io.test.wallet",
        uuid: "test-wallet",
        name: "Test Wallet",
      },
      provider,
    };
    const fakeWindow = {
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent(event: Event) {
        if (event.type === "eip6963:requestProvider") {
          const announce = Object.assign(
            new Event("eip6963:announceProvider"),
            { detail },
          );
          events.dispatchEvent(announce);
        }
        return true;
      },
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: fakeWindow,
    });

    await expect(discoverEIP6963(25)).resolves.toBe(detail);
  });
});

describe("x402 v2 payload conformance", () => {
  it("base64-encodes JSON that the backend's JSON.parse(atob(header)) path accepts", () => {
    const payload: X402PaymentPayload = {
      x402Version: 2,
      scheme: "exact",
      network: ACCEPTED.network,
      resource: RESOURCE,
      accepted: ACCEPTED,
      payload: {
        signature: `0x${"11".repeat(65)}`,
        authorization: {
          from: SIGNER,
          to: ACCEPTED.payTo,
          value: ACCEPTED.amount,
          validAfter: "1",
          validBefore: "301",
          nonce: `0x${"22".repeat(32)}`,
        },
      },
    };
    const header = encodePaymentPayload(payload);
    expect(header).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(JSON.parse(atob(header))).toEqual(payload);
  });

  it("uses a mock wallet to produce the full exact/EVM envelope, not raw signature bytes", async () => {
    const calls: string[] = [];
    let signedTypedData: unknown = null;
    const provider: EIP1193Provider = {
      async request({ method, params }) {
        calls.push(method);
        if (method === "eth_requestAccounts") return [SIGNER];
        if (method === "eth_chainId") return "0x2105";
        if (method === "eth_signTypedData_v4") {
          signedTypedData = JSON.parse(String(params[1]));
          return `0x${"ab".repeat(64)}1b`;
        }
        throw new Error(`unexpected method ${method}`);
      },
    };
    const signed = await signX402Challenge(provider, { ...LIVE, nonce: null });
    const parsed = JSON.parse(atob(signed.header)) as X402PaymentPayload;

    expect(calls).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "eth_signTypedData_v4",
    ]);
    expect(parsed).toEqual(signed.payload);
    expect(signed.payload.accepted).toBe(ACCEPTED);
    expect(signed.payload.resource).toBe(RESOURCE);
    expect(parsed.extensions).toEqual(LIVE.extensions);
    expect(parsed.scheme).toBe("exact");
    expect(parsed.network).toBe("eip155:8453");
    expect(parsed.payload.signature).toBe(`0x${"ab".repeat(64)}1b`);
    expect(parsed.payload.authorization.nonce).toMatch(/^0x[0-9a-f]{64}$/);
    expect(
      Number(parsed.payload.authorization.validBefore) -
        Number(parsed.payload.authorization.validAfter),
    ).toBe(300);
    expect((signedTypedData as { message: unknown }).message).toEqual(
      parsed.payload.authorization,
    );

    // Production currently negotiates PayAI's proven v1 dialect first. These
    // challenge-derived compatibility fields let its adapter downgrade the
    // transport while leaving the signed authorization byte-for-field intact.
    const downgraded = toDialectPayload(
      parsed as unknown as Record<string, unknown>,
      1,
    );
    expect(downgraded).toMatchObject({
      x402Version: 1,
      scheme: "exact",
      network: "base",
    });
    expect(downgraded.payload).toEqual(parsed.payload);
  });
});

describe("typed authorization terms", () => {
  const typed = buildTypedData(LIVE, SIGNER);

  it("uses the token domain and exact accepted terms", () => {
    expect(typed.domain).toEqual({
      name: "USD Coin",
      version: "2",
      chainId: 8453,
      verifyingContract: ACCEPTED.asset,
    });
    expect(typed.message.to).toBe(ACCEPTED.payTo);
    expect(typed.message.value).toBe(ACCEPTED.amount);
    expect(typeof typed.message.validAfter).toBe("string");
    expect(typeof typed.message.validBefore).toBe("string");
  });

  it("uses the challenge timeout, not a one-hour default", () => {
    expect(
      Number(typed.message.validBefore) - Number(typed.message.validAfter),
    ).toBe(300);
  });

  it("requires bytes32 nonces and rejects UUID-shaped values", () => {
    expect(typed.message.nonce).toBe(LIVE.nonce);
    expect(() =>
      buildTypedData({ ...LIVE, nonce: crypto.randomUUID() }, SIGNER),
    ).toThrow(/32-byte/);
  });

  it("refuses expired challenge terms", () => {
    expect(() => buildTypedData({ ...LIVE, expires: 0 }, SIGNER)).toThrow(
      /expired/,
    );
  });

  it("refuses incomplete, non-v2, or unsupported challenge terms", () => {
    expect(() =>
      buildTypedData({ ...LIVE, accepted: undefined }, SIGNER),
    ).toThrow(/complete x402 v2/);
    expect(() => buildTypedData({ ...LIVE, x402Version: 1 }, SIGNER)).toThrow(
      /complete x402 v2/,
    );
    expect(() =>
      buildTypedData(
        { ...LIVE, accepted: { ...ACCEPTED, scheme: "other" } },
        SIGNER,
      ),
    ).toThrow(/unsupported payment scheme/);
  });
});

describe("human-readable exact amount", () => {
  it("renders decimals without floating-point rounding and retains atomic units", () => {
    expect(formatPaymentAmount(LIVE)).toBe("0.02 USDC (20000 atomic units)");
  });

  it("falls back to atomic units when token decimals are absent", () => {
    expect(
      formatPaymentAmount({
        ...LIVE,
        accepted: { ...ACCEPTED, extra: { name: "USD Coin", version: "2" } },
      }),
    ).toBe("20000 atomic units");
  });
});

describe("small helpers", () => {
  it("parses CAIP-2 chain IDs and validates hex", () => {
    expect(chainIdFromNetwork(" eip155:8453 ")).toBe(8453);
    expect(() => chainIdFromNetwork("base-mainnet")).toThrow(
      /unsupported network/,
    );
    expect(Array.from(hexToBytes("000102ff"))).toEqual([0, 1, 2, 255]);
    expect(() => hexToBytes("0xz1")).toThrow(/invalid hex/);
  });

  it("refuses a malformed wallet chain id before requesting a signature", async () => {
    const provider: EIP1193Provider = {
      async request({ method }) {
        if (method === "eth_requestAccounts") return [SIGNER];
        if (method === "eth_chainId") return "not-a-chain";
        throw new Error(`unexpected method ${method}`);
      },
    };
    await expect(signX402Challenge(provider, LIVE)).rejects.toThrow(
      /malformed chain id/,
    );
  });
});
