import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { setPageMetadata } from "@/lib/utils";
import { addMyResult, downloadText, paidResult, seedChecker, signedRecordOf, VERIFY_SEED_HREF } from "@/lib/myResults";
import {
  chainIdFromNetwork,
  discoverEIP6963,
  formatPaymentAmount,
  type EIP6963ProviderDetail,
  type X402Challenge,
} from "@/lib/x402Wallet";
import {
  DELIST_AFTER_DAYS,
  DELIST_RISK_DAYS,
  DOOR_SETTLES_PATH,
  FOUR02_LISTING_PATH,
  LISTING_PATH,
  MANIFEST_PATH,
  QUOTES_PATH,
  MAYBE_SETTLED_LINE,
  THE_LINE,
  daysSince,
  delistRisk,
  doorFromSearch,
  doorsFromManifest,
  explorerTxUrl,
  index402For,
  listingFor,
  payDoor,
  quoteDoor,
  relayedFetch,
  remainingDoors,
  doorForLink,
  settleFor,
  walkTally,
  type Door,
  type DoorSettlesReading,
  type DoorState,
  type Index402Listing,
  type Index402Reading,
  type Listing,
  type ListingReading,
  type QuoteOutcome,
  type RelayedQuote,
  type SettleReading,
} from "@/lib/payEveryDoor";

/**
 * /pay-all — pay every x402 door of the estate from the owner's own wallet, one click each.
 *
 * WHY. A successful settle can create a facilitator record used by settlement-based
 * discovery. The 402 Index is a separate directory with its own listing and health state.
 * Neither a manifest entry nor an index row proves an independent buyer.
 *
 * WHAT IT READS, NEVER TYPES. The door list is /.well-known/x402.json, live. Each door's terms
 * — amount, asset, network, payTo — are its own 402 challenge, live. The listing column is the
 * PayAI discovery index, read live by /api/x402-listing (the browser cannot read the index
 * directly: no CORS grant, probed 2026-09-22). Nothing on this page is a price we wrote down.
 *
 * WHAT IT SHARES WITH /tools. The wallet path is X402PayButton's, function for function:
 * buildTypedData preflight → discoverEIP6963 → signX402Challenge → one retry with the signed
 * payload. See client/src/lib/payEveryDoor.ts. This page never sees a private key; it sends
 * only the signed payment payload, and only to the door that issued the challenge.
 *
 * THREE OUTCOMES AND NO FOURTH. DELIVERED with whatever settle reference the door echoed;
 * UNSETTLED when the door answered 402 again, with the facilitator's reason verbatim; REJECTED
 * when the wallet declined, in which case nothing was sent and nothing was charged.
 *
 * THE STATUS COLUMN (2026-09-22, the owner's build spec §D). Three cells per door, each from its
 * own reader: PayAI indexed (/api/x402-listing), 402 Index listed with the index's health word
 * (/api/x402-listing-402index), and the last settle THIS SITE recorded (/api/door-settles, the
 * same settled:tx:* records /api/revenue counts). The site's settlement-freshness warning
 * uses DELIST_AFTER_DAYS as a review window and turns red at DELIST_RISK_DAYS, or when there is
 * nothing on record — null is UNMEASURED, never "recent". This is a heuristic, not an index
 * delisting policy. "Settle all" walks each live challenge through the same one-settle path,
 * one wallet confirmation each, and keeps a running tally.
 */

const TITLE = "Pay every x402 door — one settle each | Council of AI";
const DESCRIPTION =
  "Pay each x402 door of the estate once from your own wallet. Terms come from each live 402 challenge; the listing column is the PayAI index, read live.";

function shortHex(value: string | null, keep = 6): string {
  if (!value) return "—";
  return value.length > keep * 2 + 2 ? `${value.slice(0, keep + 2)}…${value.slice(-keep)}` : value;
}

