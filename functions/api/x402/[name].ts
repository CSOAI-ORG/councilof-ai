/**
 * GET /api/x402/index — the daily x402 conformance index, FREE.
 *
 * (File is `[name].ts` because `x402/index.ts` would serve /api/x402 and collide with the
 * catalogue in functions/api/x402.ts. Any other /api/x402/<name> is a 404.)
 *
 * WHAT IT SERVES, AND WHEN:
 *   SIGNED             the signed-index document (X402_INDEX_SIGNED_URL if set, else DEFAULT_SIGNED_URL,
 *                      the HF alias signed/index-latest.json) is a card-v0 leaf whose signature
 *                      verifies under a PINNED board key (the same check /api/verify runs). The
 *                      leaf's payload is served as the index, with its digest and key.
 *   SIGNATURE_INVALID  the document is a leaf that does not verify — NOT served as the index.
 *   UNCHECKABLE        the document could not be read or is not a signed leaf — not served.
 *   INDEX_PENDING      nothing signed is published: no X402_INDEX_SIGNED_URL, and the default alias
 *                      answers 404. As of 2026-09-25 the daily census runs
 *                      (HF csoai/x402-bazaar-conformance, summary-<date>.json, produced by
 *                      scripts/census/x402-bazaar-conformance.py on the pod) are UNSIGNED — their
 *                      own method line says "Nothing signed". So this door says INDEX_PENDING and
 *                      points at the latest unsigned run, labelled as such, with the digest of the
 *                      bytes it read. It never assembles, retypes or invents a list.
 * The producer step that flips this to SIGNED (live 2026-09-27): oracle-micro-2
 * ~/lanes/flywheel/flywheel_x402_index.py, run by the x402-daily job after it publishes, signs
 * the day's published summary (pinned by that day's signed release manifest) through
 * POST /api/board-sign and publishes signed/index-<date>.json + signed/index-latest.json to the
 * HF dataset. See docs/ras/SELF-SERVE-DOORS.md.
 */
import { isCardV0, verifyCardV0 } from "../verify";
import { sha256Hex } from "../../_lib/cardSign";

type Env = { X402_INDEX_SIGNED_URL?: string };

export const SCHEMA = "csoai.x402-index/0.1";
export const HF_BASE = "https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main";
export const LATEST_UNSIGNED = `${HF_BASE}/summary-latest.json`;
/** Where the daily signer publishes the leaf (a stable alias; the dated copy sits beside it). */
export const DEFAULT_SIGNED_URL = `${HF_BASE}/signed/index-latest.json`;
const ALLOWED = /^https:\/\/(councilof\.ai\/|csoai\.org\/|huggingface\.co\/datasets\/csoai\/)/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });

async function readBytes(url: string): Promise<{ ok: true; status: number; bytes: Uint8Array } | { ok: false; reason: string }> {
  try {
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "csoai-x402-index/0.1 (+https://councilof.ai)" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.byteLength > 8 * 1024 * 1024) return { ok: false, reason: "over 8 MiB" };
    return { ok: true, status: r.status, bytes };
  } catch (e) {
    return { ok: false, reason: (e as Error).name || "fetch error" };
  }
}

export async function latestUnsignedRun(): Promise<Record<string, unknown>> {
  const r = await readBytes(LATEST_UNSIGNED);
  if (r.ok === false) return { url: LATEST_UNSIGNED, signed: false, readable: false, reason: r.reason };
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(new TextDecoder().decode(r.bytes)); } catch { return { url: LATEST_UNSIGNED, signed: false, readable: false, reason: "not JSON" }; }
  return {
    url: LATEST_UNSIGNED,
    signed: false,
    readable: true,
    bytes_sha256: await sha256Hex(r.bytes),
    schema: d.schema ?? null,
    date: d.date ?? null,
    as_of: d.as_of ?? null,
    partial: d.partial ?? null,
    producer: d.producer ?? null,
    note: "UNSIGNED census run — pointed at, not served as the index. Its numbers are the census's claim about that run, verified by nothing here.",
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const origin = new URL(request.url).origin;
  const name = String((params as Record<string, unknown>)?.name ?? new URL(request.url).pathname.split("/").pop() ?? "");
  if (name !== "index") {
    return new Response(JSON.stringify({ error: "not_found", reason: `/api/x402/${name} is not a route; the catalogue is /api/x402 and the daily index is /api/x402/index` }, null, 2), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
    });
  }
  const base = {
    schema: SCHEMA,
    free: true,
    paid: false,
    method: "scripts/census/x402-bazaar-conformance.py — one GET per distinct host listed in either public x402 Bazaar (CDP, PayAI); conformant = HTTP 402 AND PAYMENT-REQUIRED header AND x402Version 2 in the body AND extensions.bazaar",
    one_resource_check: `${origin}/api/ras/x402-check?url=<https-x402-resource>`,
    dataset: "https://huggingface.co/datasets/csoai/x402-bazaar-conformance",
    not: "a seller's honesty, product quality, price, or whether a door would deliver after payment. Measurement, not certification.",
  };
  const configured = (env.X402_INDEX_SIGNED_URL || "").trim();
  const signedUrl = configured || DEFAULT_SIGNED_URL;
  if (!ALLOWED.test(signedUrl)) {
    return json({ ...base, state: "UNCHECKABLE", index: null, reason: "X402_INDEX_SIGNED_URL is not on an estate origin or the csoai HF org; not read", latest_unsigned_run: null });
  }
  const r = await readBytes(signedUrl);
  if (r.ok === false && !configured && r.reason === "HTTP 404") {
    return json({
      ...base,
      state: "INDEX_PENDING",
      index: null,
      reason: "no signed daily index is published yet: the signed-index alias answers 404, and this door serves only a signed index",
      signed_index_url: signedUrl,
      latest_unsigned_run: await latestUnsignedRun(),
    });
  }
  if (r.ok === false) return json({ ...base, state: "UNCHECKABLE", index: null, reason: `signed index unreadable: ${r.reason}`, source: signedUrl, latest_unsigned_run: await latestUnsignedRun() });
  const text = new TextDecoder().decode(r.bytes);
  let doc: unknown;
  try { doc = JSON.parse(text); } catch { return json({ ...base, state: "UNCHECKABLE", index: null, reason: "signed index is not JSON", source: signedUrl, latest_unsigned_run: null }); }
  if (!isCardV0(doc)) return json({ ...base, state: "UNCHECKABLE", index: null, reason: "document is not a card-v0 leaf (payload + sha256 + sig_ed25519)", source: signedUrl, latest_unsigned_run: null });
  const v = await verifyCardV0(doc, text);
  if (v.state !== "VALID") {
    return json({ ...base, state: v.state === "INVALID" ? "SIGNATURE_INVALID" : "UNCHECKABLE", index: null, reason: v.reasons.join(", "), checks: v.checks, source: signedUrl, latest_unsigned_run: null });
  }
  return json({
    ...base,
    state: "SIGNED",
    index: doc.payload,
    signature: { sha256: doc.sha256, did: doc.did ?? null, sig_ed25519: doc.sig_ed25519, checks: v.checks },
    source: signedUrl,
    source_bytes_sha256: await sha256Hex(r.bytes),
    ...(/^https:\/\/(councilof\.ai|csoai\.org)\//.test(signedUrl)
      ? { verify_free: `${origin}/api/verify?record_url=${encodeURIComponent(signedUrl)}` }
      : { verify_free: `${origin}/api/verify`, verify_how: "POST the leaf at `source` to /api/verify" }),
  });
};
