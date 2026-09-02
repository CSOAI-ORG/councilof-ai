/**
 * GET /api/x402 — the machine catalog of the metered rail. NO AMOUNTS HERE.
 *
 * One tier per line, one resource per tier, each with a free preview and a 402 door. Amounts
 * surface only inside a 402 challenge (accepts[]), which is how x402 states an amount — this
 * catalog says what an artefact IS and what it is NEVER, and reports the rail's honest mode
 * (challenge-only vs live) derived from env, never typed.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "./_x402_config";
import { USDC_BASE } from "./_skus";
import { CSOAI_LID } from "./_x402";

export const onRequestGet: PagesFunction<{ X402_PAY_TO?: string; X402_FACILITATOR_URL?: string }> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => `${origin}${p}`;
  const body = {
    schema: "csoai.x402-catalog/0.1",
    one_line: "Verification is free forever. Agents pay per artefact: issuance, assembly, cadence — never a grade.",
    rail: {
      ...railMode(env),
      scheme: "exact",
      network: NETWORK_CAIP2_BASE,
      asset: { symbol: USDC_BASE.symbol, contract: USDC_BASE.asset, decimals: USDC_BASE.decimals },
      pay_to: resolvePayTo(env),
      amounts: "only inside each resource's 402 challenge (accepts[].amount) — never on this catalog, never in prose",
      well_known: u("/.well-known/x402.json"),
    },
    tiers: [
      {
        tier: 1,
        id: "issuance",
        name: "Commission a signed card (request-attestation)",
        resource: u("/api/request-attestation?subject=<id>&axis=<slug>"),
        free_preview: u("/api/request-attestation?subject=<id>") + " (the 402 body carries csoai.preview: signed cards already on file)",
        deliverable: "one card-v0 leaf, surface ras.commission, ≤3KB payload, Ed25519 under did:web:csoai.org#board-attestation-1 when the Pages key is present (else sig_ed25519:null, declared)",
        never: ["a score", "a rank", "a certificate", "a MEASURED cell minted by payment"],
      },
      {
        tier: 2,
        id: "evidence_bundle",
        name: "Evidence bundle mapped to an obligation",
        resource: u("/api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<s>&bundle=1"),
        free_preview: u("/api/evidence-bundle?obligation=<id>&subject=<s>"),
        deliverable: "OSCAL 1.1.0 assessment-results of already-signed cards (observations, relevant-to) + one manifest card-v0 (surface evidence.bundle) + the existing signed pack where one exists (/packs/eu-article-50)",
        never: ["a conformity determination", "satisfied/not-satisfied findings", "a certificate"],
      },
      {
        tier: 3,
        id: "data_feed",
        name: "Signed data feed (assembly + cadence)",
        resource: u("/api/eunomia-data?feed=1"),
        free_preview: u("/api/eunomia-data"),
        deliverable: "one feed document: signed signals index, signed First-Fine Watch, root.json, card index — each block with its published signature",
        never: ["scores as a product", "a ranking", "a rating"],
        also: { proof_bundle: u("/api/proof?bundle=1"), one_inclusion_free: u("/api/proof?sha=<64-hex>") },
      },
      {
        tier: 1,
        id: "rwa_evidence",
        name: "XRPL asset evidence card (per request)",
        resource: u("/api/rwa/evidence?asset=<symbol|issuer_address>"),
        free_preview: u("/api/rwa/evidence?asset=<symbol>&preview=1") + " (unsigned state, no raw-fetch hashes; symbols at /api/xrpl)",
        deliverable: "one canonical card-v0 leaf (public.notice / csoai.eater.xrpl-issuer/0.1 — the same schema as the free public-root leaf), ≤3072 bytes: AccountRoot flags, Domain, two-way TOML check, gateway_balances obligation, holders as the reader has them, per-fetch sha256 + inputs_sha256, Ed25519 under did:web:csoai.org#board-attestation-1 when the Pages key is present",
        never: ["a rating", "a guarantee", "a verdict", "a rank", "a paywall on /api/xrpl or /root.json"],
      },
      {
        tier: 1,
        id: "witness_hash",
        name: "Witness a digest (attest what you're shown)",
        resource: u("/api/witness?sha256=<64-hex>&label=<text>") + "  |  " + u("/api/witness?url=<https public URL>") + "  |  POST " + u("/api/witness") + " (raw bytes ≤4 MiB, hashed then dropped)",
        free_preview: u("/api/witness?sha256=<64-hex>") + " (the 402 body carries csoai.preview: the digest, the fetch outcome, the TSA, the anchors, what happens)",
        free_status: u("/api/witness/status?sha256=<64-hex>"),
        deliverable: "one public.notice leaf (csoai.witness.hash/0.1) in the next hourly signed root under did:web:csoai.org#board-attestation-1 + an RFC-3161 timestamp reply over the digest from a documented public TSA + the ONE root's Rekor and OpenTimestamps anchors; queued in WITNESS_KV (503 NOT_YET when unbound — nothing charged)",
        attests: "existence of this digest at the root's as_of — nothing about its content, legality, or provenance",
        never: ["storage or republication of the bytes", "a bypass of a login, paywall, robots.txt or bot check (UNCHECKABLE, no charge)", "a verdict on the content", "a certificate", "a legal presumption"],
      },
    ],
    free_forever: [u("/gspc-verify"), u("/api/gspc"), u("/root.json"), u("/api/fines"), u("/api/proof?sha=<64-hex>"), u("/api/witness/status?sha256=<64-hex>"), u("/methodology")],
    invariants: {
      measurement_not_certification: "CSOAI LTD (UK 16939677) is an independent measurement body. It issues measurements and signed attestations, never certificates of conformity.",
      never_a_grade: "No tier sells a grade, a score, a pass/fail verdict, or a place on the board.",
      recomputable_for_free: "Every artefact is independently recomputable; a buyer pays for issuance, assembly and a durable independent signature — not for the answer.",
      no_public_price: "Amounts appear only in a 402 challenge.",
      financial_firewall: "No token, credit, or cash-settled index. Attestation is not tokenisation and confers no ownership.",
    },
    lid: CSOAI_LID,
    explainer: u("/pricing-free"),
    revenue_truth: u("/api/revenue"),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
