/**
 * PHASE A. The Pay button replaces "paste the wallet-signed x402 payload".
 * These cover the classification the buyer actually sees, and the refusal to
 * sign a challenge whose domain cannot be built correctly.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyPayError } from "./X402PayButton";
import { buildTypedData, type X402Challenge } from "@/lib/x402Wallet";

const src = readFileSync(resolve(__dirname, "X402PayButton.tsx"), "utf8");

const LIVE: X402Challenge = {
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  amount: "0",
  resource: "/api/free-door",
  extra: { name: "USD Coin", version: "2" },
};

describe("the three error states a buyer can hit", () => {
  it("a declined signature is the buyer's choice, not a failure", () => {
    const s = classifyPayError({ code: 4001, message: "User rejected the request." });
    expect(s.kind).toBe("rejected");
    if (s.kind === "rejected") {
      expect(s.detail).toMatch(/nothing was sent and nothing was charged/i);
    }
  });

  it("recognises a rejection by message when no code is given", () => {
    expect(classifyPayError(new Error("User denied message signature")).kind).toBe("rejected");
  });

  it("a chain mismatch says which chain, and what to do", () => {
    const s = classifyPayError(
      new Error("x402Wallet: wallet is on chain 1, the 402 requires 8453. Switch network and try again."),
    );
    expect(s.kind).toBe("wrong-network");
    if (s.kind === "wrong-network") expect(s.detail).toContain("8453");
  });

  it("a re-issued 402 is rendered as not settled", () => {
    expect(src).toContain('kind: "reissued"');
    expect(src).toMatch(/answered 402 again[\s\S]{0,120}nothing was settled/i);
  });

  it("renders each state with its own testid so it can be screenshotted", () => {
    for (const id of [
      "x402-wrong-network",
      "x402-rejected",
      "x402-reissued",
      "x402-no-wallet",
      "x402-paid",
    ]) {
      expect(src).toContain(id);
    }
  });
});

describe("it will not sign something worthless", () => {
  it("builds the domain BEFORE asking the buyer to approve", () => {
    const build = src.indexOf("buildTypedData(challenge");
    const sign = src.indexOf("signX402Challenge(provider");
    expect(build).toBeGreaterThan(-1);
    expect(sign).toBeGreaterThan(build);
  });

  it("the build it runs first throws on a domain-less 402", () => {
    expect(() => buildTypedData({ ...LIVE, asset: undefined }, "0x0")).toThrow();
    expect(() => buildTypedData({ ...LIVE, extra: null }, "0x0")).toThrow();
  });
});

describe("terms come from the door, never from the page", () => {
  it("renders the challenge's own amount, payee and token", () => {
    expect(src).toContain("{challenge.amount}");
    expect(src).toContain("{challenge.payTo}");
    expect(src).toContain("challenge.extra?.name");
  });

  it("states no price of its own and names no processor", () => {
    const body = src.replace(/^[\s\S]*?\*\//, "");
    expect(body).not.toMatch(/£|\$\d|\bUSD\b(?! Coin)/);
    expect(body).not.toMatch(/stripe|paypal|adyen|braintree/i);
    expect(body).toContain("Pay-as-you-go x402 at the 402.");
  });
});

/*
 * NOT ASSERTED HERE, deliberately: that ToolRunner mounts this button.
 *
 * ToolRunner pays over POST /mcp, where x402 is ARGUMENT-carried — the signed
 * payload goes in the tool's `x_payment` argument, not in a PAYMENT-SIGNATURE
 * header to a door. So wiring this button there needs a challenge parsed out of
 * an MCP tool result, and that path cannot be exercised without a wallet and a
 * real metered call. Rather than ship a fragile integration and a test that
 * asserts markup instead of behaviour, ToolRunner is left as it is and the gap
 * is recorded in the PR.
 */
