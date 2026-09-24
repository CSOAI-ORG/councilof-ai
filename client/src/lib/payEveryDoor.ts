/**
 * payEveryDoor — the /pay page's flow, kept out of the component so it can be tested without a
 * DOM and so the per-door button and "pay all remaining" share ONE path.
 *
 * WHY THE PAGE EXISTS. A successful payment can create a facilitator settlement record
 * relevant to settlement-based discovery. PayAI and the 402 Index are separate observed
 * catalogues; an index row or a self-funded settle does not prove independent demand.
 * This module implements the one-settle-per-door wallet path.
 *
 * WHAT IT REUSES, DELIBERATELY. The EIP-3009 typed data and the wallet round trip come from
 * `@/lib/x402Wallet` (`buildTypedData`, `signX402Challenge`, `discoverEIP6963`) — the same
 * functions X402PayButton calls, in the same order: refuse malformed terms BEFORE the wallet
 * opens, then sign, then retry the door once with the signed payload. The outcome classes are
 * X402PayButton's (`classifyPayError`), so "declined in wallet" and "wrong chain" read the same
 * on /tools and on /pay.
 *
 * WHAT IT DIFFERS IN. X402PayButton retries an MCP tool with `x_payment` as an argument.
 * Here the door is an HTTP resource, so the signed payload travels as the X-PAYMENT header —
 * the header functions/api/_x402.ts reads — and the settle evidence comes back as the
 * X-PAYMENT-RESPONSE header the doors echo from the facilitator.
 *
 * NEVER: a key, a seed phrase, a typed amount, a typed door list. Amounts are whatever the live
 * 402 says; doors are whatever /.well-known/x402.json says.
 */
import { classifyPayError, type PayState } from "@/components/X402PayButton";
import {
  buildTypedData,
  signX402Challenge,
  type EIP1193Provider,
  type X402Challenge,
} from "@/lib/x402Wallet";

export const MANIFEST_PATH = "/.well-known/x402.json";
export const LISTING_PATH = "/api/x402-listing";
export const FOUR02_LISTING_PATH = "/api/x402-listing-402index";
export const DOOR_SETTLES_PATH = "/api/door-settles";

/** The one sentence the page must carry, verbatim. */
export const THE_LINE =
  "A successful payment can create a facilitator settlement record. PayAI and 402 Index listings are checked separately. This page never holds a key.";

export type Door = {
  url: string;
  method: string;
  description: string;
  paidFor: string | null;
  freePreview: string | null;
  routeKey: string;
};

/** scheme://host/path, no query, no trailing slash — how the index reader and the audit compare routes. */
export function routeKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, "");
  } catch {
    return String(url || "");
  }
}

/** Every resource the manifest declares, in manifest order. Throws on a manifest with no resources. */
export function doorsFromManifest(manifest: unknown): Door[] {
  const resources = (manifest as { resources?: unknown })?.resources;
  if (!Array.isArray(resources) || resources.length === 0) {
    throw new Error("the x402 manifest declares no resources[]");
  }
  const out: Door[] = [];
  for (const r of resources) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    if (typeof row.url !== "string" || !/^https?:\/\//.test(row.url)) continue;
    out.push({
      url: row.url,
      method: typeof row.method === "string" ? row.method : "GET",
      description: typeof row.description === "string" ? row.description : "",
      paidFor: typeof row.paid_for === "string" ? row.paid_for : null,
      freePreview: typeof row.free_preview === "string" ? row.free_preview : null,
      routeKey: routeKey(row.url),
    });
  }
  if (out.length === 0) throw new Error("the x402 manifest resources[] carried no usable url");
  return out;
}

function resourceUrlOf(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (value && typeof value === "object") {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
  }
  return null;
}

/**
 * A door's 402 body → the X402Challenge x402Wallet signs. Field-for-field the same mapping as
 * ToolRunner.challengeFromResult applies to an MCP structuredContent (the test proves parity):
 * accepts[0] is retained as `accepted`, the v2 resource object as `resourceInfo`, extensions
 * as given. Nothing is rebuilt from its URL.
 */
