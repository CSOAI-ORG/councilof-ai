import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import {
  readEthRlusdSupply,
  readXrplRlusdSupply,
  RLUSD_ETH_CONTRACT,
  RLUSD_XRPL_CURRENCY_HEX,
  RLUSD_XRPL_ISSUER,
  type ChainReading,
} from "../lib/rlusdReaders";
// Relative import, not "@/data/..." — same reason as estateFacts.ts.
import snapshot from "../data/rlusd-snapshot.json";

/**
 * /rlusd — RLUSD supply on XRPL and Ethereum, read LIVE from public
 * keyless endpoints in the visitor's browser, with a labeled fallback
 * snapshot when a chain cannot be reached.
 *
 * State machine (per chain, independent):
 *   LIVE        — a reader succeeded in THIS session. Value, endpoint,
 *                 ledger/block ref all come from that fetch.
 *   FALLBACK    — every endpoint failed; the labeled snapshot
 *                 (data/rlusd-snapshot.json, as_of 2026-09-12) is shown
 *                 with a FALLBACK badge. Never dressed up as live.
 *   UNCHECKABLE — reader failed AND no snapshot entry applies.
 *
 * A live-looking number never renders unless it came from a successful
 * fetch in this session. Measurement, not certification — not a rating
 * of any issuer.
 */

type ChainState =
  | { status: "loading" }
  | { status: "live"; reading: ChainReading }
  | { status: "fallback"; supply: string; refLabel: string; endpoint: string }
  | { status: "uncheckable" };

function snapshotState(chain: "xrpl" | "ethereum"): ChainState {
  const entry = snapshot[chain];
  if (!entry || typeof entry.supply !== "string" || entry.supply === "") {
    return { status: "uncheckable" };
  }
  const refLabel =
    chain === "xrpl"
      ? `ledger ${snapshot.xrpl.ledger_index}`
      : `block ${snapshot.ethereum.block}`;
  return { status: "fallback", supply: entry.supply, refLabel, endpoint: entry.endpoint_used };
}

