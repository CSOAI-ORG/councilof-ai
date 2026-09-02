/**
 * GET /api/evidence-bundle — Tier 2: an evidence bundle mapped to ONE regulatory obligation.
 *
 *   free   ?obligation=<id>[&subject=<s>]      → the obligation record, the counsel gate, how many
 *                                                already-signed cards are relevant-to it, and the
 *                                                existing signed pack (Article 50) if one exists.
 *   402    &bundle=1                            → x402 challenge (amount lives ONLY here).
 *   paid   &bundle=1 + settled X-PAYMENT        → OSCAL 1.1.0 assessment-results assembled from the
 *                                                already-signed public/cards leaves (full card bytes
 *                                                + inclusion proof each), plus ONE manifest card-v0
 *                                                (surface evidence.bundle, ≤3KB) signed when the Pages
 *                                                key is present, else sig_ed25519:null.
 *
 * HARD HONESTY RULES (same as scripts/evidence-pack-generate.mjs, which this wires, not rewrites):
 *   1. REUSE, NEVER FABRICATE — every observation is a real signed leaf from /cards-bundle.json.
 *   2. RELEVANT-TO, NEVER A DETERMINATION — observations, never satisfied/not-satisfied findings.
 *   3. DETERMINISTIC — the OSCAL body carries no clock; UUIDs are sha256-derived; last-modified is
 *      the newest card's own as_of. Only the manifest card's as_of is the issue time.
 *   4. COUNSEL GATE — obligations carry counsel_confirmed; where false the honesty note ships too.
 *   5. EMPTY IS EMPTY — zero relevant cards ⇒ the bundle says so (and the 402 preview said so
 *      before anyone paid). A buyer is never sold an empty bundle blind.
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { OBLIGATIONS, resolveObligation, isRelevant, type CardLite, type Obligation } from "./_obligations";
import { signPayload, cardV0, sha256Hex } from "../_lib/cardSign";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

type Wrapper = { card: Record<string, unknown> & { sha256?: string; sig_ed25519?: string | null; subject?: string; surface?: string; tags?: string[]; did?: string; as_of?: string }; proof?: string[] };

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

async function uuidFrom(name: string): Promise<string> {
  const h = await sha256Hex(new TextEncoder().encode(name));
  const b = h.slice(0, 32).split("");
  b[12] = "5";
  b[16] = "89ab"[parseInt(h[16], 16) % 4];
  const s = b.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

async function loadCards(origin: string): Promise<{ wrappers: Record<string, Wrapper>; merkle_root: string | null; as_of: string | null; source: string }> {
  const src = new URL("/cards-bundle.json", origin).toString();
  const r = await fetch(src);
  if (!r.ok) return { wrappers: {}, merkle_root: null, as_of: null, source: `${src} HTTP ${r.status}` };
  const b = (await r.json()) as { cards?: Record<string, Wrapper>; merkle_root?: string; as_of?: string };
  const wrappers: Record<string, Wrapper> = {};
  for (const [sha, w] of Object.entries(b.cards || {})) {
    if (w && w.card && w.card.sha256 && w.card.sig_ed25519) wrappers[sha] = w; // only real signed cards
  }
  return { wrappers, merkle_root: b.merkle_root || null, as_of: b.as_of || null, source: src };
}

function lite(sha: string, w: Wrapper): CardLite {
  const c = w.card;
  return {
    sha256: c.sha256 || sha,
    subject: String(c.subject || ""),
    surface: String(c.surface || ""),
    tags: Array.isArray(c.tags) ? c.tags : [],
    did: c.did || null,
    as_of: c.as_of || null,
    proof_len: Array.isArray(w.proof) ? w.proof.length : 0,
  };
}

async function oscal(ob: Obligation, subject: string, selected: { sha: string; w: Wrapper; l: CardLite }[], merkle_root: string | null, origin: string) {
  const newest = selected.map((s) => s.l.as_of || "").sort().at(-1) || null;
  const observations = await Promise.all(
    selected.map(async ({ sha, w, l }) => ({
      uuid: await uuidFrom(`obs:${sha}`),
      title: `Signed measurement leaf ${sha.slice(0, 16)}`,
      description: `${l.surface} — ${l.subject}. Relevant-to ${ob.control_id}; never a determination.`,
      methods: ["TEST"],
      types: ["signed-measurement-card"],
      collected: l.as_of,
      subjects: [{ type: "component", title: l.subject }],
      relevant_evidence: [{ href: `${origin}/cards/${sha.slice(0, 16)}.json`, description: "card-v0 leaf + Merkle inclusion proof (verify free at /gspc-verify)" }],
      props: [
        { name: "sha256", value: sha },
        { name: "sig_ed25519", value: String(w.card.sig_ed25519) },
        { name: "did", value: l.did || "" },
        { name: "relation", value: "relevant-to" },
        { name: "proof_len", value: String(l.proof_len) },
      ],
    })),
  );
  return {
    "assessment-results": {
      uuid: await uuidFrom(`ar:${ob.id}:${subject}:${merkle_root || ""}`),
      metadata: {
        title: `CSOAI evidence bundle — ${ob.title} — subject: ${subject}`,
        "last-modified": newest,
        version: "0.1",
        "oscal-version": "1.1.0",
        roles: [{ id: "measurement-body", title: "Independent measurement body (CSOAI Ltd, UK 16939677) — measures, never certifies" }],
        props: [
          { name: "obligation", value: ob.obligation },
          { name: "regulator", value: ob.regulator },
          { name: "statutory_maximum_anchor", value: ob.statutory_maximum },
          { name: "counsel_confirmed", value: String(ob.counsel_confirmed) },
          { name: "merkle_root", value: merkle_root || "" },
          { name: "determination", value: "NONE — observations only; the subject's auditor keeps the compliance call" },
        ],
        remarks: ob.honesty || "Counsel-confirmed obligation anchor. Measurement, not certification.",
      },
      "import-ap": { href: `${origin}/methodology` },
      results: [
        {
          uuid: await uuidFrom(`res:${ob.id}:${subject}`),
          title: `Observations relevant-to ${ob.control_id}`,
          description: "Each observation is an already-signed CSOAI card. No finding asserts satisfied/not-satisfied.",
          start: newest,
          "reviewed-controls": { "control-selections": [{ "include-controls": [{ "control-id": ob.control_id }] }] },
          observations,
          findings: [],
        },
      ],
    },
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const obRaw = (url.searchParams.get("obligation") || "").trim();
  const subject = (url.searchParams.get("subject") || "").trim().slice(0, 120);
  const bundle = url.searchParams.get("bundle") === "1";
  const ob = obRaw ? resolveObligation(obRaw) : null;

  if (!ob) {
    return json({
      schema: "csoai.evidence-bundle/0.1",
      error: obRaw ? "unknown_obligation" : "missing_obligation",
      obligations: Object.values(OBLIGATIONS).map((o) => ({ id: o.id, control_id: o.control_id, title: o.title, counsel_confirmed: o.counsel_confirmed, existing_pack: o.existing_pack })),
      usage: "GET /api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<s>  (add &bundle=1 to buy the assembled OSCAL bundle)",
      never: ["conformity determination", "certificate", "score", "rank"],
    }, obRaw ? 404 : 400);
  }

  const corpus = await loadCards(origin);
  const selected = Object.entries(corpus.wrappers)
    .map(([sha, w]) => ({ sha, w, l: lite(sha, w) }))
    .filter(({ l }) => isRelevant(l, subject, ob))
    .sort((a, b) => a.sha.localeCompare(b.sha));

  const preview = {
    obligation: { id: ob.id, control_id: ob.control_id, title: ob.title, obligation: ob.obligation, regulator: ob.regulator, counsel_confirmed: ob.counsel_confirmed, honesty: ob.honesty, existing_pack: ob.existing_pack ? `${origin}${ob.existing_pack}` : null },
    subject: subject || null,
    relevant_signed_cards: selected.length,
    cards: selected.slice(0, 40).map(({ sha, l }) => ({ sha256: sha, surface: l.surface, subject: l.subject, as_of: l.as_of, url: `${origin}/cards/${sha.slice(0, 16)}.json` })),
    corpus: { as_of: corpus.as_of, merkle_root: corpus.merkle_root, read_from: corpus.source, signed_cards_total: Object.keys(corpus.wrappers).length },
    relation: "relevant-to — never a determination",
    free_verify: `${origin}/gspc-verify`,
  };

  const resourceUrl = new URL(`/api/evidence-bundle?obligation=${ob.id}&bundle=1${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`, origin).toString();
  if (!bundle) {
    return json({ schema: "csoai.evidence-bundle/0.1", kind: "preview", ...preview, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay the accepts[] entry (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, explainer: `${origin}/pricing-free` }, rail: railMode(env) });
  }

  const description =
    `Evidence bundle mapped to ${ob.control_id}: OSCAL 1.1.0 assessment-results assembled from already-signed CSOAI cards ` +
    `(observations, relevant-to). Measurement, not certification — never a conformity determination. ${CSOAI_LID}.`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "evidence_bundle", tier: "bundle", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Evidence Bundle",
      tags: ["evidence", "oscal", "eu-ai-act", "dora", "cra"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: { obligation: ob.id, bundle: "1", ...(subject ? { subject } : {}) },
        queryParamsSchema: {
          properties: {
            obligation: { type: "string", enum: Object.keys(OBLIGATIONS) },
            subject: { type: "string", description: "Subject the cards must name (model id / instrument / vendor)" },
            bundle: { type: "string", const: "1" },
          },
          required: ["obligation", "bundle"],
        },
        outputExample: { schema: "csoai.evidence-bundle/0.1", kind: "bundle", oscal: { "assessment-results": {} }, cards: {}, manifest_card: { surface: "evidence.bundle" } },
      }),
      csoai: { schema: "csoai.evidence-bundle/0.1", per: "bundle", lid: CSOAI_LID, never: ["conformity determination", "certificate", "score", "rank"], preview, rail: railMode(env), not_paid_reason: payment.reason, catalog: `${origin}/api/x402` },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid path — assemble. Empty stays empty (and the preview already said so).
  const as_of = new Date().toISOString();
  const tx = payment.settlement?.transaction || null;
  const body = await oscal(ob, subject || "(unspecified subject)", selected, corpus.merkle_root, origin);
  const cards: Record<string, Wrapper> = {};
  for (const { sha, w } of selected) cards[sha] = w;
  const payload: Record<string, unknown> = {
    status: selected.length ? "ASSEMBLED" : "ASSEMBLED-EMPTY",
    obligation: ob.id,
    control_id: ob.control_id,
    subject: subject || null,
    counsel_confirmed: ob.counsel_confirmed,
    merkle_root: corpus.merkle_root,
    card_sha256: selected.slice(0, 30).map((s) => s.sha.slice(0, 16)),
    card_count: selected.length,
    relation: "relevant-to",
    determination: "NONE",
    settle: { network: payment.settlement?.network || null, transaction: tx },
    lid: CSOAI_LID,
  };
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: "csoai.evidence-bundle/0.1", error: "uncheckable", reason: (e as Error).message }, 500);
  }
  const manifest_card = cardV0({
    surface: "evidence.bundle",
    subject: `${ob.control_id}:${subject || "unspecified"}`,
    as_of,
    source_urls: [resourceUrl, ...(tx ? [`https://basescan.org/tx/${tx}`] : []), corpus.source.startsWith("http") ? corpus.source : `${origin}/cards-bundle.json`],
    payload,
    leaf,
    tags: ["rail:x402", "sku:evidence_bundle", `obligation:${ob.id}`],
    unmeasured: ob.counsel_confirmed ? [] : ["counsel_confirmation"],
  });

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:proofs")) || "0") + 1;
      await env.REVENUE_KV.put("count:proofs", String(n));
    } catch {
      /* never blocks a paid deliverable */
    }
  }

  return json(
    {
      schema: "csoai.evidence-bundle/0.1",
      kind: "bundle",
      obligation: preview.obligation,
      subject: subject || null,
      oscal: body,
      cards,
      existing_pack: ob.existing_pack ? { href: `${origin}${ob.existing_pack}`, note: "already-signed pack files (detached Ed25519 .sig.json) — download alongside" } : null,
      manifest_card,
      signed: !!leaf.sig_ed25519,
      unsigned_reason: leaf.unsigned_reason,
      verify: `${origin}/gspc-verify`,
      note: "Observations only. No finding asserts satisfied/not-satisfied. Measurement, not certification.",
    },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};
