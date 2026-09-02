/**
 * GET /api/receipts/batch?from=<iso>&to=<iso> — a historical batch of the estate's measurement
 * receipts, sold over the existing x402 rail (SKU receipts_batch, x402-or-invoice).
 *
 * WHAT A "RECEIPT" IS HERE, HONESTLY: /api/receipts/latest is an UNPUBLISHED stub — no settlement-
 * receipt stream exists on Pages, so there is no payment-receipt history to serve and this endpoint
 * never pretends there is. The receipts the estate does publish, hourly, are card-v0 LEAVES: signed
 * measurement records under a signed Merkle root (public/root.json), each shipping its inclusion
 * path. Recent = the current root, free forever at /root.json, /cards/<sha16>.json and
 * /api/proof?sha=. What this endpoint assembles — and sells — is HISTORY: every leaf whose as_of
 * falls in [from,to], with its proof path and the root(s) that carried it, read from two build-time
 * static assets (/cards-bundle.json for the leaves, /receipts/root-history.json for the roots —
 * the git history of public/root.json indexed at build time by scripts/build-root-history.mjs).
 *
 *   ?from=&to=&preview=1   FREE: count, span, root count, cap/truncation, and the sha256 of the
 *                          exact canonical batch bytes the paid path returns. No leaves.
 *   ?from=&to=             402 challenge (the amount lives ONLY here) + the same preview in csoai.
 *   + settled X-PAYMENT    200: the batch (deterministic; sha256 matches the preview) + one signed
 *                          manifest card-v0 (surface receipts.batch) citing batch sha256 and the
 *                          settle tx + X-PAYMENT-RESPONSE.
 *
 * Determinism: the hashed `batch` object carries nothing request-time (no timestamps, no settle
 * data); the manifest card wraps it and is the only thing that changes per purchase. A leaf's
 * `roots_carrying` is derived from the root index (membership in card_sha256[]), never asserted.
 * Missing hours in the index are visible as missing — never filled.
 *
 * Never: a conclusion about any leaf, a grade, a certificate, a settlement-receipt claim.
 */
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
import { signPayload, cardV0, canonicalBytes, sha256Hex } from "../../_lib/cardSign";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const SCHEMA = "csoai.receipts.batch/0.1";
export const SURFACE = "receipts.batch";
export const BATCH_CAP = 200;
const SKU = "receipts_batch";

type Leaf = {
  sha256?: string;
  as_of?: string;
  surface?: string;
  subject?: string;
  sig_ed25519?: string | null;
  did?: string;
  [k: string]: unknown;
};
type Wrapper = { card?: Leaf; proof?: unknown[] };
type RootEntry = { as_of: string; merkle_root: string; card_count: number; card_sha256: string[]; sig_ed25519: string | null; did_intended: string | null; commit: string | null };

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extra },
  });

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

