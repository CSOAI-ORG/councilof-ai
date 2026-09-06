/**
 * x402Wallet.test.ts — pure-helper coverage (no wallet, no provider).
 */
import { describe, expect, it } from "vitest";
import {
  buildTypedData,
  encodePaymentSignature,
  hexToBytes,
} from "./x402Wallet";

describe("x402Wallet pure helpers", () => {
  it("hexToBytes round-trips", () => {
    const b = hexToBytes("000102ff");
    expect(Array.from(b)).toEqual([0, 1, 2, 255]);
  });

  it("encodePaymentSignature is base64url(r||s||v), 65 bytes, no padding", () => {
    const r = new Uint8Array(32).fill(1);
    const s = new Uint8Array(32).fill(2);
    const h = encodePaymentSignature(r, s, 27);
    expect(h).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(h.includes("=")).toBe(false);
    const bin = atob(h.replace(/-/g, "+").replace(/_/g, "/"));
    expect(bin.length).toBe(65);
    expect(bin.charCodeAt(64)).toBe(27);
  });

  it("buildTypedData carries the EIP-3009 terms from the challenge", () => {
    const td = buildTypedData(
      { payTo: "0x2126abcde0000000000000000000000000ae31", amount: "2000000", resource: "/api/receipts/batch" },
      "0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7",
    );
    expect(td.primaryType).toBe("TransferWithAuthorization");
    expect(td.types.TransferWithAuthorization.length).toBe(6);
    expect(td.message.from).toBe("0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7");
    expect(td.message.to).toBe("0x2126abcde0000000000000000000000000ae31");
    expect(td.message.value).toBe("2000000");
    expect(td.domain.name).toBe("x402");
    expect(td.domain.chainId).toBe(8453);
    expect(Number(td.message.validBefore)).toBeGreaterThanOrEqual(Number(td.message.validAfter));
  });
});