export function challengeFromPaymentRequired(body: unknown): X402Challenge | null {
  if (!body || typeof body !== "object") return null;
  const holder = body as Record<string, unknown>;
  const accepts = holder.accepts;
  if (!Array.isArray(accepts) || accepts.length === 0) return null;
  const a = accepts[0] as Record<string, unknown>;
  const payTo = typeof a.payTo === "string" ? a.payTo : null;
  const amount =
    typeof a.amount === "string"
      ? a.amount
      : typeof a.maxAmountRequired === "string"
        ? a.maxAmountRequired
        : null;
  const resource = resourceUrlOf(a.resource) || resourceUrlOf(holder.resource);
  if (!payTo || !amount || !resource) return null;
  const resourceInfo =
    holder.resource && typeof holder.resource === "object" && !Array.isArray(holder.resource)
      ? (holder.resource as { url: string; [key: string]: unknown })
      : { url: resource };
  return {
    x402Version: typeof holder.x402Version === "number" ? holder.x402Version : undefined,
    chainId: typeof holder.chainId === "number" ? holder.chainId : undefined,
    accepted: a,
    resourceInfo,
    extensions:
      holder.extensions && typeof holder.extensions === "object" && !Array.isArray(holder.extensions)
        ? (holder.extensions as Record<string, unknown>)
        : undefined,
    network: typeof a.network === "string" ? a.network : undefined,
    asset: typeof a.asset === "string" ? a.asset : undefined,
    payTo,
    amount,
    resource,
    nonce: typeof a.nonce === "string" ? a.nonce : null,
    maxTimeoutSeconds: typeof a.maxTimeoutSeconds === "number" ? a.maxTimeoutSeconds : null,
    extra: a.extra && typeof a.extra === "object" ? (a.extra as { name?: string; version?: string }) : null,
  };
}

export type QuoteOutcome =
  | { kind: "challenge"; http: 402; challenge: X402Challenge; body: Record<string, unknown> }
  | { kind: "no-challenge"; http: number; detail: string }
  | { kind: "unreachable"; detail: string };