function formatDisplay(supply: string): string {
  const n = Number(supply);
  if (!Number.isFinite(n)) return supply;
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function Badge({ tone, children }: { tone: "live" | "fallback" | "uncheckable"; children: ReactNode }) {
  const cls =
    tone === "live"
      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
      : tone === "fallback"
        ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
        : "border-rose-400/50 bg-rose-400/10 text-rose-300";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.18em] ${cls}`}>
      {children}
    </span>
  );
}

function ChainCard({
  title,
  state,
  explainer,
  idLabel,
  idValue,
}: {
  title: string;
  state: ChainState;
  explainer: string;
  idLabel: string;
  idValue: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {state.status === "loading" && <Badge tone="uncheckable">reading…</Badge>}
        {state.status === "live" && <Badge tone="live">LIVE</Badge>}
        {state.status === "fallback" && <Badge tone="fallback">{`FALLBACK · as_of ${snapshot.as_of}`}</Badge>}
        {state.status === "uncheckable" && <Badge tone="uncheckable">UNCHECKABLE</Badge>}
      </div>

      <div className="mt-4">
        {state.status === "loading" && <p className="text-slate-400">Querying public endpoints…</p>}
        {state.status === "live" && (
          <>
            <p className="font-mono text-3xl font-black text-emerald-200">
              {formatDisplay(state.reading.supply)} <span className="text-base font-bold text-slate-400">RLUSD</span>
            </p>
            <p className="mt-2 font-mono text-xs text-slate-400">
              via {state.reading.endpoint}
              {state.reading.refValue !== null && (
                <>
                  {" "}· {state.reading.refKind} {state.reading.refValue.toLocaleString("en-US")}
                </>
              )}
            </p>
          </>
        )}
        {state.status === "fallback" && (
          <>
            <p className="font-mono text-3xl font-black text-amber-200">
              {formatDisplay(state.supply)} <span className="text-base font-bold text-slate-400">RLUSD</span>
            </p>
            <p className="mt-2 font-mono text-xs text-slate-400">
              snapshot via {state.endpoint} · {state.refLabel} · as_of {snapshot.as_of} — NOT live
            </p>
          </>
        )}
        {state.status === "uncheckable" && (
          <p className="text-slate-400">
            No live endpoint answered and no fallback snapshot applies. Nothing is rendered in place
            of a measurement.
          </p>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{explainer}</p>
      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
        {idLabel}: {idValue}
      </p>
    </section>
  );
}

export default function Rlusd() {
  const [xrpl, setXrpl] = useState<ChainState>({ status: "loading" });
  const [eth, setEth] = useState<ChainState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    // Both chains in parallel; each resolves independently to LIVE / FALLBACK / UNCHECKABLE.
    void readXrplRlusdSupply().then((reading) => {
      if (cancelled) return;
      setXrpl(reading ? { status: "live", reading } : snapshotState("xrpl"));
    });
    void readEthRlusdSupply().then((reading) => {
      if (cancelled) return;
      setEth(reading ? { status: "live", reading } : snapshotState("ethereum"));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const supplies: string[] = [];
  if (xrpl.status === "live") supplies.push(xrpl.reading.supply);
  if (xrpl.status === "fallback") supplies.push(xrpl.supply);
  if (eth.status === "live") supplies.push(eth.reading.supply);
  if (eth.status === "fallback") supplies.push(eth.supply);
  const anyFallback = xrpl.status === "fallback" || eth.status === "fallback";
  const combined =
    supplies.length === 2
      ? (Number(supplies[0]) + Number(supplies[1])).toLocaleString("en-US", { maximumFractionDigits: 2 })
      : null;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>RLUSD supply, measured live on both chains | Council of AI</title>
        <meta
          name="description"
          content="RLUSD supply on XRPL and Ethereum, read live from public keyless endpoints with a labeled fallback snapshot. Measurement, not certification — not a rating of any issuer."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Live on-chain measurement · data free, proofs paid
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          RLUSD supply, read live on both chains.
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          This page queries public, keyless endpoints from your browser and shows exactly what
          answered — endpoint, ledger or block, and all. If a chain cannot be reached, you see a
          clearly labeled snapshot instead, never a live-looking number. Measurement, not
          certification — this is not a rating of any issuer.
        </p>

        <div className="mt-8 grid gap-5">
          <ChainCard
            title="XRPL (XRP Ledger)"
            state={xrpl}
            explainer="On XRPL, gateway_balances reports the issuer's obligations — the total IOUs outstanding against the issuing account for this currency, i.e. the RLUSD in circulation on that ledger."
            idLabel="issuer / currency"
            idValue={`${RLUSD_XRPL_ISSUER} · ${RLUSD_XRPL_CURRENCY_HEX}`}
          />
          <ChainCard
            title="Ethereum"
            state={eth}
            explainer="On Ethereum, the ERC-20 contract's totalSupply() returns the number of tokens the contract reports as existing, read here with a plain eth_call at the latest block (18 decimals)."
            idLabel="contract"
            idValue={RLUSD_ETH_CONTRACT}
          />
        </div>

        {combined !== null && (
          <p className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 font-mono text-sm text-slate-200">
            Combined across both chains: <span className="font-black text-emerald-200">{combined} RLUSD</span>
            {anyFallback && <span className="text-amber-300"> (includes FALLBACK snapshot value(s) as_of {snapshot.as_of})</span>}
          </p>
        )}

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-300">
          <p>
            <span className="font-bold text-slate-100">Data free, proofs paid.</span> The readings
            above are free for anyone to re-check against the same public endpoints. If you need a
            signed, per-asset evidence receipt — canonical bytes, Ed25519-signed, citable — that
            exists as a paid machine door at{" "}
            <code className="font-mono text-emerald-300">/api/rwa/evidence</code>. It answers a 402
            challenge; the amount lives at the 402 and is never typed here.
          </p>
          <p>
            The estate's own signed reader at{" "}
            <a href="/api/xrpl" className="font-mono text-emerald-300 underline hover:text-emerald-200">
              /api/xrpl
            </a>{" "}
            lists RLUSD under issuer rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De as an attestation source.
            Its supply field is currently UNMEASURED — we say so rather than cite a number it does
            not carry.
          </p>
          <p>
            A thin, unsigned specimen page about the attestation-narrative gap lives separately at{" "}
            <Link href="/specimens/rlusd" className="text-emerald-300 underline hover:text-emerald-200">
              /specimens/rlusd
            </Link>
            .
          </p>
          <p className="text-slate-400">
            Measurement, not certification. Nothing on this page is a rating, a guarantee, or
            investment advice.
          </p>
        </section>
      </div>
    </main>
  );
}