function doorLabel(door: Door): string {
  try {
    return new URL(door.url).pathname.replace(/^\/api\//, "");
  } catch {
    return door.url;
  }
}

/** The 402's own terms, as it states them. */
export function ChallengeSummary({ challenge }: { challenge: X402Challenge }) {
  const network = challenge.accepted?.network || challenge.network || "—";
  let chain: number | null = null;
  try {
    chain = chainIdFromNetwork(network);
  } catch {
    chain = null;
  }
  return (
    <dl className="grid gap-x-3 gap-y-0.5 text-[11px] leading-relaxed text-slate-700 sm:grid-cols-[5.5rem_1fr]" data-testid="pay-challenge">
      <dt className="font-semibold">Amount</dt>
      <dd>{formatPaymentAmount(challenge)}</dd>
      <dt className="font-semibold">Network</dt>
      <dd>
        {network}
        {chain !== null ? ` (chain ${chain})` : ""}
      </dd>
      <dt className="font-semibold">Pay to</dt>
      <dd className="break-all font-mono">{challenge.accepted?.payTo || challenge.payTo}</dd>
      <dt className="font-semibold">Asset</dt>
      <dd className="break-all font-mono">{challenge.accepted?.asset || challenge.asset || "—"}</dd>
    </dl>
  );
}

/** PayAI indexed: yes / no / UNVERIFIED — the index's own row, with its last_updated. */
export function ListingCell({ listing }: { listing: Listing }) {
  if (listing.status === "LISTED") {
    return (
      <p className="text-[11px] leading-relaxed text-emerald-800" data-testid="pay-listing" data-status="yes">
        <span className="font-semibold">Yes</span> · LISTED in the PayAI index
        {listing.lastUpdated ? <> · last updated {listing.lastUpdated}</> : <> · no last_updated on the row</>}
        <span className="block text-slate-500">index read {listing.asOf}</span>
      </p>
    );
  }
  if (listing.status === "NOT_LISTED") {
    return (
      <p className="text-[11px] leading-relaxed text-amber-800" data-testid="pay-listing" data-status="no">
        <span className="font-semibold">No</span> · NOT LISTED in the PayAI index
        <span className="block text-slate-500">
          read in full {listing.asOf}
          {listing.scanned !== null && listing.declared !== null ? ` · ${listing.scanned} of ${listing.declared} rows` : ""}
        </span>
      </p>
    );
  }
  return (
    <p className="text-[11px] leading-relaxed text-slate-600" data-testid="pay-listing" data-status="unverified">
      <span className="font-semibold">UNVERIFIED</span> · UNCHECKABLE · {listing.reason}
    </p>
  );
}

/** 402 Index listed: yes with the index's health word / no / UNVERIFIED. */
export function Index402Cell({ listing }: { listing: Index402Listing }) {
  if (listing.status === "LISTED") {
    const healthy = listing.health === "healthy";
    return (
      <p className={`text-[11px] leading-relaxed ${healthy ? "text-emerald-800" : "text-amber-800"}`} data-testid="pay-status-402index" data-status="yes">
        <span className="font-semibold">Yes</span> · listed · health{" "}
        <span className="font-semibold">{listing.health || "not stated by the index"}</span>
        {listing.lastChecked ? <> · last checked {listing.lastChecked}</> : <> · no last_checked on the row</>}
        {listing.exact ? null : <> · matched on the route, not the exact url</>}
        <span className="block text-slate-500">
          search read {listing.asOf}
          {listing.domainVerified === false ? " · domain_verified: no (as the index reports it)" : listing.domainVerified === true ? " · domain_verified: yes" : ""}
        </span>
      </p>
    );
  }
  if (listing.status === "NOT_LISTED") {
    return (
      <p className="text-[11px] leading-relaxed text-amber-800" data-testid="pay-status-402index" data-status="no">
        <span className="font-semibold">No</span> · not listed in the 402 Index
        <span className="block text-slate-500">
          search read in full {listing.asOf}
          {listing.scanned !== null && listing.declared !== null ? ` · ${listing.scanned} of ${listing.declared} rows` : ""}
        </span>
      </p>
    );
  }
  return (
    <p className="text-[11px] leading-relaxed text-slate-600" data-testid="pay-status-402index" data-status="unverified">
      <span className="font-semibold">UNVERIFIED</span> · UNCHECKABLE · {listing.reason}
    </p>
  );
}

const DELIST_RISK_TEXT = "delist risk";

/**
 * Last settle: the instant this site recorded, or null. Red — with the words "delist risk" — when
 * the last settle is DELIST_RISK_DAYS or more ago, or there is none on record. A door DELIVERED
 * on this page in this session shows that settle instead: it is newer than anything on record.
 */
export function SettleCell({ settle, state, now }: { settle: SettleReading; state: DoorState; now: number }) {
  if (state.kind === "delivered") {
    const tx = state.settlement?.transaction ?? null;
    return (
      <p className="text-[11px] leading-relaxed text-emerald-800" data-testid="pay-status-settle" data-risk="false">
        <span className="font-semibold">Settled this session</span>
        {tx ? <> · tx <code className="break-all font-mono">{shortHex(tx)}</code></> : <> · the facilitator named no transaction</>}
        <span className="block text-slate-500">this page's own observation, ahead of the site's records</span>
      </p>
    );
  }
  if (settle.status === "SETTLED") {
    const risk = delistRisk(settle.lastSettle, now);
    const days = daysSince(settle.lastSettle, now);
    const explorer = explorerTxUrl(settle.network, settle.tx);
    return (
      <p className={`text-[11px] leading-relaxed ${risk ? "text-red-800" : "text-emerald-800"}`} data-testid="pay-status-settle" data-risk={risk ? "true" : "false"}>
        <span className="font-semibold">{settle.lastSettle.slice(0, 10)}</span>
        {days !== null ? <> · {days} day{days === 1 ? "" : "s"} ago</> : null}
        {risk ? (
          <>
            {" "}
            · <span className="font-bold uppercase tracking-wide">{DELIST_RISK_TEXT}</span> — this site's settlement-freshness warning; check each index's listing status separately
          </>
        ) : null}
        <span className="block text-slate-500">
          {settle.tx ? (
            <>
              tx{" "}
              {explorer ? (
                <a href={explorer} target="_blank" rel="noreferrer" className="font-mono underline">
                  {shortHex(settle.tx)}
                </a>
              ) : (
                <code className="font-mono">{shortHex(settle.tx)}</code>
              )}
            </>
          ) : (
            "no transaction on the record"
          )}
          {settle.self === true ? " · self-funded heartbeat, not a buyer" : ""}
          {settle.exact ? "" : " · matched on the route, not the exact url"}
          {" · records read "}
          {settle.asOf}
        </span>
      </p>
    );
  }
  if (settle.status === "NONE_ON_RECORD") {
    return (
      <p className="text-[11px] leading-relaxed text-red-800" data-testid="pay-status-settle" data-risk="true">
        <span className="font-semibold">None on record</span> · UNMEASURED ·{" "}
        <span className="font-bold uppercase tracking-wide">{DELIST_RISK_TEXT}</span>
        <span className="block text-slate-500">no settlement record for this door on this site as of {settle.asOf}; nothing is inferred from a listing</span>
      </p>
    );
  }
  return (
    <p className="text-[11px] leading-relaxed text-red-800" data-testid="pay-status-settle" data-risk="true">
      <span className="font-semibold">UNMEASURED</span> ·{" "}
      <span className="font-bold uppercase tracking-wide">{DELIST_RISK_TEXT}</span> · {settle.reason}
    </p>
  );
}

/** The three outcomes, plus the states on the way to them. */
export function OutcomeLine({ state }: { state: DoorState }) {
  switch (state.kind) {
    case "idle":
      return null;
    case "signing":
      return (
        <p className="text-[12px] text-slate-700" data-testid="pay-state">
          Approve the exact terms in {state.wallet}…
        </p>
      );
    case "paying":
      return (
        <p className="text-[12px] text-slate-700" data-testid="pay-state">
          Retrying the door once with the signed payment…
        </p>
      );
    case "delivered": {
      const tx = state.settlement?.transaction ?? null;
      const explorer = explorerTxUrl(state.settlement?.network ?? null, tx);
      return (
        <div className="text-[12px] text-emerald-800" data-testid="pay-state">
          <p>
            <span className="font-semibold">DELIVERED.</span>{" "}
            {state.paymentResponse
              ? "The door echoed the facilitator's X-PAYMENT-RESPONSE:"
              : "The door delivered but echoed no X-PAYMENT-RESPONSE. Delivery is not proof of settlement."}
          </p>
          {state.settlement ? (
            <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-[11px] sm:grid-cols-[5.5rem_1fr]">
              <dt className="font-semibold">Transaction</dt>
              <dd className="break-all font-mono">
                {explorer ? (
                  <a href={explorer} target="_blank" rel="noreferrer" className="underline">
                    {tx}
                  </a>
                ) : (
                  tx || "not named by the facilitator"
                )}
              </dd>
              <dt className="font-semibold">Network</dt>
              <dd>{state.settlement.network || "—"}</dd>
              <dt className="font-semibold">Payer</dt>
              <dd className="break-all font-mono">{state.settlement.payer || "—"}</dd>
            </dl>
          ) : state.paymentResponse ? (
            <p className="mt-1 text-[11px] text-slate-600">
              The receipt value did not decode as JSON here; it is shown opaque: <code className="break-all">{shortHex(state.paymentResponse, 12)}</code>
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-600">
            The reference above is the facilitator's claim as the door relayed it, verified by nothing on this page.
          </p>
          <DeliveredRecord body={state.body} />
        </div>
      );
    }
    case "unsettled":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          <span className="font-semibold">UNSETTLED.</span> The door answered 402 again. Facilitator's reason, verbatim:{" "}
          <q className="font-mono">{state.reason}</q>
        </p>
      );
    case "rejected":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          <span className="font-semibold">REJECTED.</span> {state.detail}
        </p>
      );
    case "wrong-network":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          <span className="font-semibold">WRONG NETWORK.</span> {state.detail} Switch the wallet to the chain the challenge names and pay again.
        </p>
      );
    case "no-wallet":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          No EIP-6963 wallet announced itself. Install or unlock a browser wallet — this page cannot pay on your behalf.
        </p>
      );
    case "maybe-settled": {
      const tx = state.settlement?.transaction ?? null;
      const explorer = explorerTxUrl(state.settlement?.network ?? null, tx);
      return (
        <div className="text-[12px] text-amber-900" data-testid="pay-state">
          <p>
            <span className="font-semibold">PAYMENT MAY HAVE SETTLED.</span> {MAYBE_SETTLED_LINE} The door said: {state.detail}.
          </p>
          {tx ? (
            <p className="mt-1 break-all text-[11px]">
              Transaction{" "}
              {explorer ? (
                <a href={explorer} target="_blank" rel="noreferrer" className="font-mono underline">
                  {tx}
                </a>
              ) : (
                <code className="font-mono">{tx}</code>
              )}
            </p>
          ) : null}
          {state.refund ? <p className="mt-1 text-[11px]">{state.refund}</p> : null}
        </div>
      );
    }
    case "error":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          <span className="font-semibold">NOT SETTLED.</span> {state.detail}
        </p>
      );
  }
}

