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
import { DENOMINATOR_RULE, BOARD_AXIS_N_IS_NOT_CARD_N, type ExclusionsState } from "../_lib/denominator";
import { selfWallets } from "./_x402";

type Env = { REVENUE_KV?: KVNamespace; ASSETS?: { fetch: (r: Request) => Promise<Response> }; X402_PAY_TO?: string; X402_SELF_WALLETS?: string };

/**
 * One signed pod card as the build-time index (/interop/pod-cards-index.json) lists it.
 *
 * `n` alone used to be the whole denominator a requester got back, and `n` is graded_n:
 * a card at n 235 stands on 237 attempts with 2 excluded. The exclusion counts travel
 * with it now, in /api/worker's vocabulary. A count the index does not publish stays
 * null with a state — it is never filled in with 0.
 */
type PodCard = {
  id: string; url: string; subject: string; axis: string | null;
  n: number | null; status: string | null; run_id: string | null;
  graded_n: number | null;
  attempted: number | null;
  parse_errors_excluded: number | null;
  transport_errors_excluded: number | null;
  /** INDEX_WITHOUT_EXCLUSIONS = the deployed index predates these fields; the card was not consulted. */
  exclusions_state: ExclusionsState | "INDEX_WITHOUT_EXCLUSIONS";
};
type Delivery = { state: "CARDS_PUBLISHED" | "NONE" | "UNCHECKABLE"; count: number | null; note?: string };
export const POD_CARDS_INDEX = "/interop/pod-cards-index.json";
export const HUB_CARDS_INDEX = "/interop/hub-cards-index.json";

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
};
export type CommissionOrigin = "OUTSIDE" | "SELF_TEST" | "ZERO_VALUE" | "UNCHECKABLE";

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
        });
      } catch { unreadable++; }
    }
    cursor = page.list_complete ? undefined : page.cursor;
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

export async function readHubCardsIndex(env: Env, origin: string, fetcher: typeof fetch = fetch): Promise<Map<string, PodCard[]> | null> {
  return readCardsIndex(env, origin, HUB_CARDS_INDEX, "csoai.hub-cards-index/0.1", fetcher);
}

async function readCardsIndex(env: Env, origin: string, path: string, schema: string, fetcher: typeof fetch): Promise<Map<string, PodCard[]> | null> {
  try {
    const req = new Request(new URL(path, origin).toString());
    const res = env.ASSETS ? await env.ASSETS.fetch(req) : await fetcher(req);
    if (!res.ok) return null;
    const idx = (await res.json()) as { schema?: string; cards?: unknown };
    if (idx.schema !== schema || !Array.isArray(idx.cards)) return null;
    const by = new Map<string, PodCard[]>();
    for (const c of idx.cards as Array<Record<string, unknown>>) {
      if (typeof c.id !== "string" || typeof c.url !== "string" || typeof c.subject !== "string") continue;
      const int = (v: unknown) => (Number.isInteger(v) ? (v as number) : null);
      const row: PodCard = {
        id: c.id, url: c.url, subject: c.subject,
        axis: typeof c.axis === "string" ? c.axis : null,
        n: int(c.n),
        status: typeof c.status === "string" ? c.status : null,
        run_id: typeof c.run_id === "string" ? c.run_id : null,
        // Carried, never computed here: the index derived them from the signed bytes.
        graded_n: int(c.graded_n),
        attempted: int(c.attempted),
        parse_errors_excluded: int(c.parse_errors_excluded),
        transport_errors_excluded: int(c.transport_errors_excluded),
        exclusions_state:
          c.exclusions_state === "EXCLUSIONS_PUBLISHED" || c.exclusions_state === "EXCLUSIONS_PARTIAL" || c.exclusions_state === "EXCLUSIONS_ABSENT"
            ? c.exclusions_state
            : "INDEX_WITHOUT_EXCLUSIONS",
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
  const path = c.subject_kind === "hub_model" ? HUB_CARDS_INDEX : POD_CARDS_INDEX;
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
      return { ...c, ...joined, fulfillment: fulfillmentAfterDelivery(c.fulfillment, joined.delivery), origin: origins[i] };
    });
    const subjects = [...new Set(commissions.map((c) => c.subject))];
    return {
      ...base,
      status: "MEASURED",
      as_of: new Date().toISOString(),
      count: commissions.length,
      subjects,
      queued: commissions.filter((c) => c.fulfillment === "QUEUED").length,
      retrievable: commissions.filter((c) => c.fulfillment === "RETRIEVABLE").length,
      delivered: (pod === null || hub === null) ? null : commissions.filter((c) => c.delivery.state === "CARDS_PUBLISHED").length,
      retrieval: {
        index: POD_CARDS_INDEX,
        hub_index: HUB_CARDS_INDEX,
        state: (pod === null || hub === null) ? "UNCHECKABLE" : "READ",
        denominator_rule: DENOMINATOR_RULE,
        board_axis_n_is_not_card_n: BOARD_AXIS_N_IS_NOT_CARD_N,
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
