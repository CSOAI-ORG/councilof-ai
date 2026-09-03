// functions/api/_x402_config.ts — the ONE place the x402 rail's money destination and token
// domain are declared. Every metered endpoint reads these through _x402.ts; nothing else
// hardcodes an address.
//
// PAY-TO PROVENANCE (bytes adjudicate — this is where the address was read from, not invented):
//   · the owner's shell config `X402_PAY_TO` (2026-09-02),
//   · SOVOS/X402-SETUP-MONEY-IN-2026-08-23.md  ("BASE_L2_USDC_RECEIVER=…", audit: "receiver is live in 3 places"),
//   · SOVOS/X402-METAMASK-REVENUE-SHARE-2026-08-23.md ("the receiving MetaMask / Base-L2 USDC wallet"),
//   · RALPH_STANDING_ORDERS_2026-08-24.md ("Money-in rail: X402_USDC_RECEIVER=…").
// All four agree. It is a PUBLIC receiving address (a wallet's public key hash) — no private key
// is or ever will be in this repo. If the owner rotates wallets, set the Cloudflare Pages env
// var `X402_PAY_TO` (Settings → Environment variables → Production) and it wins over this default
// with no code change.
//
// FACILITATOR: deliberately NOT defaulted. A facilitator is the third party that submits the
// EIP-3009 transferWithAuthorization on-chain (it pays gas; it cannot redirect funds — the
// authorization names payTo). Turning settlement on is an owner decision (standing order: "do not
// fire a real settlement without owner OK"), so the rail stays fail-closed until
// `X402_FACILITATOR_URL` is set. Known-good values are documented in docs/REVENUE-LOOPS.md.

/** Estate USDC receiving address on Base (public). Env `X402_PAY_TO` overrides. */
export const ESTATE_PAY_TO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31";

/**
 * EIP-712 domain of USDC on Base. The x402 `exact` scheme signs a transferWithAuthorization
 * under the TOKEN's domain, and clients read `accepts[].extra.name/version` to build it. USDC's
 * contract name is "USD Coin" (version "2") — advertising "USDC" here made every client signature
 * unverifiable, which is why the rail could never have settled even with a facilitator.
 */
export const USDC_BASE_EIP712 = { name: "USD Coin", version: "2" } as const;

/** x402 v1 clients/facilitators name Base by slug, v2 by CAIP-2. Both are the same chain. */
export const NETWORK_SLUG_BASE = "base";
export const NETWORK_CAIP2_BASE = "eip155:8453";

const HEX40 = /^0x[0-9a-fA-F]{40}$/;

/**
 * resolvePayTo — env override first, then the estate default. Returns null only if BOTH are
 * malformed (a typo in an env var must not silently route funds to the default).
 */
export function resolvePayTo(env: { X402_PAY_TO?: string } = {}): string | null {
  const fromEnv = (env.X402_PAY_TO || "").trim();
  if (fromEnv) return HEX40.test(fromEnv) ? fromEnv : null;
  return HEX40.test(ESTATE_PAY_TO) ? ESTATE_PAY_TO : null;
}

/** True when a facilitator URL is provisioned — the single switch between challenge-only and live. */
export function facilitatorUrl(env: { X402_FACILITATOR_URL?: string } = {}): string {
  return (env.X402_FACILITATOR_URL || "").trim().replace(/\/$/, "");
}

/**
 * Honest rail mode, derived from env — never typed by hand on any surface.
 *
 * READ THIS BEFORE USING `pay_to_configured` AS EVIDENCE. It is env-INDEPENDENT: payTo falls back
 * to the ESTATE_PAY_TO constant above, so `pay_to_configured` is true on a host with nothing bound
 * at all (see the railMode({}) case in _x402.test.ts). It answers "is there an address to pay?",
 * never "is an env var set here?". Two readers have already inferred a binding from it and
 * concluded the rail was half-configured across environments.
 *
 * `facilitator_configured` is the field that actually varies with env — it has no code default,
 * by deliberate design (see the FACILITATOR note at the top of this file). Any check comparing
 * environments, or asserting that a deployment has the rail switched on, must read that one.
 *
 * A worked example of the confusion, for the next reader: preview deployments
 * (master./production.<project>.pages.dev) legitimately report challenge-only while the apex
 * reports live, because the facilitator secret is set on production only — on purpose, since a
 * preview build able to settle real mainnet USDC would put a live money rail on every branch.
 * Compare the APEX, per the rule in scripts/deploy-site.sh.
 */
export function railMode(env: { X402_PAY_TO?: string; X402_FACILITATOR_URL?: string } = {}): {
  mode: "live" | "challenge-only";
  pay_to_configured: boolean;
  facilitator_configured: boolean;
  note: string;
} {
  const pay = !!resolvePayTo(env);
  const fac = !!facilitatorUrl(env);
  const live = pay && fac;
  return {
    mode: live ? "live" : "challenge-only",
    pay_to_configured: pay,
    facilitator_configured: fac,
    note: live
      ? "A settled receipt (facilitator /verify then /settle) unlocks the paid artefact. Verification of every artefact stays free."
      : "402 challenges are complete (asset, amount, payTo) but no facilitator is provisioned, so no receipt can settle and no paid artefact is granted. Nothing is charged. Verification stays free.",
  };
}

/** Map legacy network names to CAIP-2 (CDP Bazaar validate requires CAIP-2). */
export function toCaip2Network(network: string): string {
  const n = (network || "").trim().toLowerCase();
  if (n === "base") return "eip155:8453";
  if (n === "base-sepolia") return "eip155:84532";
  if (n.includes(":")) return network.trim();
  return network || NETWORK_CAIP2_BASE;
}

/** Map CAIP-2 back to the v1 slug a v1 client/facilitator expects ("eip155:8453" → "base"). */
export function toLegacyNetwork(network: string): string {
  const n = (network || "").trim().toLowerCase();
  if (n === NETWORK_CAIP2_BASE || n === "base") return NETWORK_SLUG_BASE;
  if (n === "eip155:84532" || n === "base-sepolia") return "base-sepolia";
  return network;
}
