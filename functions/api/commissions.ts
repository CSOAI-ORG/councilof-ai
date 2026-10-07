/**
 * GET /api/commissions — the open commission queue, read from the same store that holds the
 * settlements (REVENUE_KV, `ras:<receipt sha>` records written by /api/request-attestation).
 *
 * Requester retrieval (2026-09-14): each QUEUED commission is joined to the signed pod cards
 * master carries for its subject (from /interop/pod-cards-index.json, a build-time index of
 * the signed bytes) as `cards[]` + `delivery`. Index unreadable → cards null, UNCHECKABLE.
 * When signed cards are published for a QUEUED model target, fulfillment becomes
 * RETRIEVABLE (requester can resolve card URLs). A card is never a certificate /
 * MEASURED invent — only the retrieval state moves.
 *
 * Typed contract (Stage68): every row exposes subject_kind / model / bank / fulfillment.
 * Legacy ras:* records without fields are classified on read (never invented MEASURED).
 * payai-wrapper → UNFULFILLABLE, not a model mill target.
 */
import { classifyCommissionTarget, type Fulfillment, type SubjectKind } from "./_commission_target";
import { selfWallets } from "./_x402";
import { headFromGet } from "./_head";

type Env = { REVENUE_KV?: KVNamespace; ASSETS?: { fetch: (r: Request) => Promise<Response> }; X402_PAY_TO?: string; X402_SELF_WALLETS?: string };

/** One signed pod card as the build-time index (/interop/pod-cards-index.json) lists it. */
type PodCard = { id: string; url: string; subject: string; axis: string | null; n: number | null; status: string | null; run_id: string | null };
type Delivery = { state: "CARDS_PUBLISHED" | "NONE" | "UNCHECKABLE"; count: number | null; note?: string };
export const POD_CARDS_INDEX = "/interop/pod-cards-index.json";
/** The OTS-stamped Hub index snapshot of 2026-09-16. Its bytes are frozen; later card sets are versions. */
export const HUB_CARDS_INDEX = "/interop/hub-cards-index.json";
/**
 * Unsigned discovery pointer to the stamped Hub index version whose cards equal the admitted set
 * (scripts/surface/build-hub-cards-index.mjs). Read this, not the snapshot: a stamped file is never
 * rewritten, so newly admitted cards appear only in a new hub-cards-index-<date>-<hex12>.json.
 */
export const HUB_CARDS_POINTER = "/interop/hub-cards-index-latest.json";
const HUB_INDEX_VERSION = /^\/interop\/hub-cards-index(?:-\d{4}-\d{2}-\d{2}-[0-9a-f]{12})?\.json$/;

type Commission = {
  subject: string;
  subject_kind: SubjectKind;
  model: string | null;
  bank: string | null;
  fulfillment: Fulfillment;
  axis: string | null;
  tx: string | null;
  as_of: string | null;
  receipt_sha: string;
  /** Signed cards on master for this subject (joined from the pod-cards index). null = index unreadable, never "none". */
  cards: PodCard[] | null;
  delivery: Delivery;
  /**
   * Who paid, as a class — never the address. OUTSIDE = a non-self wallet moved a non-zero amount;
   * SELF_TEST = an estate wallet paid itself; ZERO_VALUE = the settlement moved nothing;
   * UNCHECKABLE = no settlement record to read. A commission is demand evidence only when OUTSIDE.
   */
  origin: CommissionOrigin;
  /** Owed work (isOwedOrigin): false for a commission the estate paid itself or that moved nothing. */
  owed: boolean;
};
export type CommissionOrigin = "OUTSIDE" | "SELF_TEST" | "ZERO_VALUE" | "UNCHECKABLE";

/**
 * Owed work, ONE rule for /api/commissions and /api/commission-queue (repair round, 7 Oct 2026).
 * A commission is owed work unless the estate paid it (SELF_TEST) or it moved nothing (ZERO_VALUE);
 * an UNCHECKABLE payment stays owed, because it could be a stranger's. Before this, the queue moved
 * the two self-paid rows of 7 Oct to `not_owed` (queued 0) while this endpoint still counted them in
 * `queued` (2): two public numbers for one queue.
 */
