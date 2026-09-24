import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { setPageMetadata } from "@/lib/utils";
import {
  chainIdFromNetwork,
  discoverEIP6963,
  formatPaymentAmount,
  type EIP6963ProviderDetail,
  type X402Challenge,
} from "@/lib/x402Wallet";
import {
  LISTING_PATH,
  MANIFEST_PATH,
  THE_LINE,
  doorFromSearch,
  doorsFromManifest,
  explorerTxUrl,
  listingFor,
  payDoor,
  quoteDoor,
  remainingDoors,
  selectDoor,
  type Door,
  type DoorState,
  type Listing,
  type ListingReading,
  type QuoteOutcome,
} from "@/lib/payEveryDoor";

/**
 * /pay-all — pay every x402 door of the estate from the owner's own wallet, one click each.
 *
 * WHY. An x402 index catalogues a resource only off a CONFIRMED SETTLE through its facilitator
 * (docs/product/X402-BAZAAR-AUDIT.md). There is no registration call. The manifest can be
 * perfect and the door invisible until someone settles through it. This page is the someone.
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

export function ListingCell({ listing }: { listing: Listing }) {
  if (listing.status === "LISTED") {
    return (
      <p className="text-[11px] leading-relaxed text-emerald-800" data-testid="pay-listing">
        <span className="font-semibold">LISTED</span> in the PayAI index
        {listing.lastUpdated ? <> · last updated {listing.lastUpdated}</> : <> · no last_updated on the row</>}
        <span className="block text-slate-500">index read {listing.asOf}</span>
      </p>
    );
  }
  if (listing.status === "NOT_LISTED") {
    return (
      <p className="text-[11px] leading-relaxed text-amber-800" data-testid="pay-listing">
        <span className="font-semibold">NOT LISTED</span> in the PayAI index
        <span className="block text-slate-500">
          read in full {listing.asOf}
          {listing.scanned !== null && listing.declared !== null ? ` · ${listing.scanned} of ${listing.declared} rows` : ""}
        </span>
      </p>
    );
  }
  return (
    <p className="text-[11px] leading-relaxed text-slate-600" data-testid="pay-listing">
      <span className="font-semibold">UNCHECKABLE</span> · {listing.reason}
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
    case "error":
      return (
        <p className="text-[12px] text-amber-800" data-testid="pay-state">
          <span className="font-semibold">NOT SETTLED.</span> {state.detail}
        </p>
      );
  }
}

export function DoorCard({
  door,
  quote,
  state,
  listing,
  busy,
  onPay,
}: {
  door: Door;
  quote: QuoteOutcome | "reading" | undefined;
  state: DoorState;
  listing: Listing;
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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
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
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Listing</p>
          <div className="mt-1.5">
            <ListingCell listing={listing} />
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
  const [walking, setWalking] = useState<{ at: number; of: number } | null>(null);
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
        await Promise.all(
          list.map(async (d) => {
            const q = await quoteDoor(d);
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
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = doors ? selectDoor(doors, wanted) : null;
  const visible = doors ? (selected ? [selected] : doors) : [];
  const readingValue = reading === "reading" ? null : reading;
  const remaining = doors ? remainingDoors(visible, quotes, states).length : null;
  const walkingNow = walking !== null;

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

  /** Walk the remaining doors one by one; each waits for its own wallet confirmation. */
  async function onPayAll() {
    if (busyRef.current || !doors) return;
    busyRef.current = true;
    setWalkNote(null);
    try {
      const queue = remainingDoors(visible, quotes, states);
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
        in your wallet and retries the door once. An index catalogues a door only after a confirmed settle, so this is how a
        door becomes findable: not by describing it, by paying it.
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onPayAll()}
          disabled={!doors || walkingNow || remaining === 0}
          data-testid="pay-all"
          className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {walkingNow ? `Paying door ${walking!.at} of ${walking!.of}…` : "Pay all remaining"}
        </button>
        <span className="text-[12px] text-slate-600">
          {doors === null && !manifestError
            ? "Reading the manifest…"
            : manifestError
              ? null
              : `${visible.length} door${visible.length === 1 ? "" : "s"} declared · ${remaining} with a live challenge not yet delivered`}
        </span>
      </div>
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
          Index read: UNCHECKABLE · {reading.reason}
        </p>
      ) : reading !== "reading" && reading ? (
        <p className="mt-3 text-[11px] text-slate-600" data-testid="pay-index-note">
          Index read {reading.as_of}: {reading.scanned} of {reading.declared_total} rows in the PayAI index
          {reading.absence_determinate ? " (read in full — absence is a finding)" : " (not read in full — absence is not a finding)"}.
          The Coinbase CDP index is not read here; settles do not yet route through it.
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
          Measurement, not a mark: paying a door catalogues it in an index; it grades nothing and proves nothing about the artefact
          beyond the settle reference shown.
        </p>
      </section>
    </main>
  );
}