/**
 * What the payer bought, kept (paid-route lane, 7 Oct 2026). The door's 200 body used to be dropped
 * here, so a paid art50 pack was shown as DELIVERED with nothing to keep or check. Now: the signed
 * record's id, a download of exactly what the door returned, the free check, and My results (where
 * payOne has already saved it, in this browser only).
 */
export function DeliveredRecord({ body }: { body: unknown }) {
  if (body === undefined) return null;
  const rec = signedRecordOf(body);
  const text = rec ? JSON.stringify(rec, null, 2) : null;
  const name = `csoai-delivered-${rec ? rec.sha256.slice(0, 12) : "response"}.json`;
  return (
    <div className="mt-2 rounded-lg border border-emerald-700/25 bg-emerald-50 px-3 py-2 text-[12px] text-slate-800" data-testid="pay-delivered-record">
      {rec ? (
        <p>
          <span className="font-semibold">What you bought:</span> a {rec.sig_ed25519 ? "signed" : "unsigned"} record, id{" "}
          <code className="break-all font-mono">{rec.sha256}</code>. It is saved to My results in this browser only, so download it to keep it.
        </p>
      ) : (
        <p>
          <span className="font-semibold">What you bought:</span> the door's answer, which carries no signed record to check. Download it to keep it.
        </p>
      )}
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        <button type="button" onClick={() => downloadText(JSON.stringify(body, null, 2), name)} className="min-h-11 font-semibold text-emerald-900 underline">
          Download what was delivered (JSON)
        </button>
        {text ? (
          <a href={VERIFY_SEED_HREF} onClick={() => seedChecker(text)} className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" data-testid="pay-check-genuine">
            Check it is genuine →
          </a>
        ) : null}
        <a href="/dashboard?tab=mine" className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline">
          Open My results
        </a>
      </div>
    </div>
  );
}