async function getJson<T>(u: string): Promise<{ ok: true; body: T } | { ok: false; reason: string }> {
  try {
    const r = await fetch(u);
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    return { ok: true, body: (await r.json()) as T };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Parse an ISO-8601 instant; null when unparseable. */
export function parseIso(s: string | null): Date | null {
  if (!s) return null;
  const t = Date.parse(s.trim());
  return Number.isFinite(t) ? new Date(t) : null;
}

/**
 * assembleBatch — the deterministic, hashable batch for a window. Pure over its inputs so the
 * preview hash and the paid bytes cannot disagree.
 */
export function assembleBatch(opts: {
  from: Date;
  to: Date;
  bundle: { as_of?: string; merkle_root?: string; cards?: Record<string, Wrapper> };
  history: { roots?: RootEntry[] } | null;
  currentRoot: { merkle_root?: string; card_sha256?: string[]; as_of?: string } | null;
}) {
  const fromMs = opts.from.getTime();
  const toMs = opts.to.getTime();
  const roots = (opts.history?.roots || []).filter((r) => typeof r.merkle_root === "string");
  const carriers = new Map<string, string[]>();
  for (const r of roots) for (const s of r.card_sha256 || []) carriers.set(s, [...(carriers.get(s) || []), r.merkle_root]);
  const onCurrent = new Set(opts.currentRoot?.card_sha256 || []);

  const all = Object.values(opts.bundle.cards || {})
    .map((w) => ({ card: w.card, proof: Array.isArray(w.proof) ? w.proof : [] }))
    .filter((w): w is { card: Leaf & { sha256: string; as_of: string }; proof: unknown[] } => {
      const c = w.card;
      return !!c && typeof c.sha256 === "string" && typeof c.as_of === "string" && Number.isFinite(Date.parse(c.as_of));
    })
    .filter((w) => {
      const t = Date.parse(w.card.as_of);
      return t >= fromMs && t <= toMs;
    })
    .sort((a, b) => Date.parse(a.card.as_of) - Date.parse(b.card.as_of) || a.card.sha256.localeCompare(b.card.sha256));

  const matched = all.length;
  const items = all.slice(0, BATCH_CAP).map((w) => ({
    sha256: w.card.sha256,
    as_of: w.card.as_of,
    surface: w.card.surface ?? null,
    subject: w.card.subject ?? null,
    signed: !!w.card.sig_ed25519,
    card: w.card,
    proof: w.proof,
    roots_carrying: carriers.get(w.card.sha256) || [],
    on_current_root: onCurrent.has(w.card.sha256),
    free_now: onCurrent.has(w.card.sha256) ? `/api/proof?sha=${w.card.sha256}` : null,
  }));
  const truncated = matched > BATCH_CAP;
  const next_from = truncated ? all[BATCH_CAP].card.as_of : null;
  const windowRoots = roots
    .filter((r) => {
      const t = Date.parse(r.as_of);
      return Number.isFinite(t) && t >= fromMs && t <= toMs;
    })
    .map((r) => ({ as_of: r.as_of, merkle_root: r.merkle_root, card_count: r.card_count, sig_ed25519: r.sig_ed25519, did_intended: r.did_intended, commit: r.commit }));

  return {
    schema: SCHEMA,
    kind: "batch",
    window: { from: opts.from.toISOString().replace(/\.\d{3}Z$/, "Z"), to: opts.to.toISOString().replace(/\.\d{3}Z$/, "Z") },
    count: items.length,
    matched,
    cap: BATCH_CAP,
    truncated,
    next_from,
    span: items.length ? { first_as_of: items[0].as_of, last_as_of: items[items.length - 1].as_of } : null,
    roots_in_window: windowRoots.length,
    roots_indexed_total: roots.length,
    roots: windowRoots,
    items,
    what_this_is: "card-v0 measurement leaves published under signed public roots, assembled for a time window with their inclusion paths and carrying roots",
    what_this_is_not: [
      "settlement or payment receipts — none are published (/api/receipts/latest is UNPUBLISHED)",
      "a conclusion about any leaf, subject or asset",
      "a grade, a rank, a certificate",
    ],
    verify: {
      each_leaf: "recompute sha256 over the canonical card body; check sig_ed25519 under did:web:csoai.org#board-attestation-1 (/.well-known/did.json)",
      each_path: "fold proof[] from the leaf sha256 to one of roots_carrying (/signed/HOW-TO-VERIFY-ROOT.md)",
      current_root: "/root.json (free); one inclusion free at /api/proof?sha=",
    },
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const preview = url.searchParams.get("preview") === "1";
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const usage = {
    get: `${origin}/api/receipts/batch?from=<iso>&to=<iso>[&preview=1]`,
    note: "from is required; to defaults to now. preview=1 is free and returns the batch sha256 without the leaves.",
    recent_free: [`${origin}/root.json`, `${origin}/cards/<sha16>.json`, `${origin}/api/proof?sha=<64-hex>`, `${origin}/receipts/root-history.json`],
  };
  const from = parseIso(fromRaw);
  const to = toRaw ? parseIso(toRaw) : new Date();
  if (!fromRaw || !from) return json({ schema: SCHEMA, error: "bad_request", reason: "from: an ISO-8601 instant is required", usage }, 400);
  if (!to) return json({ schema: SCHEMA, error: "bad_request", reason: "to: not an ISO-8601 instant", usage }, 400);
  if (to.getTime() < from.getTime()) return json({ schema: SCHEMA, error: "bad_request", reason: "to is before from", usage }, 400);

  // Sources — read, never typed. Two subrequests regardless of corpus size.
  const [bundle, history, root] = await Promise.all([
    getJson<{ as_of?: string; merkle_root?: string; cards?: Record<string, Wrapper> }>(`${origin}/cards-bundle.json`),
    getJson<{ roots?: RootEntry[] }>(`${origin}/receipts/root-history.json`),
    getJson<{ merkle_root?: string; card_sha256?: string[]; as_of?: string }>(`${origin}/root.json`),
  ]);
  if (!bundle.ok) return json({ schema: SCHEMA, error: "not_found", reason: `static /cards-bundle.json ${bundle.reason}`, unmeasured: ["cards-bundle.json"], usage }, 404);

  const batch = assembleBatch({ from, to, bundle: bundle.body, history: history.ok ? history.body : null, currentRoot: root.ok ? root.body : null });
  const batchBytes = canonicalBytes(batch);
  const batch_sha256 = await sha256Hex(batchBytes);
  const sources = {
    leaves: `${origin}/cards-bundle.json`,
    roots: history.ok ? `${origin}/receipts/root-history.json` : `${origin}/receipts/root-history.json unreadable (${history.reason}) — roots_carrying empty, declared`,
    current_root: root.ok ? `${origin}/root.json` : `${origin}/root.json unreadable (${root.reason})`,
    settlement_receipts: "NONE published — /api/receipts/latest is UNPUBLISHED; this is a batch of measurement leaves, not payment receipts",
  };
  const previewBody = {
    window: batch.window,
    count: batch.count,
    matched: batch.matched,
    cap: batch.cap,
    truncated: batch.truncated,
    next_from: batch.next_from,
    span: batch.span,
    roots_in_window: batch.roots_in_window,
    roots_indexed_total: batch.roots_indexed_total,
    batch_sha256,
    batch_bytes: batchBytes.byteLength,
    sources,
    what_this_is: batch.what_this_is,
    what_this_is_not: batch.what_this_is_not,
  };
  const resourceUrl = `${origin}/api/receipts/batch?from=${encodeURIComponent(batch.window.from)}&to=${encodeURIComponent(batch.window.to)}`;

  if (preview) {
    return json({ schema: SCHEMA, kind: "preview", ...previewBody, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT; the paid bytes hash to batch_sha256", invoice: "or quote batch_sha256 to nicholas@csoai.org for a CSOAI LTD invoice (owner-decision; nothing is granted on a claim)", catalog: `${origin}/api/x402` }, rail: railMode(env), lid: CSOAI_LID });
  }

  const description =
    "Receipts batch: every signed card-v0 measurement leaf in a time window with its inclusion path and carrying root(s), " +
    "assembled from the public root history. History assembly only — recent leaves are free; never a conclusion. " +
    CSOAI_LID + ".";
  const accepts = x402Accepts(env, resourceUrl, { skuId: SKU, tier: "per_batch", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Receipts Batch",
      tags: ["receipts", "merkle", "history", "attestation", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: { from: batch.window.from, to: batch.window.to },
        queryParamsSchema: {
          properties: {
            from: { type: "string", format: "date-time", description: "Window start (ISO-8601). Required." },
            to: { type: "string", format: "date-time", description: "Window end (ISO-8601). Defaults to now." },
            preview: { type: "string", const: "1", description: "Free: count, span and the sha256 of the batch bytes, without the leaves" },
          },
          required: ["from"],
        },
        outputExample: {
          schema: SCHEMA,
          kind: "batch",
          batch: { window: { from: "<iso>", to: "<iso>" }, count: 0, cap: BATCH_CAP, roots: [], items: [] },
          batch_sha256: "<64-hex>",
          manifest_card: { surface: SURFACE, sig_ed25519: "<hex or null>" },
        },
      }),
      csoai: {
        schema: SCHEMA,
        per: "batch",
        lid: CSOAI_LID,
        never: batch.what_this_is_not,
        deliverable: "the canonical batch (hashes to preview.batch_sha256) + one signed manifest card-v0 (surface receipts.batch)",
        preview: previewBody,
        free_preview: `${resourceUrl}&preview=1`,
        rail: railMode(env),
        not_paid_reason: payment.reason,
        catalog: `${origin}/api/x402`,
        explainer: `${origin}/pricing-free`,
      },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid: wrap the deterministic batch in one signed manifest leaf. Never re-sign the leaves.
  const as_of = nowIso();
  const payload: Record<string, unknown> = {
    kind: SCHEMA,
    window: batch.window,
    count: batch.count,
    matched: batch.matched,
    truncated: batch.truncated,
    span: batch.span,
    roots_in_window: batch.roots_in_window,
    batch_sha256,
    batch_bytes: batchBytes.byteLength,
    leaves_signed: batch.items.filter((i) => i.signed).length,
    settle_tx: payment.settlement?.transaction || null,
    attests: "assembly of already-published leaves and roots for this window — nothing about their content",
  };
  const leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  const source_urls = [sources.leaves, `${origin}/receipts/root-history.json`, `${origin}/root.json`];
  if (payment.settlement?.transaction) source_urls.push(`https://basescan.org/tx/${payment.settlement.transaction}`);
  const manifest_card = cardV0({ surface: SURFACE, subject: `receipts batch ${batch.window.from}/${batch.window.to}`, as_of, source_urls, payload, leaf, tags: ["receipts", "history", "assembly"] });

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:receipts_batches")) || "0") + 1;
      await env.REVENUE_KV.put("count:receipts_batches", String(n));
    } catch {
      /* never blocks a paid deliverable */
    }
  }

  return json(
    { schema: SCHEMA, kind: "batch", batch, batch_sha256, manifest_card, manifest_bytes: leaf.bytes, unsigned_reason: leaf.unsigned_reason, sources, settle: payment.settlement || null, verify: `${origin}/gspc-verify` },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};
