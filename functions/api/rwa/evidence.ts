/**
 * GET /api/rwa/evidence?asset=<symbol|issuer_address> — per-request signed evidence card of ONE
 * XRPL asset's deterministic on-ledger state. Sold to machines over the existing x402 rail
 * (same accepts entry / facilitator / settle path as /api/request-attestation).
 *
 *   ?preview=1   free — the unsigned state: no signature, no raw-fetch hashes. Verify stays free.
 *   (no header)  402 — the challenge (the amount lives ONLY here).
 *   X-PAYMENT    the signed pack: ONE card-v0 leaf (surface public.notice, kind
 *                csoai.eater.xrpl-issuer/0.1 — the SAME schema the free public-root leaf carries,
 *                see harness/rwa-attest/xrpl_swift_eater.py + scripts/adapters/staged_leaves.py),
 *                canonical bytes ≤3072, Ed25519 under did:web:csoai.org#board-attestation-1 when the
 *                Pages key is present, else sig_ed25519:null declared in unmeasured[].
 *
 * What is read, live, per request: AccountRoot (account_info, validated ledger) → lsf* flags,
 * Domain; gateway_balances → obligation for the symbol; the issuer's /.well-known/xrp-ledger.toml
 * (two-way domain check: PASS / FAIL / UNCHECKABLE — unreachable is never FAIL); the XRPScan
 * well-known directory (one-way, never converts FAIL to PASS); holders from /api/xrpl if the
 * reader has them (cited, never recomputed). Every raw fetch is sha256'd and cited. Anything not
 * fetched sits in unmeasured[]. No verdict words: historical state, not a rating, not a guarantee.
 *
 * Doctrine: never paywalls /api/gspc, /api/xrpl or /root.json — those stay free and this endpoint
 * reads them like any stranger. Buyer-led. MEASURED is never written here (state PROBED/UNMEASURED).
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
import { signPayload, canonicalBytes, sha256Hex, PAYLOAD_CAP_BYTES } from "../../_lib/cardSign";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const SCHEMA = "https://councilof.ai/schema/card-v0.json";
export const KIND = "csoai.eater.xrpl-issuer/0.1";
export const METHOD_ID = "csoai.eater.xrpl-swift/0.1";
export const ATTESTS = "historical state at fetched_at — not a rating, not a guarantee, not a conformity mark";
export const RPCS = ["https://xrplcluster.com/", "https://s1.ripple.com:51234/", "https://s2.ripple.com:51234/"];
export const XRPSCAN_WELLKNOWN = "https://api.xrpscan.com/api/v1/names/well-known";
const UA = "csoai-rwa-evidence/0.1 (+https://councilof.ai; nicholas@csoai.org)";

/** lsf* AccountRoot flags (XRPL ledger format) — identical map to the eater. */
export const LSF: Record<string, number> = {
  require_dest_tag: 0x00020000,
  require_auth: 0x00040000,
  disallow_xrp: 0x00080000,
  disable_master: 0x00100000,
  no_freeze: 0x00200000,
  global_freeze: 0x00400000,
  default_ripple: 0x00800000,
  deposit_auth: 0x01000000,
  allow_trustline_clawback: 0x80000000,
};

/** The eater's verdict vocabulary — a card carrying any of it is never issued. */
export const VERDICT_RE = /\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b|(?<!UN)MEASURED/i;

const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const SYM_RE = /^[A-Za-z0-9ØØ._-]{1,20}$/;

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

export function decodeHexDomain(h: unknown): string | null {
  if (typeof h !== "string" || !h) return null;
  try {
    const bytes = Uint8Array.from(h.match(/../g)!.map((x) => parseInt(x, 16)));
    const s = new TextDecoder("utf-8").decode(bytes).trim();
    return s || null;
  } catch {
    return null;
  }
}

export function decodeCurrency(code: string): string {
  if (code.length === 40) {
    try {
      const bytes = Uint8Array.from(code.match(/../g)!.map((x) => parseInt(x, 16)));
      let end = bytes.length;
      while (end > 0 && bytes[end - 1] === 0) end--;
      return new TextDecoder("utf-8").decode(bytes.slice(0, end));
    } catch {
      return code;
    }
  }
  return code;
}