export function isOwedOrigin(o: CommissionOrigin): boolean {
  return o === "OUTSIDE" || o === "UNCHECKABLE";
}
export const OWED_RULE =
  "queued counts owed work only: QUEUED commissions paid by a non-self wallet (OUTSIDE) or whose payment cannot be read " +
  "(UNCHECKABLE). A QUEUED commission the estate paid itself (SELF_TEST) or that moved nothing (ZERO_VALUE) stays listed " +
  "with owed:false and is counted in queued_not_owed. /api/commission-queue applies the same rule.";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60", "access-control-allow-origin": "*" },
  });

function typedFields(subject: string, r: Record<string, unknown>) {
  const classified = classifyCommissionTarget(subject);
  const subject_kind = (typeof r.subject_kind === "string" ? r.subject_kind : classified.subject_kind) as SubjectKind;
  const fulfillment = (r.fulfillment === "QUEUED" || r.fulfillment === "UNFULFILLABLE" || r.fulfillment === "RETRIEVABLE"
    ? r.fulfillment
    : classified.fulfillment) as Fulfillment;
  const model =
    typeof r.model === "string" && r.model
      ? r.model
      : (fulfillment === "QUEUED" || fulfillment === "RETRIEVABLE")
        ? classified.model
        : null;
  const bank = typeof r.bank === "string" && r.bank ? r.bank : classified.bank;
  return { subject_kind, model, bank, fulfillment };
}

export async function listCommissions(kv: KVNamespace): Promise<{ commissions: Omit<Commission, "cards" | "delivery">[]; unreadable: number }> {
  const out: Omit<Commission, "cards" | "delivery">[] = [];
  let unreadable = 0;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "ras:", cursor, limit: 1000 });
    for (const k of page.keys) {
      const raw = await kv.get(k.name);
      if (!raw) { unreadable++; continue; }
      try {
        const r = JSON.parse(raw) as Record<string, unknown>;
        const subject = typeof r.subject === "string" ? r.subject.trim() : "";
        if (!subject) { unreadable++; continue; }
        const typed = typedFields(subject, r);
        out.push({
          subject,
          ...typed,
          axis: typeof r.axis === "string" && r.axis ? r.axis : null,
          tx: typeof r.tx === "string" && r.tx ? r.tx : null,
          as_of: typeof r.as_of === "string" ? r.as_of : null,
          receipt_sha: k.name.slice("ras:".length),
          origin:
            r.origin === "OUTSIDE" || r.origin === "SELF_TEST" || r.origin === "ZERO_VALUE"
              ? r.origin
              : "UNCHECKABLE",
        });
      } catch { unreadable++; }
    }
    cursor = page.list_complete ? undefined : ("cursor" in page ? page.cursor : undefined);
  } while (cursor);
  out.sort((a, b) => String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")));
  return { commissions: out, unreadable };
}

/**
 * Read the derived pod-cards index (built by build:client from the signed bytes). Returns null
 * when it cannot be read — the caller then reports UNCHECKABLE, never an empty delivery.
 */
export async function readPodCardsIndex(env: Env, origin: string, fetcher: typeof fetch = fetch): Promise<Map<string, PodCard[]> | null> {
  return readCardsIndex(env, origin, POD_CARDS_INDEX, "csoai.pod-cards-index/0.1", fetcher);
}

async function getAsset(env: Env, origin: string, path: string, fetcher: typeof fetch): Promise<Response> {
  const req = new Request(new URL(path, origin).toString());
  return env.ASSETS ? await env.ASSETS.fetch(req) : await fetcher(req);
}

/**
 * Which stamped Hub index is current, and the sha256 its bytes must have. A missing pointer (a
 * deploy from before versioning) falls back to the snapshot; a pointer that is present but
 * unreadable or names anything outside the versioned set is null — UNCHECKABLE, never the snapshot.
 */
export async function resolveHubCardsIndex(env: Env, origin: string, fetcher: typeof fetch = fetch): Promise<{ path: string; sha256: string | null } | null> {
  try {
    const res = await getAsset(env, origin, HUB_CARDS_POINTER, fetcher);
    if (res.status === 404) return { path: HUB_CARDS_INDEX, sha256: null };
    if (!res.ok) return null;
    const p = (await res.json()) as { schema?: unknown; index_url?: unknown; index_sha256?: unknown };
    if (p.schema !== "csoai.hub-cards-index-pointer/1" || typeof p.index_url !== "string" || !HUB_INDEX_VERSION.test(p.index_url) ||
        typeof p.index_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(p.index_sha256)) return null;
    return { path: p.index_url, sha256: p.index_sha256 };
  } catch {
    return null;
  }
}

