import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyPayError } from "./X402PayButton";
import { challengeFromResult } from "./ToolRunner";

const buttonSource = readFileSync(
  resolve(__dirname, "X402PayButton.tsx"),
  "utf8",
);
const runnerSource = readFileSync(resolve(__dirname, "ToolRunner.tsx"), "utf8");

describe("buyer-visible payment states", () => {
  it("classifies a declined wallet signature as an uncharged cancellation", () => {
    const state = classifyPayError({
      code: 4001,
      message: "User rejected the request.",
    });
    expect(state.kind).toBe("rejected");
    if (state.kind === "rejected")
      expect(state.detail).toMatch(/nothing was charged/i);
  });

  it("makes review a separate click before wallet discovery", () => {
    expect(buttonSource).toContain('kind: "reviewing"');
    expect(buttonSource).toContain("Confirm the exact payment");
    expect(buttonSource).toContain(
      'onClick={() => setState({ kind: "reviewing" })}',
    );
    const confirmFunction = buttonSource.indexOf(
      "async function confirmAndPay",
    );
    const discover = buttonSource.indexOf("discoverEIP6963()", confirmFunction);
    expect(confirmFunction).toBeGreaterThan(-1);
    expect(discover).toBeGreaterThan(confirmFunction);
  });

  it("shows exact price, recipient, network and resource in the confirmation", () => {
    expect(buttonSource).toContain("{price}");
    expect(buttonSource).toContain("challenge.accepted?.payTo");
    expect(buttonSource).toContain("challenge.accepted?.network");
    expect(buttonSource).toContain("challenge.resourceInfo?.url");
    expect(buttonSource).toMatch(/Cancel leaves the job\s+unpaid/);
  });

  it("does not call a resource as a bare GET from the payment button", () => {
    expect(buttonSource).not.toMatch(/\bfetch\s*\(/);
    expect(buttonSource).toContain("executePayment(signature.header)");
  });

  it("distinguishes delivery from settlement evidence", () => {
    expect(buttonSource).toContain("Boolean(execution.paymentResponse)");
    expect(buttonSource).toContain("PAYMENT-RESPONSE settlement evidence");
    expect(buttonSource).toMatch(
      /no PAYMENT-RESPONSE[\s\S]*Do not treat this as a confirmed settlement/,
    );
    expect(buttonSource).toMatch(/PAYMENT_REQUIRED again[\s\S]*not accepted/);
  });
});

describe("ToolRunner paid retry", () => {
  it("preserves the selected v2 accepted, resource and extensions objects", () => {
    const accepted = {
      scheme: "exact",
      network: "eip155:8453",
      amount: "20000",
      asset: "0xasset",
      payTo: "0xpayee",
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2", decimals: 6, symbol: "USDC" },
    };
    const resource = {
      url: "https://councilof.ai/api/request-attestation",
      description: "Scoped commission",
      mimeType: "application/json",
    };
    const extensions = { bazaar: { info: { input: { type: "http" } } } };
    const challenge = challengeFromResult({
      ok: true,
      text: "PAYMENT_REQUIRED",
      state: "runtime_observed",
      structuredContent: {
        status: "PAYMENT_REQUIRED",
        payment_required: {
          x402Version: 2,
          accepted: null,
          resource,
          accepts: [accepted],
          extensions,
        },
      },
    });
    expect(challenge?.accepted).toBe(accepted);
    expect(challenge?.resourceInfo).toBe(resource);
    expect(challenge?.extensions).toBe(extensions);
    expect(challenge?.maxTimeoutSeconds).toBe(300);
  });

  it("retries the same MCP tool with original typed args plus the encoded payload", () => {
    expect(runnerSource).toMatch(
      /async function executePayment\(\s*paymentHeader: string/,
    );
    expect(runnerSource).toMatch(
      /await callTool\(\s*active\.name,\s*\{\s*\.\.\.parsed\.args,\s*x_payment: paymentHeader,?\s*\}/,
    );
    expect(runnerSource).toContain("executePayment={executePayment}");
  });

  it("renders the returned deliverable instead of putting its body in x_payment", () => {
    expect(runnerSource).not.toContain(
      'onPaid={(body) => setField("x_payment", body)}',
    );
    expect(runnerSource).toContain(
      "setOutput({ result, observedAt: new Date().toISOString() })",
    );
    expect(runnerSource).toContain('if (outcome === "DELIVERED")');
    expect(runnerSource).toContain("structured.payment_response_header");
  });
});

describe("terms are challenge-derived", () => {
  it("contains no hard-coded amount or payment processor", () => {
    const implementation = buttonSource.replace(/^[\s\S]*?\*\//, "");
    expect(implementation).not.toMatch(/£|\$\d/);
    expect(implementation).not.toMatch(/stripe|paypal|adyen|braintree/i);
    expect(implementation).toContain(
      "Exact terms come from the route's x402 v2 challenge",
    );
  });
});