async function rpc(method: string, params: Record<string, unknown>): Promise<{ src: string | null; result: Record<string, unknown>; err: string | null }> {
  const body = JSON.stringify({ method, params: [params], id: 1 });
  let last = "no rpc";
  for (const r of RPCS) {
    try {
      const res = await fetch(r, { method: "POST", headers: { "content-type": "application/json", "user-agent": UA }, body });
      const d = (await res.json()) as { result?: Record<string, unknown> };
      if (d.result && d.result.status === "success") return { src: r, result: d.result, err: null };
      last = JSON.stringify(d).slice(0, 80);
    } catch (e) {
      last = (e as Error).name || "fetch";
    }
  }
  return { src: null, result: {}, err: last };
}

type Fetched = { url: string; http: number; content_type: string; n_bytes: number; sha256: string; fetched_at: string; body: string; error: string | null };
async function fetchRaw(url: string, accept = "*/*"): Promise<Fetched> {
  const fetched_at = nowIso();
  try {
    const res = await fetch(url, { headers: { accept, "user-agent": UA }, redirect: "follow" });
    const buf = await res.arrayBuffer();
    return { url, http: res.status, content_type: res.headers.get("content-type") || "", n_bytes: buf.byteLength, sha256: hex(await crypto.subtle.digest("SHA-256", buf)), fetched_at, body: new TextDecoder("utf-8").decode(buf), error: null };
  } catch (e) {
    return { url, http: 0, content_type: "", n_bytes: 0, sha256: "", fetched_at, body: "", error: (e as Error).name || "fetch" };
  }
}

type ReaderAsset = { symbol: string | null; issuer: string | null; issuer_address: string | null; holders: number | null; supply: number | null; verified_via: string | null; unmeasured: string[]; sig_ed25519: string | null };

/** Resolve asset → reader row via the free /api/xrpl (never paywalled), falling back to the cards bundle. */
async function resolveAsset(origin: string, asset: string): Promise<{ row: ReaderAsset | null; reader_as_of: string | null; known: string[]; source: string }> {
  const isAddr = ADDR_RE.test(asset);
  const match = (a: ReaderAsset) => (isAddr ? a.issuer_address === asset : String(a.symbol || "").toLowerCase() === asset.toLowerCase());
  const r = await fetch(`${origin}/api/xrpl`);
  if (r.ok) {
    const d = (await r.json()) as { as_of?: string; assets?: ReaderAsset[] };
    const assets = d.assets || [];
    return { row: assets.find(match) || null, reader_as_of: d.as_of || null, known: assets.map((a) => String(a.symbol)), source: `${origin}/api/xrpl` };
  }
  const b = await fetch(`${origin}/cards-bundle.json`);
  if (!b.ok) return { row: null, reader_as_of: null, known: [], source: `${origin}/api/xrpl HTTP ${r.status}; cards-bundle HTTP ${b.status}` };
  const bundle = (await b.json()) as { as_of?: string; cards?: Record<string, { card?: { surface?: string; sig_ed25519?: string | null; unmeasured?: string[]; payload?: Record<string, unknown> } }> };
  const rows: ReaderAsset[] = Object.values(bundle.cards || {})
    .map((w) => w.card)
    .filter((c) => c && c.surface === "xrpl.asset.state")
    .map((c) => ({ symbol: (c!.payload?.symbol as string) || null, issuer: (c!.payload?.issuer as string) || null, issuer_address: (c!.payload?.issuer_address as string) || null, holders: (c!.payload?.holders as number) ?? null, supply: (c!.payload?.supply as number) ?? null, verified_via: (c!.payload?.verified_via as string) || null, unmeasured: c!.unmeasured || [], sig_ed25519: c!.sig_ed25519 ?? null }));
  return { row: rows.find(match) || null, reader_as_of: bundle.as_of || null, known: rows.map((a) => String(a.symbol)), source: `${origin}/cards-bundle.json (xrpl.asset.state leaves; /api/xrpl HTTP ${r.status})` };
}