async function readJson(r: Response): Promise<unknown> {
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** GET the door with no payment: the live 402 is the only source of terms. Nothing is charged. */
export async function quoteDoor(door: Door, fetchImpl: typeof fetch = fetch): Promise<QuoteOutcome> {
  let r: Response;
  try {
    r = await fetchImpl(door.url, { method: door.method, headers: { accept: "application/json" } });
  } catch (e) {
    return { kind: "unreachable", detail: (e as Error)?.message || String(e) };
  }
  const body = await readJson(r);
  if (r.status === 402) {
    const challenge = challengeFromPaymentRequired(body);
    if (challenge) return { kind: "challenge", http: 402, challenge, body: body as Record<string, unknown> };
    return { kind: "no-challenge", http: 402, detail: "the door answered 402 without a usable accepts[] entry" };
  }
  const err =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : null;
  return {
    kind: "no-challenge",
    http: r.status,
    detail:
      r.status >= 200 && r.status < 300
        ? "the door answered without a payment challenge — there is nothing here to settle"
        : `the door answered HTTP ${r.status}${err ? `: ${err}` : ""} — no challenge to pay`,
  };
}

/** What the facilitator reported in X-PAYMENT-RESPONSE, decoded and nothing more. */
export type Settlement = {
  transaction: string | null;
  network: string | null;
  payer: string | null;
  success: boolean | null;
};

export function decodeSettlement(header: string | null): Settlement | null {
  if (!header) return null;
  try {
    let text = header.trim();
    if (!text.startsWith("{")) text = atob(text);
    const j = JSON.parse(text) as Record<string, unknown>;
    return {
      transaction:
        typeof j.transaction === "string" ? j.transaction : typeof j.txHash === "string" ? j.txHash : null,
      network: typeof j.network === "string" ? j.network : null,
      payer: typeof j.payer === "string" ? j.payer : null,
      success: typeof j.success === "boolean" ? j.success : null,
    };
  } catch {
    return null;
  }
}

/** The facilitator's reason as the door relayed it — the same three places rail-proof reads. */
export function unsettledReason(body: unknown): string {
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const csoai = b.csoai && typeof b.csoai === "object" ? (b.csoai as Record<string, unknown>) : null;
  const ext = b.extensions && typeof b.extensions === "object" ? (b.extensions as Record<string, unknown>) : null;
  const extCsoai = ext?.csoai && typeof ext.csoai === "object" ? (ext.csoai as Record<string, unknown>) : null;
  const candidates = [csoai?.not_paid_reason, extCsoai?.not_paid_reason, b.not_paid_reason];
  for (const c of candidates) if (typeof c === "string" && c.trim()) return c;
  return "the door answered 402 again and relayed no reason";
}

export type PaidOutcome =
  | { kind: "delivered"; http: number; paymentResponse: string | null; settlement: Settlement | null }
  | { kind: "unsettled"; http: 402; reason: string }
  | { kind: "failed"; http: number; detail: string };

/** Retry the SAME door once with the signed payload in X-PAYMENT. */
export async function retryDoorWithPayment(
  door: Door,
  paymentHeader: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PaidOutcome> {
  const r = await fetchImpl(door.url, {
    method: door.method,
    headers: { accept: "application/json", "x-payment": paymentHeader },
  });
  if (r.status === 402) {
    return { kind: "unsettled", http: 402, reason: unsettledReason(await readJson(r)) };
  }
  if (r.status >= 200 && r.status < 300) {
    const paymentResponse = r.headers.get("x-payment-response");
    return { kind: "delivered", http: r.status, paymentResponse, settlement: decodeSettlement(paymentResponse) };
  }
  const body = await readJson(r);
  const err =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : null;
  return { kind: "failed", http: r.status, detail: `the paid retry answered HTTP ${r.status}${err ? `: ${err}` : ""}` };
}

export type DoorState =
  | { kind: "idle" }
  | { kind: "signing"; wallet: string }
  | { kind: "paying" }
  | { kind: "delivered"; paymentResponse: string | null; settlement: Settlement | null }
  | { kind: "unsettled"; reason: string }
  | { kind: "rejected"; detail: string }
  | { kind: "wrong-network"; detail: string }
  | { kind: "no-wallet" }
  | { kind: "error"; detail: string };

/** The zero address: buildTypedData's preflight signer, as X402PayButton uses it. */
const PREFLIGHT_SIGNER = "0x0000000000000000000000000000000000000000";

/**
 * payDoor — one settle through one door, exactly as X402PayButton.confirmAndPay does it:
 *   1. buildTypedData(challenge, 0x0) — refuse malformed or expired terms before the wallet opens;
 *   2. signX402Challenge(provider, challenge) — the wallet moves to the challenge's chain and
 *      signs the EIP-3009 authorization; the private key never leaves it;
 *   3. retry the door once with X-PAYMENT and read the outcome.
 * A thrown error is classified by X402PayButton's own classifier.
 */
export async function payDoor(
  args: {
    door: Door;
    challenge: X402Challenge;
    provider: EIP1193Provider;
    walletName: string;
    fetchImpl?: typeof fetch;
    onPhase?: (state: DoorState) => void;
  },
): Promise<DoorState> {
  const { door, challenge, provider, walletName } = args;
  const fetchImpl = args.fetchImpl || fetch;
  const phase = args.onPhase || (() => {});
  try {
    buildTypedData(challenge, PREFLIGHT_SIGNER);
    phase({ kind: "signing", wallet: walletName });
    const signature = await signX402Challenge(provider, challenge);
    phase({ kind: "paying" });
    const outcome = await retryDoorWithPayment(door, signature.header, fetchImpl);
    if (outcome.kind === "delivered") {
      return { kind: "delivered", paymentResponse: outcome.paymentResponse, settlement: outcome.settlement };
    }
    if (outcome.kind === "unsettled") return { kind: "unsettled", reason: outcome.reason };
    return { kind: "error", detail: outcome.detail };
  } catch (error) {
    const classified: PayState = classifyPayError(error);
    if (classified.kind === "rejected") return { kind: "rejected", detail: classified.detail };
    if (classified.kind === "wrong-network") return { kind: "wrong-network", detail: classified.detail };
    if (classified.kind === "error") return { kind: "error", detail: classified.detail };
    return { kind: "error", detail: String((error as Error)?.message ?? error) };
  }
}

/** `?door=<url>` — the coordinator's deep link. Matches the exact url, or the route with any query. */
export function doorFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = params.get("door");
  return raw && raw.trim() ? raw.trim() : null;
}

/** Two spellings of one resource url: same route key, same decoded query entries (any order). */
export function sameResource(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    if (routeKey(a) !== routeKey(b)) return false;
    const q = (u: string) => [...new URL(u).searchParams.entries()].map(([k, v]) => `${k}=${v}`).sort();
    const qa = q(a);
    const qb = q(b);
    return qa.length === qb.length && qa.every((e, i) => e === qb[i]);
  } catch {
    return false;
  }
}

export function selectDoor(doors: Door[], wanted: string | null): Door | null {
  if (!wanted) return null;
  return (
    doors.find((d) => d.url === wanted) ||
    doors.find((d) => d.routeKey === routeKey(wanted)) ||
    doors.find((d) => new URL(d.url).pathname === wanted) ||
    null
  );
}

/** What /api/x402-listing returns — the shape functions/api/x402-listing.ts writes. */
export type ListingReading = {
  kind: "MEASURED" | "UNCHECKABLE";
  as_of: string;
  index?: { name: string; url: string };
  declared_total?: number | null;
  scanned?: number;
  absence_determinate: boolean;
  rows: { resource: string; route_key?: string; last_updated: string | null; amount?: string | null; max_timeout_seconds?: number | null }[];
  reason?: string | null;
};

