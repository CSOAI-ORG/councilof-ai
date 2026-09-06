/**
 * x402Wallet — pure-helper coverage (no wallet, no provider).
 *
 * The vectors below are the REAL 402, read from GET /api/free-door on
 * 2026-09-06. The previous version of this file asserted
 * `td.domain.name === "x402"`, which pinned a defect: it locked in a domain
 * that is not the token's, so every signature it blessed was unverifiable.
 */
import { describe, expect, it } from "vitest";
import {
  buildTypedData,
  chainIdFromNetwork,
  encodePaymentSignature,
  hexToBytes,
  type X402Challenge,
} from "./x402Wallet";

/** accepts[0] from the live 402, verbatim. */
const LIVE: X402Challenge = {
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31", // the payee
  amount: "0",
  resource: "/api/free-door",
  extra: { name: "USD Coin", version: "2" },
};
const SIGNER = "0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7";

describe("x402Wallet pure helpers", () => {
  it("hexToBytes round-trips", () => {
    expect(Array.from(hexToBytes("000102ff"))).toEqual([0, 1, 2, 255]);
  });

  it("encodePaymentSignature is base64url(r||s||v), 65 bytes, no padding", () => {
    const h = encodePaymentSignature(new Uint8Array(32).fill(1), new Uint8Array(32).fill(2), 27);
    expect(h).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(h.includes("=")).toBe(false);
    const bin = atob(h.replace(/-/g, "+").replace(/_/g, "/"));
    expect(bin.length).toBe(65);
    expect(bin.charCodeAt(64)).toBe(27);
  });

  it("reads the chain from the CAIP-2 network the 402 states", () => {
    expect(chainIdFromNetwork("eip155:8453")).toBe(8453);
    expect(chainIdFromNetwork(" eip155:1 ")).toBe(1);
    expect(() => chainIdFromNetwork("base-mainnet")).toThrow(/unsupported network/);
  });
});

describe("the EIP-712 domain is the TOKEN's, not ours", () => {
  const td = buildTypedData(LIVE, SIGNER);

  it("takes name and version from accepts[0].extra", () => {
    expect(td.domain.name).toBe("USD Coin");
    expect(td.domain.version).toBe("2");
    // the old hardcoded pair produced a signature no facilitator could verify
    expect(td.domain.name).not.toBe("x402");
  });

  it("uses the ASSET as verifyingContract, never the payee", () => {
    expect(td.domain.verifyingContract).toBe(LIVE.asset);
    expect(td.domain.verifyingContract).not.toBe(LIVE.payTo);
  });

  it("puts the payee in the message, where it belongs", () => {
    expect(td.message.to).toBe(LIVE.payTo);
    expect(td.message.from).toBe(SIGNER);
    expect(td.message.value).toBe("0");
  });

  it("derives the chain from the 402's network", () => {
    expect(td.domain.chainId).toBe(8453);
  });

  it("carries the canonical EIP-3009 type, in order", () => {
    expect(td.primaryType).toBe("TransferWithAuthorization");
    expect(td.types.TransferWithAuthorization.map((f) => `${f.type} ${f.name}`)).toEqual([
      "address from",
      "address to",
      "uint256 value",
      "uint256 validAfter",
      "uint256 validBefore",
      "bytes32 nonce",
    ]);
  });

  it("keeps the authorization window ordered", () => {
    expect(Number(td.message.validBefore)).toBeGreaterThanOrEqual(Number(td.message.validAfter));
  });
});

describe("it refuses to sign rather than sign something worthless", () => {
  it("throws when the 402 named no asset", () => {
    expect(() => buildTypedData({ ...LIVE, asset: undefined }, SIGNER)).toThrow(
      /named no asset|payTo is not it/,
    );
  });

  it("throws when extra carries no token name or version", () => {
    expect(() => buildTypedData({ ...LIVE, extra: null }, SIGNER)).toThrow(/name and version/);
    expect(() => buildTypedData({ ...LIVE, extra: { name: "USD Coin" } }, SIGNER)).toThrow(
      /name and version/,
    );
  });

  it("throws rather than guessing a chain", () => {
    expect(() =>
      buildTypedData({ ...LIVE, network: undefined, chainId: undefined }, SIGNER),
    ).toThrow(/refusing to guess/);
  });
});