/** Build the eater-shaped payload from live reads. Deterministic facts only; three-state checks. */
export async function buildPayload(origin: string, row: ReaderAsset, reader_as_of: string | null, readerUrl: string) {
  const sym = String(row.symbol || "");
  const addr = String(row.issuer_address || "");
  const source_urls: string[] = [readerUrl];
  const unmeasured: string[] = [];
  const checked = ["account_info.Domain (validated ledger)", "gateway_balances.obligations", "xrpscan well-known directory"];
  const absent: string[] = [];
  const hashes: string[] = [];

  const ai = await rpc("account_info", { account: addr, ledger_index: "validated" });
  const ad = (ai.result.account_data as Record<string, unknown>) || null;
  const gb = await rpc("gateway_balances", { account: addr, ledger_index: "validated" });
  const obligations = (gb.result.obligations as Record<string, string>) || {};
  const flagsInt = ad ? (ad.Flags as number) : null;
  const domain = ad ? decodeHexDomain(ad.Domain) : null;

  let two_way = "UNCHECKABLE";
  let reason = "account_info unreachable";
  let toml: Record<string, unknown> | null = null;
  if (ad) {
    if (domain) {
      const dom = domain.startsWith("http") ? domain : `https://${domain}`;
      const turl = dom.replace(/\/$/, "") + "/.well-known/xrp-ledger.toml";
      const t = await fetchRaw(turl, "application/toml,text/plain,*/*");
      checked.push(`GET ${turl}`);
      source_urls.push(turl);
      if (t.http === 200) {
        const isToml = !t.content_type.toLowerCase().includes("html") && !t.body.trimStart().toLowerCase().startsWith("<!doctype");
        const listed = [...new Set([...t.body.matchAll(/(?:address|issuer)\s*=\s*"(r[1-9A-HJ-NP-Za-km-z]{24,34})"/g)].map((m) => m[1]))].sort();
        toml = { url: turl, http: 200, content_type: t.content_type.slice(0, 40), n_bytes: t.n_bytes, sha256: t.sha256, fetched_at: t.fetched_at, is_toml: isToml, accounts_listed_n: listed.length, issuer_address_listed: listed.includes(addr) };
        hashes.push(t.sha256);
        if (!isToml) { two_way = "FAIL"; reason = "domain answers with HTML, not a TOML document"; absent.push("TOML body at .well-known/xrp-ledger.toml"); }
        else if (listed.includes(addr)) { two_way = "PASS"; reason = "on-ledger Domain -> TOML lists this issuer address"; }
        else { two_way = "FAIL"; reason = "TOML fetched but does not list this issuer address"; absent.push(`${addr} in TOML [[ACCOUNTS]]/[[TOKENS]]`); }
      } else {
        toml = { url: turl, http: t.http, error: t.error, fetched_at: t.fetched_at };
        two_way = "UNCHECKABLE"; reason = `TOML not retrievable (HTTP ${t.http || 0}); never counted as FAIL`;
      }
    } else {
      two_way = "FAIL"; reason = "no Domain field on the AccountRoot; two-way check has no first leg"; absent.push("AccountRoot.Domain");
    }
  } else {
    unmeasured.push("account_root (rpc unreachable this run)");
  }

  // Directory leg — one-way only.
  const wk = await fetchRaw(XRPSCAN_WELLKNOWN, "application/json");
  source_urls.push(XRPSCAN_WELLKNOWN);
  let directory: Record<string, unknown>;
  if (wk.http === 200) {
    let rows: { account?: string; name?: string; domain?: string }[] = [];
    try { rows = JSON.parse(wk.body); } catch { rows = []; }
    const d = rows.find((x) => x.account === addr);
    directory = { url: XRPSCAN_WELLKNOWN, sha256: wk.sha256, fetched_at: wk.fetched_at, listed: !!d, ...(d ? { name: d.name, domain: d.domain } : {}) };
    hashes.push(wk.sha256);
  } else {
    directory = { url: XRPSCAN_WELLKNOWN, http: wk.http, error: wk.error, fetched_at: wk.fetched_at, listed: null };
    unmeasured.push("directory (xrpscan well-known not retrievable this run)");
  }

  // On-chain obligation for this symbol.
  const want = sym === "EURØP" ? ["EURØP", "EUROP"] : [sym.split(".")[0]];
  let obligation: Record<string, unknown> | null = null;
  for (const [code, val] of Object.entries(obligations)) {
    if (want.includes(decodeCurrency(code))) obligation = { currency_code: code, currency_decoded: decodeCurrency(code), value: String(val), method: "gateway_balances.obligations (validated ledger)", ledger_index: gb.result.ledger_index ?? null, rpc: gb.src };
  }
  if (!obligation) unmeasured.push("onchain_obligation (currency not present in gateway_balances this run)");
  unmeasured.push("holders (account_lines not paginated this run; reader value cited, not recomputed)");

  const fetched_at = (toml && (toml.fetched_at as string)) || wk.fetched_at || nowIso();
  const inputs_sha256 = await sha256Hex(new TextEncoder().encode(hashes.sort().join("\n")));
  const payload: Record<string, unknown> = {
    kind: KIND,
    method_id: METHOD_ID,
    axes: ["xrpl-issuers", "distribution-integrity"],
    state: ad ? "PROBED" : "UNMEASURED",
    symbol: sym,
    issuer: row.issuer,
    issuer_address: addr,
    two_way_domain: two_way,
    two_way_reason: reason,
    checked,
    absent,
    account_root: ad ? { ledger_index: ai.result.ledger_index ?? null, rpc: ai.src, flags: flagsInt, flags_decoded: flagsInt != null ? Object.fromEntries(Object.entries(LSF).map(([k, v]) => [k, (flagsInt & v) !== 0])) : null, domain_hex: ad.Domain ?? null, domain, sequence: ad.Sequence ?? null } : null,
    toml,
    directory,
    directory_domain_toml: null,
    onchain_obligation: obligation,
    reader: { url: readerUrl, as_of: reader_as_of, holders: row.holders, supply: row.supply, verified_via: row.verified_via, sig_ed25519_present: !!row.sig_ed25519, unmeasured: row.unmeasured || [] },
    fetched_at,
    inputs_sha256,
    attests: ATTESTS,
    not_a_grade: true,
    writes_board: false,
    unmeasured,
  };
  return { payload, source_urls: [...new Set(source_urls)], fetched_at };
}