export type Listing =
  | { status: "LISTED"; lastUpdated: string | null; asOf: string; amount: string | null; maxTimeoutSeconds: number | null }
  | { status: "NOT_LISTED"; asOf: string; scanned: number | null; declared: number | null }
  | { status: "UNCHECKABLE"; reason: string };

/**
 * rowForDoor — the row that describes a door, from any reading keyed by url. A door is its FULL
 * url; an index or a settlement record may have written the bare path (the settle envelope
 * stripped the query until 2026-09-22) or the full url. Prefer the exact row, accept the
 * route-key row — the same rule as functions/api/x402-listing.ts rowForDoor. `exact` says which.
 */
export function rowForDoor<T>(rows: T[] | null | undefined, door: Door, urlOf: (row: T) => string | undefined | null): { row: T; exact: boolean } | null {
  const list = Array.isArray(rows) ? rows : [];
  const url = (r: T) => {
    const u = urlOf(r);
    return typeof u === "string" ? u : "";
  };
  const exact = list.find((r) => url(r) !== "" && sameResource(url(r), door.url));
  if (exact) return { row: exact, exact: true };
  const byRoute = list.find((r) => url(r) !== "" && routeKey(url(r)) === door.routeKey);
  return byRoute ? { row: byRoute, exact: false } : null;
}

/** Per-door reading of the index: listed with its last_updated, absent (only if determinate), or unknown. */
export function listingFor(door: Door, reading: ListingReading | null | undefined): Listing {
  if (!reading) return { status: "UNCHECKABLE", reason: "the index has not been read" };
  const rows = Array.isArray(reading.rows) ? reading.rows : [];
  const hit = rowForDoor(rows, door, (r) => r.resource)?.row;
  if (hit) {
    return {
      status: "LISTED",
      lastUpdated: hit.last_updated ?? null,
      asOf: reading.as_of,
      amount: hit.amount ?? null,
      maxTimeoutSeconds: hit.max_timeout_seconds ?? null,
    };
  }
  if (reading.kind === "MEASURED" && reading.absence_determinate) {
    return {
      status: "NOT_LISTED",
      asOf: reading.as_of,
      scanned: typeof reading.scanned === "number" ? reading.scanned : null,
      declared: typeof reading.declared_total === "number" ? reading.declared_total : null,
    };
  }
  return { status: "UNCHECKABLE", reason: reading.reason || "the index was not read in full; absence would be a guess" };
}

/** A block-explorer link for the settle transaction, only for a chain this page can name. */
export function explorerTxUrl(network: string | null, tx: string | null): string | null {
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx)) return null;
  if (network === "eip155:8453" || network === "base") return `https://basescan.org/tx/${tx}`;
  return null;
}

/** Doors still worth walking: quoted with a challenge and not yet delivered. */
export function remainingDoors(
  doors: Door[],
  quotes: Record<string, QuoteOutcome | "reading" | undefined>,
  states: Record<string, DoorState | undefined>,
): Door[] {
  return doors.filter((d) => {
    const q = quotes[d.url];
    return q !== undefined && q !== "reading" && q.kind === "challenge" && states[d.url]?.kind !== "delivered";
  });
}

/** What /api/x402-listing-402index returns — the shape functions/api/x402-listing-402index.ts writes. */
export type Index402Reading = {
  kind: "MEASURED" | "UNCHECKABLE";
  as_of: string;
  index?: { name: string; url: string; query?: string };
  declared_total?: number | null;
  scanned?: number;
  absence_determinate: boolean;
  rows: { url: string; route_key?: string; health_status?: string | null; last_checked?: string | null; domain_verified?: boolean | null }[];
  reason?: string | null;
};

export type Index402Listing =
  | { status: "LISTED"; health: string | null; lastChecked: string | null; domainVerified: boolean | null; asOf: string; exact: boolean }
  | { status: "NOT_LISTED"; asOf: string; scanned: number | null; declared: number | null }
  | { status: "UNCHECKABLE"; reason: string };