export async function readHubCardsIndex(env: Env, origin: string, fetcher: typeof fetch = fetch): Promise<Map<string, PodCard[]> | null> {
  const current = await resolveHubCardsIndex(env, origin, fetcher);
  if (current === null) return null;
  return readCardsIndex(env, origin, current.path, "csoai.hub-cards-index/0.1", fetcher, current.sha256);
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function readCardsIndex(env: Env, origin: string, path: string, schema: string, fetcher: typeof fetch,
                              expectedSha256: string | null = null): Promise<Map<string, PodCard[]> | null> {
  try {
    const res = await getAsset(env, origin, path, fetcher);
    if (!res.ok) return null;
    const raw = await res.arrayBuffer();
    // The pointer names exact bytes; an index that is not those bytes is not the one it selected.
    if (expectedSha256 !== null && hex(await crypto.subtle.digest("SHA-256", raw)) !== expectedSha256) return null;
    const idx = JSON.parse(new TextDecoder().decode(raw)) as { schema?: string; cards?: unknown };
    if (idx.schema !== schema || !Array.isArray(idx.cards)) return null;
    const by = new Map<string, PodCard[]>();
    for (const c of idx.cards as Array<Record<string, unknown>>) {
      if (typeof c.id !== "string" || typeof c.url !== "string" || typeof c.subject !== "string") continue;
      const row: PodCard = {
        id: c.id, url: c.url, subject: c.subject,
        axis: typeof c.axis === "string" ? c.axis : null,
        n: Number.isInteger(c.n) ? (c.n as number) : null,
        status: typeof c.status === "string" ? c.status : null,
        run_id: typeof c.run_id === "string" ? c.run_id : null,
      };
      const k = c.subject.toLowerCase();
      by.set(k, [...(by.get(k) ?? []), row]);
    }
    return by;
  } catch {
    return null;
  }
}

/** Promote QUEUED → RETRIEVABLE once signed (DID-keyed) cards are published for the model. */
export function fulfillmentAfterDelivery(
  fulfillment: Fulfillment,
  delivery: Delivery,
): Fulfillment {
  if (fulfillment === "UNFULFILLABLE") return fulfillment;
  if (fulfillment === "RETRIEVABLE") return fulfillment;
  if (delivery.state === "CARDS_PUBLISHED" && (delivery.count ?? 0) > 0) return "RETRIEVABLE";
  return fulfillment;
}

function joinDelivery(c: Omit<Commission, "cards" | "delivery">, pod: Map<string, PodCard[]> | null,
                      hub: Map<string, PodCard[]> | null): Pick<Commission, "cards" | "delivery"> {
  // QUEUED (awaiting mill) and RETRIEVABLE (cards already published) both join the index.
  if ((c.fulfillment !== "QUEUED" && c.fulfillment !== "RETRIEVABLE") || !c.model) {
    return { cards: null, delivery: { state: "NONE", count: 0, note: "not a millable model target" } };
  }
  const index = c.subject_kind === "hub_model" ? hub : pod;
  const path = c.subject_kind === "hub_model" ? HUB_CARDS_POINTER : POD_CARDS_INDEX;
  if (index === null) return { cards: null, delivery: { state: "UNCHECKABLE", count: null, note: `${path} unreadable — null, never substituted` } };
  const all = index.get(c.model.toLowerCase()) ?? [];
  const cards = c.axis ? all.filter((k) => k.axis === c.axis) : all;
  return { cards, delivery: { state: cards.length ? "CARDS_PUBLISHED" : "NONE", count: cards.length } };
}

/**
 * Classify one commission's payment from its settled:tx:<tx> record — the same record and the same
 * self/zero rules /api/revenue uses, so the two endpoints cannot disagree about who is a buyer.
 * The payer address is read to classify and is never returned.
 */
export async function commissionOrigin(kv: KVNamespace, tx: string | null, env: Env): Promise<CommissionOrigin> {
  if (!tx) return "UNCHECKABLE";
  let raw: string | null;
  try { raw = await kv.get(`settled:tx:${tx}`); } catch { return "UNCHECKABLE"; }
  if (!raw) return "UNCHECKABLE";
  let r: { payer?: string | null; self?: boolean; zero_value?: boolean; amount_atomic?: string | number | null };
  try { r = JSON.parse(raw); } catch { return "UNCHECKABLE"; }
  const zero = r.zero_value === true || !r.amount_atomic || !/^[1-9]\d*$/.test(String(r.amount_atomic));
  if (zero) return "ZERO_VALUE";
  const payer = (r.payer || "").toLowerCase();
  if (r.self === true || (!!payer && selfWallets(env).has(payer))) return "SELF_TEST";
  return payer ? "OUTSIDE" : "UNCHECKABLE";
}

export async function buildCommissions(env: Env, origin = "https://councilof.ai", fetcher: typeof fetch = fetch) {
  const base = {
    schema: "csoai.commissions/0.2",
    endpoint: "/api/commissions",
    what: "Subjects that a paid request-attestation commissioned. Typed: subject_kind/model/bank/fulfillment (QUEUED|RETRIEVABLE|UNFULFILLABLE). Mill grades QUEUED model/hub targets; RETRIEVABLE means signed cards are published for retrieve; UNFULFILLABLE (e.g. payai-wrapper) is receipt-only. Never a score.",
    source: "REVENUE_KV ras:* records (written by /api/request-attestation on a facilitator-settled request)",
  };
  if (!env.REVENUE_KV) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: "no store bound — the list is null, not empty" };
  }
  try {
    const { commissions: bare, unreadable } = await listCommissions(env.REVENUE_KV);
    const joinable = (c: { fulfillment: Fulfillment }) => c.fulfillment === "QUEUED" || c.fulfillment === "RETRIEVABLE";
    const needsPod = bare.some((c) => joinable(c) && c.subject_kind !== "hub_model");
    const needsHub = bare.some((c) => joinable(c) && c.subject_kind === "hub_model");
    const pod = needsPod ? await readPodCardsIndex(env, origin, fetcher) : new Map<string, PodCard[]>();
    const hub = needsHub ? await readHubCardsIndex(env, origin, fetcher) : new Map<string, PodCard[]>();
    const kv = env.REVENUE_KV;
    const origins = await Promise.all(bare.map((c) => commissionOrigin(kv, c.tx, env)));
    const commissions: Commission[] = bare.map((c, i) => {
      const joined = joinDelivery(c, pod, hub);
      // Writer: DID-signed cards in the published index → RETRIEVABLE (never invents MEASURED/scores).
      return { ...c, ...joined, fulfillment: fulfillmentAfterDelivery(c.fulfillment, joined.delivery), origin: origins[i], owed: isOwedOrigin(origins[i]) };
    });
    const subjects = [...new Set(commissions.map((c) => c.subject))];
    return {
      ...base,
      status: "MEASURED",
      as_of: new Date().toISOString(),
      count: commissions.length,
      subjects,
      queued: commissions.filter((c) => c.fulfillment === "QUEUED" && c.owed).length,
      queued_not_owed: commissions.filter((c) => c.fulfillment === "QUEUED" && !c.owed).length,
      queued_rule: OWED_RULE,
      retrievable: commissions.filter((c) => c.fulfillment === "RETRIEVABLE").length,
      delivered: (pod === null || hub === null) ? null : commissions.filter((c) => c.delivery.state === "CARDS_PUBLISHED").length,
      retrieval: {
        index: POD_CARDS_INDEX,
        hub_index: HUB_CARDS_POINTER,
        state: (pod === null || hub === null) ? "UNCHECKABLE" : "READ",
        how: "each `cards[].url` is a signed card; verify sha256(canonical body)==id and the Ed25519 signature under the kid in https://csoai.org/.well-known/did.json. When CARDS_PUBLISHED, fulfillment becomes RETRIEVABLE — publication is not a certificate and invents no MEASURED score.",
      },
      unfulfillable: commissions.filter((c) => c.fulfillment === "UNFULFILLABLE").length,
      // A receipt is not demand. Only OUTSIDE commissions are evidence that someone else asked.
      by_origin: Object.fromEntries((["OUTSIDE", "SELF_TEST", "ZERO_VALUE", "UNCHECKABLE"] as const).map((o) => [o, commissions.filter((c) => c.origin === o).length])),
      origin_rule: "OUTSIDE = a non-self wallet moved a non-zero amount (same record and rules as /api/revenue); SELF_TEST = an estate wallet paid itself; ZERO_VALUE = nothing moved; UNCHECKABLE = no settlement record. Payer addresses are never returned.",
      commissions,
      records_unreadable: unreadable,
    };
  } catch (e) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: `REVENUE_KV read failed (${(e as Error).message}) — null, never substituted` };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => json(await buildCommissions(env, new URL(request.url).origin));

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