/**
 * Shrink to a canonical byte limit without touching facts: drop verbose carriers first.
 * `limit` defaults to the payload cap; the handler passes cap-minus-envelope so the WHOLE card
 * (what the eater gate measures: payload ≤ 3072 AND card ≤ 3072) fits.
 */
export function fitToCap(payload: Record<string, unknown>, limit: number = PAYLOAD_CAP_BYTES): Record<string, unknown> {
  const p = { ...payload };
  const size = () => canonicalBytes(p).byteLength;
  if (size() <= limit) return p;
  // 1. domain_hex duplicates the decoded domain.
  if (p.account_root && typeof p.account_root === "object") {
    const ar = { ...(p.account_root as Record<string, unknown>) };
    delete ar.domain_hex;
    p.account_root = ar;
  }
  if (size() <= limit) return p;
  // 2. `checked` in short form — the same facts, the urls already sit in toml.url / source_urls.
  if (Array.isArray(p.checked)) {
    p.checked = (p.checked as string[]).map((c) =>
      c.replace(/^GET https?:\/\/\S+\/\.well-known\/xrp-ledger\.toml.*$/, "GET toml.url").replace(" (validated ledger)", "").replace("xrpscan well-known directory", "xrpscan well-known"),
    );
  }
  if (size() <= limit) return p;
  // 3. Reader extras are cited from the free reader; keep the pointer and the holders figure.
  const r = (p.reader as Record<string, unknown>) || {};
  p.reader = { url: r.url, as_of: r.as_of, holders: r.holders, sig_ed25519_present: r.sig_ed25519_present };
  if (size() <= limit) return p;
  // 4. Last resort — never the facts.
  delete p.checked;
  return p;
}