/** Per-door reading of the 402 Index: listed with its health word, absent (only if determinate), or unknown. */
export function index402For(door: Door, reading: Index402Reading | null | undefined): Index402Listing {
  if (!reading) return { status: "UNCHECKABLE", reason: "the 402 Index has not been read" };
  const hit = rowForDoor(reading.rows, door, (r) => r.url);
  if (hit) {
    return {
      status: "LISTED",
      health: hit.row.health_status ?? null,
      lastChecked: hit.row.last_checked ?? null,
      domainVerified: typeof hit.row.domain_verified === "boolean" ? hit.row.domain_verified : null,
      asOf: reading.as_of,
      exact: hit.exact,
    };
  }
  if (reading.kind === "MEASURED" && reading.absence_determinate) {
    return {
      status: "NOT_LISTED",
      asOf: reading.as_of,
      scanned: typeof reading.scanned === "number" ? reading.scanned : null,
      declared: typeof reading.declared_total === "number" ? reading.declared_total : null,
    };
  }
  return { status: "UNCHECKABLE", reason: reading.reason || "the 402 Index was not read in full; absence would be a guess" };
}

/** What /api/door-settles returns — the shape functions/api/door-settles.ts writes. */
export type DoorSettlesReading = {
  kind: "MEASURED" | "UNMEASURED";
  as_of: string;
  rows: { resource: string; route_key?: string; last_settle: string; tx?: string | null; network?: string | null; self?: boolean | null; zero_value?: boolean | null; settles?: number }[];
  reason?: string | null;
};

/**
 * A door's last settle as THIS SITE recorded it. `lastSettle` is null — UNMEASURED — for a door
 * with no record and for a store that could not be read; both are delist risk, and the reason
 * says which. Nothing here turns a listing row or a manifest entry into a date.
 */
export type SettleReading =
  | { status: "SETTLED"; lastSettle: string; tx: string | null; network: string | null; self: boolean | null; settles: number | null; asOf: string; exact: boolean }
  | { status: "NONE_ON_RECORD"; lastSettle: null; asOf: string }
  | { status: "UNMEASURED"; lastSettle: null; reason: string };

export function settleFor(door: Door, reading: DoorSettlesReading | null | undefined): SettleReading {
  if (!reading) return { status: "UNMEASURED", lastSettle: null, reason: "the settlement records have not been read" };
  if (reading.kind !== "MEASURED") {
    return { status: "UNMEASURED", lastSettle: null, reason: reading.reason || "the settlement records could not be read" };
  }
  const hit = rowForDoor(reading.rows, door, (r) => r.resource);
  if (!hit || typeof hit.row.last_settle !== "string" || !Number.isFinite(Date.parse(hit.row.last_settle))) {
    return { status: "NONE_ON_RECORD", lastSettle: null, asOf: reading.as_of };
  }
  return {
    status: "SETTLED",
    lastSettle: hit.row.last_settle,
    tx: hit.row.tx ?? null,
    network: hit.row.network ?? null,
    self: typeof hit.row.self === "boolean" ? hit.row.self : null,
    settles: typeof hit.row.settles === "number" ? hit.row.settles : null,
    asOf: reading.as_of,
    exact: hit.exact,
  };
}

/**
 * SETTLEMENT-FRESHNESS HEURISTIC. The page uses a 30-day internal review window and
 * turns a door red at 25 days. This does not assert an index's delisting rule. Risk is true when
 * the last settle is null (UNMEASURED — nothing on record is not "recent"), unparseable, or
 * 25 days or more before `now`. At exactly 25 days it is red; one millisecond short is not.
 */
export const DELIST_AFTER_DAYS = 30;
export const DELIST_RISK_DAYS = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

export function delistRisk(lastSettle: string | null | undefined, now: number | Date): boolean {
  if (!lastSettle) return true;
  const at = Date.parse(lastSettle);
  if (!Number.isFinite(at)) return true;
  const nowMs = typeof now === "number" ? now : now.getTime();
  return nowMs - at >= DELIST_RISK_DAYS * DAY_MS;
}

/** Whole days since an instant, floored; null when the instant is unreadable. For the cell's copy only. */
export function daysSince(iso: string | null | undefined, now: number | Date): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return null;
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.floor((nowMs - at) / DAY_MS);
}

/** The running tally of a Settle-all walk, read off the door states — nothing is counted twice. */
export type WalkTally = { queued: number; delivered: number; unsettled: number; rejected: number; failed: number; pending: number };

export function walkTally(queue: string[], states: Record<string, DoorState | undefined>): WalkTally {
  const t: WalkTally = { queued: queue.length, delivered: 0, unsettled: 0, rejected: 0, failed: 0, pending: 0 };
  for (const url of queue) {
    const k = states[url]?.kind;
    if (k === "delivered") t.delivered++;
    else if (k === "unsettled") t.unsettled++;
    else if (k === "rejected") t.rejected++;
    else if (k === "error" || k === "wrong-network" || k === "no-wallet") t.failed++;
    else t.pending++;
  }
  return t;
}