export function DoorCard({
  door,
  quote,
  state,
  listing,
  index402,
  settle,
  now,
  busy,
  onPay,
}: {
  door: Door;
  quote: QuoteOutcome | "reading" | undefined;
  state: DoorState;
  listing: Listing;
  index402: Index402Listing;
  settle: SettleReading;
  now: number;
  busy: boolean;
  onPay: () => void;
}) {
  const payable = quote !== undefined && quote !== "reading" && quote.kind === "challenge";
  const done = state.kind === "delivered";
  return (
    <li className="rounded-xl border border-slate-900/10 bg-white p-4" data-testid="pay-door" data-door={door.url}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">
            <code>{doorLabel(door)}</code>
          </h2>
          <a href={door.url} className="mt-0.5 block break-all text-[11px] text-slate-500 underline-offset-2 hover:underline">
            {door.method} {door.url}
          </a>
          {door.description ? <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-slate-700">{door.description}</p> : null}
          {door.paidFor ? <p className="mt-1 text-[11px] text-slate-500">paid for: {door.paidFor}</p> : null}
        </div>
        <div className="shrink-0">
          {done ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">settled through</span>
          ) : state.kind === "maybe-settled" ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900" data-testid="pay-maybe-settled">
              check wallet first
            </span>
          ) : (
            <button
              type="button"
              onClick={onPay}
              disabled={!payable || busy}
              data-testid="pay-with-wallet"
              className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Pay with wallet
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Live 402 challenge</p>
        <div className="mt-1.5">
          {quote === undefined || quote === "reading" ? (
            <p className="text-[11px] text-slate-600">Reading the door's challenge…</p>
          ) : quote.kind === "challenge" ? (
            <ChallengeSummary challenge={quote.challenge} />
          ) : quote.kind === "no-challenge" ? (
            <p className="text-[11px] text-slate-600">
              <span className="font-semibold">NO CHALLENGE</span> · {quote.detail}
            </p>
          ) : (
            <p className="text-[11px] text-slate-600">
              <span className="font-semibold">UNCHECKABLE</span> · {quote.detail}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3" data-testid="pay-status">
        <div className="min-w-0 rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">PayAI indexed</p>
          <div className="mt-1.5 break-words">
            <ListingCell listing={listing} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">402 Index listed</p>
          <div className="mt-1.5 break-words">
            <Index402Cell listing={index402} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Last settle</p>
          <div className="mt-1.5 break-words">
            <SettleCell settle={settle} state={state} now={now} />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <OutcomeLine state={state} />
      </div>
    </li>
  );
}

export default function PayEveryDoor() {
  const search = useSearch();
  const wanted = doorFromSearch(search);
  const [doors, setDoors] = useState<Door[] | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteOutcome | "reading" | undefined>>({});
  const [states, setStates] = useState<Record<string, DoorState | undefined>>({});
  const [reading, setReading] = useState<ListingReading | null | "reading">("reading");
  const [reading402, setReading402] = useState<Index402Reading | null | "reading">("reading");
  const [settles, setSettles] = useState<DoorSettlesReading | null | "reading">("reading");
  // One clock reading per page load for the delist arithmetic, so every row is judged against the same instant.
  const [now] = useState<number>(() => Date.now());
  const [walking, setWalking] = useState<{ at: number; of: number } | null>(null);
  const [walkQueue, setWalkQueue] = useState<string[]>([]);
  const [walkNote, setWalkNote] = useState<string | null>(null);
  const busyRef = useRef(false);
  const walletRef = useRef<EIP6963ProviderDetail | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setPageMetadata({ title: TITLE, description: DESCRIPTION });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // The door list: the manifest, live. Then every door's own 402, in parallel. Then the index.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(MANIFEST_PATH, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`${MANIFEST_PATH} answered HTTP ${r.status}`);
        const list = doorsFromManifest(await r.json());
        if (cancelled) return;
        setDoors(list);
        setQuotes(Object.fromEntries(list.map((d) => [d.url, "reading" as const])));
        // Each door's own 402, relayed in one 200 so the browser does not log 25 intended 402s as
        // errors. Any door the relay could not read is asked directly, as it always was.
        let relayed: Record<string, RelayedQuote> = {};
        try {
          const rq = await fetch(QUOTES_PATH, { headers: { accept: "application/json" } });
          if (rq.ok) {
            const j = (await rq.json()) as { quotes?: RelayedQuote[] };
            relayed = Object.fromEntries((j.quotes ?? []).map((row) => [row.url, row]));
          }
        } catch {
          /* relay unavailable: every door is asked directly below */
        }
        if (cancelled) return;
        await Promise.all(
          list.map(async (d) => {
            const q = await quoteDoor(d, relayedFetch(relayed[d.url]) ?? fetch);
            if (!cancelled) setQuotes((prev) => ({ ...prev, [d.url]: q }));
          }),
        );
      } catch (e) {
        if (!cancelled) setManifestError((e as Error)?.message || String(e));
      }
    })();
    (async () => {
      try {
        const r = await fetch(LISTING_PATH, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`${LISTING_PATH} answered HTTP ${r.status}`);
        const j = (await r.json()) as ListingReading;
        if (!cancelled) setReading(j);
      } catch (e) {
        if (!cancelled)
          setReading({ kind: "UNCHECKABLE", as_of: new Date().toISOString(), absence_determinate: false, rows: [], reason: (e as Error)?.message || String(e) });
      }
    })();
    (async () => {
      try {
        const r = await fetch(FOUR02_LISTING_PATH, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`${FOUR02_LISTING_PATH} answered HTTP ${r.status}`);
        const j = (await r.json()) as Index402Reading;
        if (!cancelled) setReading402(j);
      } catch (e) {
        if (!cancelled)
          setReading402({ kind: "UNCHECKABLE", as_of: new Date().toISOString(), absence_determinate: false, rows: [], reason: (e as Error)?.message || String(e) });
      }
    })();
    (async () => {
      try {
        const r = await fetch(DOOR_SETTLES_PATH, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`${DOOR_SETTLES_PATH} answered HTTP ${r.status}`);
        const j = (await r.json()) as DoorSettlesReading;
        if (!cancelled) setSettles(j);
      } catch (e) {
        if (!cancelled) setSettles({ kind: "UNMEASURED", as_of: new Date().toISOString(), rows: [], reason: (e as Error)?.message || String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = doors ? doorForLink(doors, wanted) : null;
  const selectedUrl = selected?.url ?? null;

  // A linked door with its own query (doorForLink) is not in the manifest's list, so the load above
  // never read its 402: read it here, directly, like any door the relay could not read.
  useEffect(() => {
    if (!selected || !selectedUrl || quotes[selectedUrl] !== undefined) return;
    let cancelled = false;
    setQuotes((prev) => ({ ...prev, [selectedUrl]: "reading" }));
    quoteDoor(selected).then((q) => {
      if (!cancelled) setQuotes((prev) => ({ ...prev, [selectedUrl]: q }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUrl, doors]);
  const visible = doors ? (selected ? [selected] : doors) : [];
  const readingValue = reading === "reading" ? null : reading;
  const reading402Value = reading402 === "reading" ? null : reading402;
  const settlesValue = settles === "reading" ? null : settles;
  const remaining = doors ? remainingDoors(visible, quotes, states).length : null;
  const walkingNow = walking !== null;
  const tally = walkTally(walkQueue, states);
  const atRisk = doors
    ? visible.filter((d) => states[d.url]?.kind !== "delivered" && delistRisk(settleFor(d, settlesValue).lastSettle, now)).length
    : null;

  const setDoorState = (url: string, state: DoorState) => {
    if (mountedRef.current) setStates((prev) => ({ ...prev, [url]: state }));
  };

  async function wallet(): Promise<EIP6963ProviderDetail | null> {
    if (walletRef.current) return walletRef.current;
    const detail = await discoverEIP6963();
    if (detail?.provider) walletRef.current = detail;
    return detail;
  }

  /** One door, one settle. Returns the final state so the walker can decide whether to continue. */
  async function payOne(door: Door): Promise<DoorState> {
    const q = quotes[door.url];
    if (q === undefined || q === "reading" || q.kind !== "challenge") {
      const s: DoorState = { kind: "error", detail: "no live challenge to pay" };
      setDoorState(door.url, s);
      return s;
    }
    const detail = await wallet();
    if (!detail?.provider) {
      const s: DoorState = { kind: "no-wallet" };
      setDoorState(door.url, s);
      return s;
    }
    const final = await payDoor({
      door,
      challenge: q.challenge,
      provider: detail.provider,
      walletName: detail.info?.name ?? "wallet",
      onPhase: (s) => setDoorState(door.url, s),
    });
    if (final.kind === "delivered") {
      addMyResult(paidResult({ doorUrl: door.url, body: final.body, transaction: final.settlement?.transaction ?? null }));
    }
    setDoorState(door.url, final);
    return final;
  }

  async function onPayOne(door: Door) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await payOne(door);
    } finally {
      busyRef.current = false;
    }
  }

  /**
   * SETTLE ALL — the monthly heartbeat. Walk every door with a live challenge that has not been
   * delivered, one by one; each waits for its own wallet confirmation, and the tally is read off
   * the door states as they land. A declined wallet stops the walk; the doors after it stay unopened.
   */
  async function onPayAll() {
    if (busyRef.current || !doors) return;
    busyRef.current = true;
    setWalkNote(null);
    try {
      const queue = remainingDoors(visible, quotes, states);
      setWalkQueue(queue.map((d) => d.url));
      for (let i = 0; i < queue.length; i++) {
        if (!mountedRef.current) return;
        setWalking({ at: i + 1, of: queue.length });
        const final = await payOne(queue[i]);
        if (final.kind === "rejected" || final.kind === "no-wallet") {
          setWalkNote(
            final.kind === "rejected"
              ? `Stopped at ${doorLabel(queue[i])}: you declined in the wallet. The doors after it were not opened.`
              : "Stopped: no wallet announced itself.",
          );
          break;
        }
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setWalking(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">x402 · buyer surface</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Pay every door</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Every x402 resource this estate serves, read from{" "}
        <a href={MANIFEST_PATH} className="underline underline-offset-2">
          {MANIFEST_PATH}
        </a>{" "}
        as it stands now, each with the terms its own live 402 states and a Pay with wallet button that signs those exact terms
        in your wallet and retries the door once. A successful settle can support facilitator-based discovery. The 402 Index
        is a separate directory whose listing status is read independently; neither listing proves an independent buyer.
      </p>
      <p className="mt-3 rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2 text-[12px] font-medium leading-relaxed text-slate-800" data-testid="pay-the-line">
        {THE_LINE}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Amounts, asset, network and recipient are read from each door's challenge at load time; nothing here is a price this page
        wrote down. The wallet is asked to move to the chain the challenge names before it signs. If the wallet declines, nothing is
        sent and nothing is charged. Verification stays free either way.
      </p>

      {selected ? (
        <p className="mt-4 text-[12px] text-slate-700" data-testid="pay-deep-link">
          Showing one door from the link. <Link href="/pay-all" className="underline underline-offset-2">Show every door</Link>
        </p>
      ) : wanted && doors ? (
        <p className="mt-4 text-[12px] text-amber-800" data-testid="pay-deep-link">
          The link named a door the manifest does not declare: <code className="break-all">{wanted}</code>. Every declared door is shown instead.
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-600" data-testid="pay-status-legend">
        Each door carries three status cells: whether the PayAI index holds a row for it, whether the 402 Index lists it and
        the health word that index gives it, and the last settle this site recorded through it. This site uses a {DELIST_AFTER_DAYS}-day
        settlement-review window and flags <q>{DELIST_RISK_TEXT}</q> at {DELIST_RISK_DAYS} days, or when there is nothing on record.
        That flag is a heuristic, not an index's delisting decision; none on record is UNMEASURED, not a recent settle.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onPayAll()}
          disabled={!doors || walkingNow || remaining === 0}
          data-testid="settle-all"
          className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {walkingNow ? `Settling door ${walking!.at} of ${walking!.of}…` : "Settle all"}
        </button>
        <span className="text-[12px] text-slate-600">
          {doors === null && !manifestError
            ? "Reading the manifest…"
            : manifestError
              ? null
              : `${visible.length} door${visible.length === 1 ? "" : "s"} declared · ${remaining} with a live challenge not yet delivered${
                  atRisk !== null && settlesValue ? ` · ${atRisk} at ${DELIST_RISK_TEXT}` : ""
                }`}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Settle all queues every door with a live challenge, in manifest order, through the same one-settle path as each
        door's own button: one wallet confirmation per door, nothing batched, nothing signed in advance. A successful settle
        updates this site's record; check each index's listing status separately. A settle from our own wallet is recorded as a
        self-settlement, never as a buyer.
      </p>
      {walkQueue.length > 0 ? (
        <p className="mt-2 text-[12px] text-slate-700" data-testid="settle-all-tally">
          <span className="font-semibold">Settle all:</span> {tally.delivered} settled · {tally.unsettled} unsettled · {tally.rejected} declined ·{" "}
          {tally.maybe_settled} may have settled (check the wallet) ·{" "}
          {tally.failed} failed · {tally.pending} pending · of {tally.queued} queued
        </p>
      ) : null}
      {walkNote ? (
        <p className="mt-2 text-[12px] text-amber-800" data-testid="pay-walk-note">
          {walkNote}
        </p>
      ) : null}
      {manifestError ? (
        <p className="mt-4 rounded-lg border border-amber-700/25 bg-amber-50 px-3 py-2 text-[12px] text-amber-900" data-testid="pay-manifest-error">
          UNCHECKABLE · the manifest could not be read: {manifestError}
        </p>
      ) : null}

      {reading !== "reading" && reading && reading.kind === "UNCHECKABLE" ? (
        <p className="mt-3 text-[11px] text-slate-600" data-testid="pay-index-note">
          PayAI index read: UNCHECKABLE · {reading.reason}
        </p>
      ) : reading !== "reading" && reading ? (
        <p className="mt-3 text-[11px] text-slate-600" data-testid="pay-index-note">
          PayAI index read {reading.as_of}: {reading.scanned} of {reading.declared_total} rows
          {reading.absence_determinate ? " (read in full — absence is a finding)" : " (not read in full — absence is not a finding)"}.
          The Coinbase CDP index is not read here; settles do not yet route through it.
        </p>
      ) : null}
      {reading402 !== "reading" && reading402 && reading402.kind === "UNCHECKABLE" ? (
        <p className="mt-1 text-[11px] text-slate-600" data-testid="pay-402index-note">
          402 Index read: UNCHECKABLE · {reading402.reason}
        </p>
      ) : reading402 !== "reading" && reading402 ? (
        <p className="mt-1 text-[11px] text-slate-600" data-testid="pay-402index-note">
          402 Index search read {reading402.as_of}: {reading402.scanned} of {reading402.declared_total} rows for {reading402.index?.query || "our host"}
          {reading402.absence_determinate ? " (read in full — absence is a finding within that search)" : " (not read in full — absence is not a finding)"}.
        </p>
      ) : null}
      {settles !== "reading" && settles && settles.kind !== "MEASURED" ? (
        <p className="mt-1 text-[11px] text-slate-600" data-testid="pay-settles-note">
          Settlement records: UNMEASURED · {settles.reason}
        </p>
      ) : settles !== "reading" && settles ? (
        <p className="mt-1 text-[11px] text-slate-600" data-testid="pay-settles-note">
          Settlement records read {settles.as_of}: {settles.rows.length} door{settles.rows.length === 1 ? "" : "s"} with a settle on record on this site.
        </p>
      ) : null}

      <ul className="mt-5 space-y-3" data-testid="pay-doors">
        {visible.map((door) => (
          <DoorCard
            key={door.url}
            door={door}
            quote={quotes[door.url]}
            state={states[door.url] ?? { kind: "idle" }}
            listing={listingFor(door, readingValue)}
            index402={index402For(door, reading402Value)}
            settle={settleFor(door, settlesValue)}
            now={now}
            busy={walkingNow}
            onPay={() => void onPayOne(door)}
          />
        ))}
      </ul>

      <section className="mt-8 border-t border-slate-900/10 pt-4 text-[11px] leading-relaxed text-slate-600">
        <p>
          How this maps to the flow on <Link href="/tools" className="underline underline-offset-2">/tools</Link>: the same wallet
          functions, in the same order — refuse malformed terms before the wallet opens, sign the EIP-3009 authorization under the
          token's own domain, retry once with the signed payload. There the payload is an MCP argument; here it is the X-PAYMENT header
          the door reads. DELIVERED shows whatever X-PAYMENT-RESPONSE the door echoed from the facilitator. UNSETTLED quotes the
          facilitator's reason as the door relayed it. REJECTED means the wallet declined and nothing left this page.
        </p>
        <p className="mt-2">
          Measurement, not a mark: a successful payment can create a facilitator settlement record; check each directory
          listing separately. It grades nothing and proves nothing about the artefact beyond the settle reference shown.
        </p>
      </section>
    </main>
  );
}