/** Strip signature + raw-fetch hashes for the free preview. */
export function toPreview(card: Record<string, unknown>): Record<string, unknown> {
  const c = JSON.parse(JSON.stringify(card)) as Record<string, unknown>;
  const p = c.payload as Record<string, unknown>;
  delete c.sig_ed25519; delete c.did; delete c.sha256;
  delete p.inputs_sha256;
  for (const k of ["toml", "directory", "directory_domain_toml"]) {
    const b = p[k] as Record<string, unknown> | null;
    if (b && typeof b === "object") delete b.sha256;
  }
  return { ...c, preview: true, preview_note: "unsigned preview — no signature, no raw-fetch hashes. The signed pack (same schema, sig_ed25519 + inputs_sha256 + per-fetch sha256) is the metered artefact." };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const asset = (url.searchParams.get("asset") || "").trim();
  const preview = url.searchParams.get("preview") === "1";
  const resourceUrl = `${origin}/api/rwa/evidence?asset=${encodeURIComponent(asset || "<symbol|issuer_address>")}`;

  if (!asset || !(ADDR_RE.test(asset) || SYM_RE.test(asset))) {
    return json({ schema: "csoai.rwa-evidence/0.1", error: "bad_request", reason: "pass asset=<XRPL symbol from /api/xrpl or an r-address>", free_reader: `${origin}/api/xrpl`, preview: `${origin}/api/rwa/evidence?asset=<symbol>&preview=1` }, 400);
  }

  const description = `XRPL asset evidence card (${asset}): AccountRoot flags, Domain, two-way TOML check, gateway_balances obligation, cited raw-fetch hashes — one canonical card-v0, Ed25519 when the Pages key is present. Historical state, not a rating, not a guarantee. Measurement, not a conformity mark. ${CSOAI_LID}.`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const payment = preview ? { ok: false as const, reason: "preview" } : await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!preview && !payment.ok) {
    return paymentRequiredResponse(
      buildPaymentRequiredV2({
        resourceUrl,
        description,
        serviceName: "CSOAI RWA Evidence",
        tags: ["rwa", "xrpl", "evidence", "attestation", "x402"],
        accepts,
        bazaar: declareBazaarHttpGet({
          method: "GET",
          queryParams: { asset },
          queryParamsSchema: { properties: { asset: { type: "string", description: "XRPL issued-asset symbol (see /api/xrpl) or issuer r-address" } }, required: ["asset"] },
          outputExample: { schema: SCHEMA, surface: "public.notice", subject: "XRPL <SYMBOL> (<issuer>) two-way domain <PASS|FAIL|UNCHECKABLE> + on-chain obligation", payload: { kind: KIND, state: "PROBED", account_root: { flags_decoded: {} }, onchain_obligation: {}, inputs_sha256: "<hex>" }, sha256: "<hex>", sig_ed25519: "<hex or null>", unmeasured: [] },
        }),
        csoai: {
          schema: "csoai.rwa-evidence/0.1",
          per: "asset-request",
          lid: CSOAI_LID,
          never: ["rating", "guarantee", "verdict", "rank", "certificate"],
          deliverable: "one card-v0 leaf (public.notice / csoai.eater.xrpl-issuer/0.1) — the same schema as the free public-root leaf — canonical ≤3072 bytes, signed when the Pages key is present",
          free_preview: `${resourceUrl}&preview=1`,
          free_reader: `${origin}/api/xrpl`,
          rail: railMode(env),
          not_paid_reason: payment.reason,
          catalog: `${origin}/api/x402`,
        },
      }),
    );
  }

  const found = await resolveAsset(origin, asset);
  if (!found.row || !found.row.issuer_address) {
    return json({ schema: "csoai.rwa-evidence/0.1", error: "not_found", reason: `asset ${asset} is not in the public reader`, known_symbols: found.known, read_from: found.source, note: "Buyer-led: only assets the free reader already lists are evidenced. No payment was taken for a 404." }, 404);
  }

  const built = await buildPayload(origin, found.row, found.reader_as_of, found.source.startsWith("http") ? found.source : `${origin}/api/xrpl`);
  const sym = String(found.row.symbol);
  const envelope = (payload: Record<string, unknown>) => ({
    schema: SCHEMA,
    surface: "public.notice",
    subject: `XRPL ${sym} (${found.row!.issuer || "issuer"}) two-way domain ${payload.two_way_domain} + on-chain obligation`,
    as_of: built.fetched_at,
    source_urls: built.source_urls,
    payload,
    tags: ["eater:xrpl-swift", "axis:xrpl-issuers", "axis:distribution-integrity", `two-way:${payload.two_way_domain}`],
    unmeasured: [...(payload.unmeasured as string[])],
    did_intended: "did:web:csoai.org#board-attestation-1",
  });
  // The eater gate measures the WHOLE card against 3072, so the payload limit is cap minus the
  // envelope at its largest (signature + did + the unsigned-reason line + the signed/unsigned tag).
  const worst = { ...envelope(built.payload), payload: {}, sha256: "0".repeat(64), sig_ed25519: "0".repeat(128), did: "did:web:csoai.org#board-attestation-1" };
  worst.unmeasured = [...worst.unmeasured, "sig_ed25519 (no Pages key)"];
  worst.tags = [...worst.tags, "unsigned"];
  const payload = fitToCap(built.payload, PAYLOAD_CAP_BYTES - canonicalBytes(worst).byteLength);
  const cardBase = envelope(payload);

  if (preview) {
    const sha256 = await sha256Hex(canonicalBytes(payload));
    const card = toPreview({ ...cardBase, sha256, sig_ed25519: null });
    return json({ schema: "csoai.rwa-evidence/0.1", kind: "preview", card, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402` }, rail: railMode(env) });
  }

  // Paid path — sign. Verdict words are a doctrine failure, so the card is refused, not softened.
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: "csoai.rwa-evidence/0.1", error: "uncheckable", reason: (e as Error).message }, 500);
  }
  const unmeasured = [...(payload.unmeasured as string[])];
  if (!leaf.sig_ed25519) unmeasured.push(/absent/.test(leaf.unsigned_reason || "") ? "sig_ed25519 (no Pages key)" : "sig_ed25519 (sign failed)");
  // Signed: `did` replaces `did_intended` (the eater's unsigned marker). Unsigned: did_intended stays.
  const { did_intended, ...base } = cardBase;
  const card: Record<string, unknown> = { ...base, ...(leaf.did ? { did: leaf.did } : { did_intended }), sha256: leaf.sha256, sig_ed25519: leaf.sig_ed25519, unmeasured, tags: [...cardBase.tags, leaf.sig_ed25519 ? "signed" : "unsigned"] };
  const bytes = canonicalBytes(card);
  const text = new TextDecoder().decode(bytes);
  if (VERDICT_RE.test(text)) {
    return json({ schema: "csoai.rwa-evidence/0.1", error: "refused", reason: `card carries a verdict word: ${text.match(VERDICT_RE)![0]}` }, 500);
  }
  if (bytes.byteLength > PAYLOAD_CAP_BYTES) {
    return json({ schema: "csoai.rwa-evidence/0.1", error: "uncheckable", reason: `card ${bytes.byteLength}B > ${PAYLOAD_CAP_BYTES}B cap` }, 500);
  }

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
    } catch { /* never blocks a paid deliverable */ }
  }

  // The body IS the canonical card bytes (as the eater stores them): the file a buyer saves is the leaf.
  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "x-csoai-card-sha256": leaf.sha256,
      "x-csoai-signed": leaf.sig_ed25519 ? "true" : "false",
      ...(payment.ok && payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  });
};
