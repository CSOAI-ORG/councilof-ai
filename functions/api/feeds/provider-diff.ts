// functions/api/feeds/provider-diff.ts — the provider document diff feed.
//
//   free   GET /api/feeds/provider-diff                 → latest state per target + the recent diffs,
//                                                        read from /feeds/provider-diff/index.json
//                                                        (committed by the daily watcher). Never typed here.
//   free   GET /api/feeds/provider-diff?provider=openai → the same, filtered.
//   402    GET /api/feeds/provider-diff?history=1       → the signed historical batch (every diff leaf +
//                                                        its inclusion proof, assembled) behind an x402
//                                                        challenge. The amount lives ONLY in accepts[].
//   402    GET /api/feeds/provider-diff?invoice=gbp&commissioned_by=<org>
//                                                      → the same artefact, or a bespoke per-partner target
//                                                        list on the same method, settled by a CSOAI LTD
//                                                        invoice in GBP. No amount here; the invoice states it.
//
// What is sold: assembly + a durable independent signature over facts that are already public and
// recomputable for free (the leaves are in /feeds/provider-diff/leaves/, the signed copies in /cards/).
// What is never sold: a verdict on any change, a grade, the content of any page (never captured).
// Doctrine: measurement not certification; verify free forever; hash-only; buyer-led.
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "../_x402";
import { railMode } from "../_x402_config";
import { SKUS } from "../_skus";

type Env = X402Env & { REVENUE_KV?: KVNamespace };

const SKU_ID = "provider_diff_feed";
const INDEX_PATH = "/feeds/provider-diff/index.json";
const STATE_PATH = "/feeds/provider-diff/state.json";
const ATTESTS = "the bytes at this URL changed between the two times shown — nothing about what changed or why";
const INVOICE_ISSUER = "CSOAI LTD (England and Wales, company 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE";
const INVOICE_CONTACT = "nicholas@csoai.org";

type IndexDoc = {
  schema?: string;
  as_of?: string | null;
  normaliser?: string;
  n_targets?: number;
  n_runs?: number;
  counts?: Record<string, number>;
  last_run?: Record<string, unknown> | null;
  targets?: Array<Record<string, unknown> & { id: string; provider: string; surface: string }>;
  recent_diffs?: Array<Record<string, unknown> & { id: string; provider: string; surface: string }>;
  n_diffs_total?: number;
  doctrine?: unknown;
};

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=300" : "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });

