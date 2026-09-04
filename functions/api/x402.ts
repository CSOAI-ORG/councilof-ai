/**
 * GET /api/x402 — the machine catalog of the metered rail. NO AMOUNTS HERE.
 *
 * One tier per line, one resource per tier, each with a free preview and a 402 door. Amounts
 * surface only inside a 402 challenge (accepts[]), which is how x402 states an amount — this
 * catalog says what an artefact IS and what it is NEVER, and reports the rail's honest mode
 * (challenge-only vs live) derived from env, never typed.
 *
 * `resource` AND `free_preview` HOLD A URL AND NOTHING ELSE (0.2). This is an agent's entry
 * point, and five of seven `free_preview` values used to be a URL concatenated with an English
 * sentence — e.g. "https://…/api/witness?sha256=<64-hex> (the 402 body carries csoai.preview:
 * …)" — while `witness.resource` carried THREE URLs joined by " | " plus a parenthetical. A
 * client that did the obvious thing, `fetch(tier.free_preview)`, got a mangled URL, so the
 * documented free door was unreachable by machine on most tiers. The prose was worth keeping,
 * so it moved to a sibling `*_note`, and witness's extra doors moved to `resource_alternates`.
 * Schema went 0.1 → 0.2 because the CONTENT of published fields changed shape, not just their
 * neighbours. If you add a tier: a URL field takes a URL template, never a sentence.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "./_x402_config";
import { USDC_BASE } from "./_skus";
import { CSOAI_LID } from "./_x402";

export const onRequestGet: PagesFunction<{ X402_PAY_TO?: string; X402_FACILITATOR_URL?: string }> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => `${origin}${p}`;
  const body = {
    schema: "csoai.x402-catalog/0.2",
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
        free_preview: u("/api/request-attestation?subject=<id>"),
        free_preview_note: "the 402 body carries csoai.preview: signed cards already on file",
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
        free_preview: u("/api/rwa/evidence?asset=<symbol>&preview=1"),
        free_preview_note: "unsigned state, no raw-fetch hashes; symbols at /api/xrpl",
        deliverable: "one canonical card-v0 leaf (public.notice / csoai.eater.xrpl-issuer/0.1 — the same schema as the free public-root leaf), ≤3072 bytes: AccountRoot flags, Domain, two-way TOML check, gateway_balances obligation, holders as the reader has them, per-fetch sha256 + inputs_sha256, Ed25519 under did:web:csoai.org#board-attestation-1 when the Pages key is present",
        never: ["a rating", "a guarantee", "a verdict", "a rank", "a paywall on /api/xrpl or /root.json"],
      },
      {
        tier: 1,
        id: "witness_hash",
        name: "Witness a digest (attest what you're shown)",
        resource: u("/api/witness?sha256=<64-hex>&label=<text>"),
        resource_alternates: [
          { method: "GET", url: u("/api/witness?url=<https-public-url>"), note: "we fetch it once with our UA, honouring robots.txt" },
          { method: "POST", url: u("/api/witness"), note: "raw bytes ≤4 MiB, hashed then dropped" },
        ],
        free_preview: u("/api/witness?sha256=<64-hex>"),
        free_preview_note: "the 402 body carries csoai.preview: the digest, the fetch outcome, the TSA, the anchors, what happens",
        free_status: u("/api/witness/status?sha256=<64-hex>"),
        deliverable: "one public.notice leaf (csoai.witness.hash/0.1) in the next hourly signed root under did:web:csoai.org#board-attestation-1 + an RFC-3161 timestamp reply over the digest from a documented public TSA + the ONE root's Rekor and OpenTimestamps anchors; queued in WITNESS_KV (503 NOT_YET when unbound — nothing charged)",
        attests: "existence of this digest at the root's as_of — nothing about its content, legality, or provenance",
        never: ["storage or republication of the bytes", "a bypass of a login, paywall, robots.txt or bot check (UNCHECKABLE, no charge)", "a verdict on the content", "a certificate", "a legal presumption"],
      },
      {
        // Was `tier: 1, tier: 4` — two keys in one literal. The second silently won, so the
        // catalog published tier 4 while the source read as tier 1. Keeping 4 preserves the
        // value that has actually been served; this is a de-duplication, not a re-pricing.
        tier: 4,
        id: "provider_diff_feed",
        name: "Provider document diff feed (signed historical batch / bespoke partner feed)",
        resource: u("/api/feeds/provider-diff?history=1"),
        free_preview: u("/api/feeds/provider-diff"),
        free_preview_note: "recent diffs + latest state per target, free; leaves in /feeds/provider-diff/leaves/",
        deliverable: "every hash-only csoai.diff.provider-terms/0.1 leaf to date with its inclusion proof to the signed root, assembled; or a bespoke per-partner target list on the same method (GBP invoice: ?invoice=gbp&commissioned_by=<org>)",
        never: ["a verdict on any change", "the content of any page (never captured)", "a grade"],
      },
      {
        tier: 3,
        id: "receipts_batch",
        name: "Receipts batch — historical measurement leaves for a window (assembly)",
        resource: u("/api/receipts/batch?from=<iso>&to=<iso>"),
        free_preview: u("/api/receipts/batch?from=<iso>&to=<iso>&preview=1"),
        free_preview_note: "count, span, root count and the sha256 of the exact batch bytes — no leaves",
        deliverable: "one canonical csoai.receipts.batch/0.1 document: every card-v0 leaf with as_of in the window (≤200), each with its Merkle inclusion path and the public root(s) that carried it (from /receipts/root-history.json — the git history of root.json indexed at build time), plus one signed manifest card-v0 (surface receipts.batch) citing the batch sha256",
        recent_free: [u("/root.json"), u("/cards/<sha16>.json"), u("/api/proof?sha=<64-hex>"), u("/receipts/root-history.json")],
        honesty: "no settlement-receipt stream exists (/api/receipts/latest is UNPUBLISHED); these are measurement leaves, not payment receipts",
        never: ["a conclusion about any leaf", "a grade", "a certificate", "a settlement-receipt claim"],
      },
    ],
    // ONE free_forever. There were two keys of this name in this literal — the same defect the
    // tier comment above records for `tier: 1, tier: 4` — so the second silently won and the
    // first was dropped whole. The lost list was the only one naming /api/witness/status, a door
    // that IS free and was therefore missing from the published set: the catalog advertised 8
    // free surfaces where 9 are free. Under-claiming a free door is still a false published
    // fact, and it hides a door a buyer never has to pay for. This is the union of both lists.
    free_forever: [
      u("/gspc-verify"),
      u("/api/gspc"),
      u("/root.json"),
      u("/api/fines"),
      u("/api/proof?sha=<64-hex>"),
      u("/api/witness/status?sha256=<64-hex>"),
      u("/api/receipts/batch?from=<iso>&preview=1"),
      u("/receipts/root-history.json"),
      u("/methodology"),
    ],
    mcp: {
      url: u("/mcp"),
      free_tools: ["board_totals", "get_axis", "verify_card", "list_cards", "get_root", "get_card", "verify_inclusion"],
      paid_tools: [
        { name: "commission_card", route: u("/api/request-attestation"), sells: "issuance" },
        { name: "art50_marking_evidence", route: u("/api/art50/marking-evidence"), sells: "issuance", note: "deployed; the tool still answers NOT_DEPLOYED on any origin where the route 404s" },
        { name: "rwa_evidence", route: u("/api/rwa/evidence"), sells: "issuance", note: "deployed; the tool still answers NOT_DEPLOYED on any origin where the route 404s" },
        { name: "witness_hash", route: u("/api/witness"), sells: "independent-signature", note: "deployed; the tool still answers NOT_DEPLOYED on any origin where the route 404s" },
        { name: "receipts_batch", route: u("/api/receipts/batch"), sells: "assembly" },
      ],
      // The last clause used to read "stdio (npm csoai-gspc-mcp) stays free-only", echoing a
      // REASON given in functions/mcp/paid-tools.json that is simply wrong: "stdio has no
      // payment header". Payment does not travel as a transport header at all — x_payment is a
      // TOOL ARGUMENT, and _paid.ts:39 reads it out of args and sets X-PAYMENT itself on the
      // same-origin request. stdio can do that identically, so nothing about the transport made
      // it free. Stating a package's tool list here also guarantees drift, because that list
      // changes on someone else's release schedule and this catalog would keep asserting the
      // old one. So the catalog now states the MECHANISM, which cannot go stale.
      how: "tools/call without x_payment → the route's 402 challenge as structuredContent (accepts[], PAYMENT-REQUIRED); pay from your wallet; call again with x_payment. Payment travels as the x_payment ARGUMENT and this door sets the X-PAYMENT header itself, so carrying a paid tool is a packaging choice, never a property of the transport. Every paid tool is measurement, not certification — no tool carries or awards a trust label of any kind. The catalogue (tools/list) is free.",
    },
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
