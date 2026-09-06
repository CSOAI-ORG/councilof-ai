/**
 * GET /api/x402 — the machine catalog of the metered rail. NO AMOUNTS HERE.
 *
 * One resource per entry, each with a free preview and a 402 door. Amounts
 * surface only inside a 402 challenge (accepts[]), which is how x402 states an amount — this
 * catalog says what an artefact IS and what it is NEVER, and reports the rail's honest mode
 * (challenge-only vs live) derived from env, never typed.
 *
 * `resource` AND `free_preview` HOLD A URL AND NOTHING ELSE (0.2). This is an agent's entry
 * point, and five of seven `free_preview` values used to be a URL concatenated with an English
 * sentence — e.g. "https://…/api/witness?sha256=<64-hex> (the 402 body carries csoai.preview:
 * …)" — while `witness.resource` carried THREE URLs joined by " | " plus a parenthetical. A
 * client that did the obvious thing, `fetch(entry.free_preview)`, got a mangled URL, so the
 * documented free door was unreachable by machine on most entries. Prose on surviving entries
 * moved to sibling `*_note` fields; the witness entry is intentionally absent while paid
 * issuance is quarantined pre-release.
 * Schema went 0.1 → 0.2 because the CONTENT of published fields changed shape, not just their
 * neighbours. If you add an entry: a URL field takes a URL template, never a sentence.
 *
 * 0.2 → 0.3: the published key was `tiers`, and every entry carried a `tier: N` ordinal. The
 * owner ruled on 2026-09-06 that no surface publishes tiers — everything is free or
 * pay-as-you-go x402 at the 402. This catalog is the MACHINE-readable one, the surface a Bazaar
 * indexer reads and re-presents to a buyer, so a ladder here travels further than one on a page.
 * The ordinal also described nothing: the six entries were numbered 1, 2, 3, 1, 4, 3 — not
 * unique, not ordered, and it had already produced one silent bug (see provider_diff_feed). It
 * is removed rather than renamed. The only readers were this repository's own tests
 * (x402-catalogue-urls.test.ts, metered-endpoints.test.ts), moved to `resources` with it; a
 * search for `.tiers` across client, functions, scripts and public found no other consumer.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "./_x402_config";
import { USDC_BASE } from "./_skus";
import { CSOAI_LID } from "./_x402";
import { OFFER_RECEIPT_SPEC_SHA, X402_SIGNER_KID } from "./_x402_offer";

export const onRequestGet: PagesFunction<{ X402_PAY_TO?: string; X402_FACILITATOR_URL?: string }> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => `${origin}${p}`;
  const body = {
    schema: "csoai.x402-catalog/0.3",
    one_line: "Verification is free forever. Agents pay per artefact: issuance, assembly, cadence — never a grade.",
    rail: {
      ...railMode(env),
      scheme: "exact",
      network: NETWORK_CAIP2_BASE,
      asset: { symbol: USDC_BASE.symbol, contract: USDC_BASE.asset, decimals: USDC_BASE.decimals },
      pay_to: resolvePayTo(env),
      amounts: "only inside each resource's 402 challenge (accepts[].amount) — never on this catalog, never in prose",
      well_known: u("/.well-known/x402.json"),
      // Signed offers on every 402, signed receipts on every settle — the x402 Offer & Receipt
      // extension, JWS/EdDSA under a key in our DID document. The full declaration, with the
      // spec commit and the reason we emit no eip712, is on /.well-known/x402.json.
      offer_receipt: {
        offers: "in every 402 body and PAYMENT-REQUIRED header, at extensions['offer-receipt'].info.offers[]",
        receipts: "in every settled X-PAYMENT-RESPONSE, at extensions['offer-receipt'].info.receipt",
        format: "jws (EdDSA)",
        kid: X402_SIGNER_KID,
        spec_commit: OFFER_RECEIPT_SPEC_SHA,
        verify_free: u("/api/receipts/verify"),
        verify_without_us: "scripts/verify_receipt.py — reads /.well-known/did.json and nothing else",
        by_payer: u("/api/receipts?payer=0x…"),
      },
    },
    resources: [
      {
        id: "issuance",
        name: "Commission a signed card (request-attestation)",
        resource: u("/api/request-attestation?subject=<id>&axis=<slug>"),
        free_preview: u("/api/request-attestation?subject=<id>"),
        free_preview_note: "the 402 body carries csoai.preview: signed cards already on file",
        deliverable: "A signed card-v0 commission receipt for one named subject, plus every already-signed measurement card on file for it. Payment never mints a MEASURED cell.",
        never: ["a score", "a rank", "a certificate", "a MEASURED cell minted by payment"],
      },
      {
        id: "evidence_bundle",
        name: "Evidence bundle mapped to an obligation",
        resource: u("/api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<model-id>&bundle=1"),
        // `<id>` MEANT A MODEL ID on the request-attestation entry ten lines above, and an
        // OBLIGATION id here. A buyer who does the obvious thing gets 404 unknown_obligation —
        // measured 2026-09-05: this exact free_preview, fetched verbatim, answered 404 while
        // ?obligation=dora&subject=gpt-4o answered 200. The valid set is named in the endpoint's
        // own 404 body (article-50, article-53, dora, cra; eu-cra resolves as an alias, checked).
        // A placeholder that names the wrong kind of value costs a buyer their first call.
        free_preview: u("/api/evidence-bundle?obligation=<dora|cra|article-50|article-53>&subject=<model-id>"),
        deliverable: "An OSCAL 1.1.0 assessment-results bundle of already-signed CSOAI cards, mapped to one named obligation. Not a conformity determination.",
        never: ["a conformity determination", "satisfied/not-satisfied findings", "a certificate"],
      },
      {
        id: "data_feed",
        name: "Signed data feed (assembly + cadence)",
        resource: u("/api/eunomia-data?feed=1"),
        free_preview: u("/api/eunomia-data"),
        deliverable: "A signed JSON feed of enforcement and measurement artefacts already on the public root. Data only — no scores, no ranking.",
        never: ["scores as a product", "a ranking", "a rating"],
        also: { proof_bundle: u("/api/proof?bundle=1"), one_inclusion_free: u("/api/proof?sha=<64-hex>") },
      },
      {
        id: "rwa_evidence",
        name: "XRPL asset evidence card (per request)",
        resource: u("/api/rwa/evidence?asset=<symbol|issuer_address>"),
        free_preview: u("/api/rwa/evidence?asset=<symbol>&preview=1"),
        free_preview_note: "unsigned state, no raw-fetch hashes; symbols at /api/xrpl",
        deliverable: "A signed XRPL evidence card: AccountRoot flags, Domain, two-way TOML check, and cited raw-fetch hashes. Historical state — not a rating or a guarantee.",
        never: ["a rating", "a guarantee", "a verdict", "a rank", "a paywall on /api/xrpl or /root.json"],
      },
      {
        // This entry once carried `tier: 1, tier: 4` — two keys in one object literal, the
        // second silently winning. That defect is now structurally impossible here: the ordinal
        // is gone, because it never described anything (see the header).
        id: "provider_diff_feed",
        name: "Provider document diff feed (signed historical batch / bespoke partner feed)",
        resource: u("/api/feeds/provider-diff?history=1"),
        free_preview: u("/api/feeds/provider-diff"),
        free_preview_note: "recent diffs + latest state per target, free; leaves in /feeds/provider-diff/leaves/",
        deliverable: "Every hash-only provider-document diff leaf to date, each with its inclusion proof to the signed root. Hashes only — no page content, no verdict.",
        never: ["a verdict on any change", "the content of any page (never captured)", "a grade"],
      },
      {
        id: "receipts_batch",
        name: "Receipts batch — historical measurement leaves for a window (assembly)",
        resource: u("/api/receipts/batch?from=<iso>&to=<iso>"),
        free_preview: u("/api/receipts/batch?from=<iso>&to=<iso>&preview=1"),
        free_preview_note: "count, span, root count and the sha256 of the exact batch bytes — no leaves",
        deliverable: "Every signed measurement leaf in a time window, each with its Merkle inclusion path and carrying root. History assembly — not a conclusion.",
        recent_free: [u("/root.json"), u("/cards/<sha16>.json"), u("/api/proof?sha=<64-hex>"), u("/receipts/root-history.json")],
        honesty: "no settlement-receipt stream exists (/api/receipts/latest is UNPUBLISHED); these are measurement leaves, not payment receipts",
        never: ["a conclusion about any leaf", "a grade", "a certificate", "a settlement-receipt claim"],
      },
    ],
    // ONE free_forever. There were two keys of this name in this literal — the same defect the
    // provider_diff_feed comment above records — so the second silently won and the
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
      never_a_grade: "No resource sells a grade, a score, a pass/fail verdict, or a place on the board.",
      recomputable_for_free: "Every artefact is independently recomputable; a buyer pays for issuance, assembly and a durable independent signature — not for the answer.",
      no_public_price: "Amounts appear only in a 402 challenge.",
      financial_firewall: "No token, credit, or cash-settled index. Attestation is not tokenisation and confers no ownership.",
    },
    lid: CSOAI_LID,
    explainer: u("/pricing"),
    revenue_truth: u("/api/revenue"),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