async function getJson<T>(u: string): Promise<{ ok: true; body: T } | { ok: false; reason: string }> {
  try {
    const r = await fetch(u);
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    return { ok: true, body: (await r.json()) as T };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** A safe reference for an invoice line: letters, digits, dot, dash, underscore; ≤64 chars. */
function refToken(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return t || null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const provider = (url.searchParams.get("provider") || "").toLowerCase().trim();
  const surface = (url.searchParams.get("surface") || "").toLowerCase().trim();
  const wantHistory = url.searchParams.get("history") === "1";
  const wantInvoice = (url.searchParams.get("invoice") || "").toLowerCase() === "gbp";
  const commissionedBy = refToken(url.searchParams.get("commissioned_by"));
  const resourceUrl = new URL("/api/feeds/provider-diff?history=1", origin).toString();

  const idx = await getJson<IndexDoc>(`${origin}${INDEX_PATH}`);
  const index: IndexDoc = idx.ok ? idx.body : {};
  const targets = (index.targets || []).filter(
    (t) => (!provider || t.provider === provider) && (!surface || t.surface === surface),
  );
  const diffs = (index.recent_diffs || []).filter(
    (d) => (!provider || d.provider === provider) && (!surface || d.surface === surface),
  );

  const sku = SKUS[SKU_ID];
  const free = {
    schema: "csoai.feeds.provider-diff/0.1",
    kind: "recent",
    one_line:
      "Hash-only, robots-honouring daily capture of AI-provider public documents (terms, usage policy, model cards, pricing, safety policy, Article 50 marking statements). A diff is a change of normalised sha256 between two captures. Content is never stored.",
    as_of: index.as_of ?? null,
    normaliser: index.normaliser ?? null,
    n_targets: index.n_targets ?? null,
    n_runs: index.n_runs ?? null,
    counts: index.counts ?? null,
    last_run: index.last_run ?? null,
    index_readable: idx.ok,
    ...(idx.ok ? {} : { index_unreadable: idx.reason, note: "No capture has been committed yet, or the index could not be read. Nothing here is typed by hand — an unreadable index is reported, not guessed." }),
    filter: { provider: provider || null, surface: surface || null },
    targets,
    recent_diffs: diffs,
    n_diffs_total: index.n_diffs_total ?? null,
    attests: ATTESTS,
    states: {
      OK: "HTTP 200 with a body; hashed; diffable",
      UNCHECKABLE: "robots.txt disallow / unreadable, or an anti-bot challenge — not fetched or not trusted; never bypassed",
      UNKNOWN: "non-200, network error, empty — never reported as unchanged",
    },
    free_forever: {
      index: `${origin}${INDEX_PATH}`,
      state_history: `${origin}${STATE_PATH}`,
      leaves: `${origin}/feeds/provider-diff/leaves/`,
      verify: `${origin}/gspc-verify`,
      root: `${origin}/root.json`,
      method: `${origin}/docs/PROVIDER-DIFF-FEED.md`,
    },
    paid: {
      sku: SKU_ID,
      rail: sku ? sku.rail : "x402-or-invoice",
      artifact: sku ? sku.artifact : null,
      sells: sku ? sku.sells : null,
      how: {
        x402: `${resourceUrl} (the 402 body states the amount; nowhere else)`,
        invoice_gbp: `${origin}/api/feeds/provider-diff?invoice=gbp&commissioned_by=<org>`,
      },
      never: ["a grade", "a verdict on any change", "the content of any page", "a place on the board"],
    },
    lid: CSOAI_LID,
    rail: railMode(env),
  };

  // ── invoice door (GBP, buyer-led). No amount in the body; the invoice carries it. ──
  if (wantInvoice) {
    const reference = `provider-diff/${commissionedBy || "unnamed"}/${(index.as_of || new Date().toISOString()).slice(0, 10)}`;
    return json(
      {
        schema: "csoai.feeds.provider-diff/0.1",
        kind: "invoice-required",
        sku: SKU_ID,
        rail: "invoice",
        currency: "GBP",
        issuer: INVOICE_ISSUER,
        contact: INVOICE_CONTACT,
        reference,
        commissioned_by: commissionedBy,
        ...(commissionedBy ? {} : { note_commissioned_by: "add ?commissioned_by=<your organisation> so the reference names you" }),
        artifact: sku ? sku.artifact : null,
        options: [
          "signed historical batch: every diff leaf to date with its inclusion proof to the signed root, assembled as one document",
          "bespoke per-partner feed: your own target list (URLs you name) captured on the same method, hash-only, delivered on your cadence",
        ],
        amount: "stated on the invoice, never here",
        what_you_get_for_free_anyway: free.free_forever,
        never: free.paid.never,
        next: `email ${INVOICE_CONTACT} quoting the reference; the owner issues the invoice (an agent never moves funds)`,
        lid: CSOAI_LID,
      },
      402,
    );
  }

  if (!wantHistory) return json(free);

  // ── x402 door: the signed historical batch ──
  const description =
    "Provider document diff feed — signed historical batch: every hash-only diff leaf with its inclusion proof, assembled. Nothing about what changed or why. Measurement, not certification. " +
    CSOAI_LID +
    ".";
  const accepts = x402Accepts(env, resourceUrl, { skuId: SKU_ID, tier: "history_batch", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Provider Diff Feed",
      tags: ["diff", "terms", "model-card", "article-50", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: { history: "1" },
        queryParamsSchema: { properties: { history: { type: "string", const: "1" } }, required: ["history"] },
        outputExample: { schema: "csoai.feeds.provider-diff/0.1", kind: "history", diffs: [], leaves: {}, root: {} },
      }),
      csoai: {
        schema: "csoai.feeds.provider-diff/0.1",
        per: "history-batch",
        lid: CSOAI_LID,
        preview: { n_targets: free.n_targets, n_diffs_total: free.n_diffs_total, as_of: free.as_of, recent_free: `${origin}/api/feeds/provider-diff` },
        invoice_alternative: `${origin}/api/feeds/provider-diff?invoice=gbp&commissioned_by=<org>`,
        rail: railMode(env),
        not_paid_reason: payment.reason,
        never: free.paid.never,
        catalog: `${origin}/api/x402`,
      },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid: assemble from the published bytes. Every block is what is already served; nothing invented.
  const [state, root] = await Promise.all([
    getJson<Record<string, unknown>>(`${origin}${STATE_PATH}`),
    getJson<Record<string, unknown>>(`${origin}/root.json`),
  ]);
  const allDiffs = (index.recent_diffs || []) as Array<Record<string, unknown> & { leaf?: string | null }>;
  const leaves: Record<string, unknown> = {};
  await Promise.all(
    allDiffs.map(async (d) => {
      if (!d.leaf) return;
      const r = await getJson<Record<string, unknown>>(`${origin}${d.leaf}`);
      leaves[String(d.leaf)] = r.ok ? r.body : { unreadable: r.reason };
    }),
  );

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:provider_diff_history")) || "0") + 1;
      await env.REVENUE_KV.put("count:provider_diff_history", String(n));
    } catch {
      /* never blocks a paid deliverable */
    }
  }

  return json(
    {
      schema: "csoai.feeds.provider-diff/0.1",
      kind: "history",
      note: "Assembled from the published bytes: the index, the append-only state, every diff leaf the index lists, and the current signed root. Signed copies of each leaf live at /cards/<sha256>.json with a proof to root.json. Nothing here is a verdict on any change.",
      as_of: index.as_of ?? null,
      index: idx.ok ? index : { unreadable: idx.reason },
      state: state.ok ? state.body : { unreadable: state.reason },
      leaves,
      root: root.ok ? root.body : { unreadable: root.reason },
      settle: payment.settlement || null,
      verify: `${origin}/gspc-verify`,
      lid: CSOAI_LID,
    },
    200,
    { "cache-control": "no-store", ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}) },
  );
};
