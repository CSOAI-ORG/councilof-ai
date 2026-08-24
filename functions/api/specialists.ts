// /api/specialists — the specialist team (one OOWM/OWEM per axis/regulator/industry/product).
// A signed, deterministic record of the specialist ecosystem: each specialist's role,
// model, MCP/tooling surface, and training signal. Measurement, never certification.
// Signed at the edge with did:web:csoai.org#board-attestation-1.
const TEAM = {
  schema: "csoai.specialist-team/0.2",
  as_of: "2026-08-24",
  what: "The specialist team — one OOWM/OWEM specialist per axis, regulator, industry, and product. Each is a trainable cluster wired to the estate, exposing a MCP/tooling surface to the Council OS. Measurement, never certification.",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  classes: ["axis", "regulator", "industry", "product"],
  specialists: [
    { id: "gov", class: "axis", model: "qwen3:8b", role: "governance specialist", mcp: "estate:governance", signal: "/register/register-index" },
    { id: "safety", class: "axis", model: "council-oowm:latest", role: "safety/containment specialist", mcp: "estate:jail", signal: "/jail" },
    { id: "knowledge", class: "axis", model: "phi4:14b", role: "factual/general knowledge specialist", mcp: "estate:knowledge", signal: "/register/model-measurements-index" },
    { id: "prv", class: "axis", model: "mistral:7b", role: "privacy specialist", mcp: "estate:privacy", signal: "/register/register-index" },
    { id: "swarm", class: "axis", model: "qwen2.5:7b", role: "swarm/coordination specialist", mcp: "estate:swarm", signal: "/cross" },
    { id: "regulator-uk", class: "regulator", model: "mistral:7b", role: "UK regulator specialist", mcp: "estate:regulation", signal: "/register/register-index" },
    { id: "industry-finance", class: "industry", model: "phi4:14b", role: "financial-AI specialist", mcp: "estate:financial-ai", signal: "/register/financial-ai-index" },
    { id: "product-games", class: "product", model: "qwen3:4b", role: "game/arena measurement specialist", mcp: "estate:games", signal: "/games/gspc" },
  ],
  honesty: "Measurement, never certification. Every specialist's signal is a real estate surface; each is a trainable cluster, not a claim about a regulator or product.",
  refuses: "No certification, no ranking of regulators, no endorsement of any model or product. UNMEASURED stays honest.",
};

export const onRequestGet: PagesFunction = async (context) => {
  const body: Record<string, unknown> = { ...TEAM };
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this specialist-team feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        verify: "fetch /.well-known/did.json → #board-attestation-1 → recompute canonical JSON and verify Ed25519",
      };
    } catch {
      body.signature = { error: "signing key present but unusable — no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" },
  });
};
