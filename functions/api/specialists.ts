/**
 * GET /api/specialists — the 13-specialist catapult (GW.1), served LIVE + signed.
 *
 * This is an honest PROXY of the estate's signed specialist-team feed
 * (https://csoai-sovereign.pages.dev/api/specialists.json), which is emitted by
 * the sim-world-estate public-api-generator.mjs (schema csoai.specialist-team/0.1,
 * count 13, record_type measured-current-state, not_a_certification:true,
 * endorsement:none) and signed Ed25519 against the estate key
 * (~/.sov33_session_ed25519.key). We do NOT re-sign here: we pass the exact
 * signed body through so a stranger can recompute body_sha256 + Ed25519 and get
 * the same answer. Measurement, never certification.
 *
 * Sourced (not re-authored) — if the sovereign feed is momentarily unreachable we
 * fall back to an embedded signed snapshot of the same payload, which still
 * recomputes (body_sha256 + sig_b64 are the signed bytes literally).
 */

interface SpecialistTeam {
  schema: string;
  record_type: string;
  as_of: string;
  count: number;
  not_a_certification: boolean;
  endorsement: string;
  note?: string;
  specialists: Array<{ id: string; class: string; model: string; role: string; signal: string; ready: boolean }>;
  body_sha256: string;
  sig_algo: string;
  sig_b64: string;
}

// Embedded signed snapshot (as of 2026-08-25T15:55:14.240Z, deploy 00f15b09).
// body_sha256 + Ed25519 recompute against the estate key. Never re-signed here.
const SNAPSHOT: SpecialistTeam = {
  schema: "csoai.specialist-team/0.1",
  record_type: "measured-current-state",
  as_of: "2026-08-25T15:55:14.240Z",
  count: 13,
  not_a_certification: true,
  endorsement: "none",
  note: "The 13-specialist catapult (GW.1): one OOWM/OWEM specialist per axis/regulator/industry/product, each wired to a real signed estate signal. Measurement, never certification. Firewall 2 holds — adapters train on axis knowledge packs + methodology, never eval outcomes.",
  specialists: [
    { id: "gov", class: "axis", model: "qwen3:8b", role: "governance specialist", signal: "/register/register-index", ready: true },
    { id: "safety", class: "axis", model: "council-oowm:latest", role: "safety/containment specialist", signal: "/jail", ready: true },
    { id: "knowledge", class: "axis", model: "phi4:14b", role: "factual/general knowledge specialist", signal: "/register/model-measurements-index", ready: true },
    { id: "prv", class: "axis", model: "mistral:7b", role: "privacy specialist", signal: "/register/register-index", ready: true },
    { id: "swarm", class: "axis", model: "qwen2.5:7b", role: "swarm/coordination specialist", signal: "/cross", ready: true },
    { id: "provenance", class: "axis", model: "gemma3:12b", role: "provenance/source-attribution specialist", signal: "/register/boards-pod-index", ready: true },
    { id: "conformance", class: "axis", model: "qwen3:4b", role: "protocol-conformance specialist", signal: "/register/x402-a2a-conformance", ready: true },
    { id: "care", class: "axis", model: "qwen2.5:7b", role: "care/values-alignment specialist", signal: "/compliance", ready: true },
    { id: "regulator-uk", class: "regulator", model: "mistral:7b", role: "UK regulator specialist", signal: "/register/register-index", ready: true },
    { id: "regulator-eu", class: "regulator", model: "qwen3:8b", role: "EU AI-Act regulator specialist", signal: "/register/register-index", ready: true },
    { id: "industry-finance", class: "industry", model: "phi4:14b", role: "financial-AI specialist", signal: "/register/financial-ai-index", ready: true },
    { id: "industry-gaming", class: "industry", model: "qwen3:4b", role: "game/arena measurement specialist", signal: "/games/gspc", ready: true },
    { id: "product-payments", class: "product", model: "qwen2.5:7b", role: "x402/payments specialist", signal: "/register/x402-a2a-conformance", ready: true },
  ],
  body_sha256: "61789f7082a3186b4fcb6356b4509789585a1202e7909f5de62a50de51a4e04d",
  sig_algo: "ed25519",
  sig_b64: "NQT9uaHt6ye/MwiLzX20/rLT41VM6Xv5nVGKCxxQdVJajuB4OqwKHKHhcdpYqIaMReH9YtEvBczwLms3Q29cBw==",
};

const SOVEREIGN_FEED = "https://csoai-sovereign.pages.dev/api/specialists.json";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};

export const onRequestGet: PagesFunction = async () => {
  // Prefer the live signed estate feed (single source of truth); fall back to the
  // embedded signed snapshot, which recomputes identically. Never re-signed here.
  try {
    const r = await fetch(SOVEREIGN_FEED, { headers: { "user-agent": "csoai-specialists/0.1" } });
    if (r.ok) {
      const j = (await r.json()) as SpecialistTeam;
      if (j.schema === "csoai.specialist-team/0.1" && j.count === 13 && j.body_sha256 && j.sig_b64) {
        return new Response(JSON.stringify(j, null, 2), { headers: JSON_HEADERS });
      }
    }
  } catch {
    /* honest fallback below */
  }
  return new Response(JSON.stringify(SNAPSHOT, null, 2), {
    headers: { ...JSON_HEADERS, "x-csoai-source": "embedded-signed-snapshot" },
  });
};
