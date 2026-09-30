// SPDX-License-Identifier: Apache-2.0
/**
 * What kind of subject was asked about. Four inputs, one rule each, no guessing beyond that:
 *   64 hex                     -> card        (a signed measurement card id)
 *   claimreg-...               -> claim       (a claim-maintenance registry id)
 *   http(s) URL                -> agent_card when the path names an agent card, else mcp_server
 *   anything else, non-empty   -> model       (a model id as a signed card records it)
 */
export function classifySubject(raw) {
  const input = String(raw ?? "").trim();
  if (!input) return { input, kind: "none" };
  if (/^[0-9a-f]{64}$/i.test(input)) return { input: input.toLowerCase(), kind: "card" };
  if (/^claimreg-[a-z0-9-]{3,120}$/i.test(input)) return { input, kind: "claim" };
  if (/^https?:\/\//i.test(input)) {
    let u;
    try {
      u = new URL(input);
    } catch {
      return { input, kind: "invalid" };
    }
    const agent = /(\/\.well-known\/agent(-card)?\.json|agent-card\.json|\/agent\.json)$/i.test(u.pathname);
    return { input: u.href.replace(/\/$/, ""), kind: agent ? "agent_card" : "mcp_server" };
  }
  if (input.length > 200 || /[\s<>"]/.test(input)) return { input, kind: "invalid" };
  return { input, kind: "model" };
}

/** Board axis name for a card axis: the signed cards spell the GSPC axes "gspc-<axis>". */
export function boardAxisForCard(axis) {
  const a = String(axis ?? "");
  return a.startsWith("gspc-") ? a.slice(5) : a;
}

/** Normalise a model id the way the models-measured list does: route prefix, digest and ":latest" removed. */
export function normaliseModelId(id) {
  return String(id ?? "")
    .trim()
    .replace(/^(ollama|t4):/, "")
    .replace(/@sha256:[0-9a-f]+$/, "")
    .replace(/:latest$/, "");
}
