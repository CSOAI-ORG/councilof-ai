/**
 * Council Attestation Network — /attestation
 * Route: /attestation
 * Style: match PricingFree / GSPCVerify dark emerald (bg #03110b)
 *
 * LOCKS:
 * - Public names: Council of AI / GSPC / RAS only — no SOVOS / SOVEREIGN / sov-*
 * - Board totals ONLY from live GET /api/gspc (derive axes·measured·unmeasured)
 * - Never certify · never invent scores · never hardcode a disagreeing triple
 * - PayAI/x402 = indexers, not our facilitator product
 * - Human MoR checkout: Coming—named rail only; no fake live Buy on this page
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

type GspcTotals = {
  axes: number;
  measured_axes: number;
  unmeasured_axes: number;
  public_count?: string;
};

type GspcPayload = {
  totals?: GspcTotals;
  schema?: string;
};

const PIPELINE = [
  {
    k: "1 · Measure",
    v: "Frozen banks on pods. Empty cells stay empty until a published run exists. Living board from GET /api/gspc — never typed into marketing.",
  },
  {
    k: "2 · Sign",
    v: "Keystone card (≤3KB), Ed25519 under did:web:csoai.org. A signature attests published bytes — not a re-measurement, not a conformity mark.",
  },
  {
    k: "3 · Root",
    v: "Public merkle root at /root.json. Inclusion proofs stay checkable. Card / root / index counts stay separate — never fused.",
  },
  {
    k: "4 · Anchor",
    v: "Irys L1 bundler witness of the published root. OpenTimestamps / Rekor atom-anchor remain planned — cite a Bitcoin block only when one exists.",
  },
] as const;

const NEVERS = [
  "We measure; we do not certify.",
  "We never invent board scores or fill empty cells for copy.",
  "We never sell a grade, rank, or pass/fail.",
  "PayAI / x402 facilitators index us; they are not our product.",
  "Public names: Council of AI · GSPC · RAS only.",
] as const;

function BoardTriple({ totals }: { totals: GspcTotals | null }) {
  if (!totals) {
    return (
      <p className="font-mono text-sm text-slate-400">
        Loading living board from <code>GET /api/gspc</code>…
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
        Living GSPC · derived totals · GET /api/gspc
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-50">
        {totals.public_count || `${totals.axes} axis · ${totals.measured_axes} measured`}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        unmeasured_axes={totals.unmeasured_axes} — first-class empty, not a score
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Hub cite: re-GET{" "}
        <code>/api/hub-cards</code> at spray time (stamp drifts; never paste a stale triple).
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a href="/api/gspc" className="text-emerald-300 underline-offset-2 hover:underline">
          GET /api/gspc
        </a>
        <Link href="/gspc-scoreboard" className="text-emerald-300 underline-offset-2 hover:underline">
          Scoreboard
        </Link>
        <Link href="/methodology" className="text-emerald-300 underline-offset-2 hover:underline">
          Methodology
        </Link>
      </div>
    </div>
  );
}

export default function AttestationNetwork() {
  const [totals, setTotals] = useState<GspcTotals | null>(null);
  const [boardErr, setBoardErr] = useState(false);

  useEffect(() => {
    document.title = "Council Attestation Network | Council of AI";
    setMetaDescription(
      "Measure → sign → root → anchor. Verify free forever. Agents settle signed recordings over x402; human MoR checkout is Coming—named rail only. Living board from GET /api/gspc. Measurement, never certification.",
    );
  }, []);

  useEffect(() => {
    let ok = true;
    fetch("/api/gspc")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: GspcPayload) => {
        if (!ok) return;
        if (d?.totals && typeof d.totals.axes === "number") {
          setTotals({
            axes: d.totals.axes,
            measured_axes: d.totals.measured_axes,
            unmeasured_axes: d.totals.unmeasured_axes,
            public_count: d.totals.public_count,
          });
        } else {
          setBoardErr(true);
        }
      })
      .catch(() => {
        if (ok) setBoardErr(true);
      });
    return () => {
      ok = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b]">
      <main className="mx-auto max-w-5xl px-5 py-14 text-slate-100 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
          Council of AI · GSPC · living attestation
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight">
          Council Attestation Network
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
          We measure behaviour, sign the recording, publish a public root, and anchor the witness.
          Verification is free forever. A grade is never sold. We do not certify.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          The product is the signed path — not a facilitator, not a certificate, not a score shop.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/gspc-verify"
            className="rounded-full border border-emerald-400/50 bg-emerald-500/15 px-5 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
          >
            Verify free →
          </Link>
          <a
            href="/api/gspc"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20"
          >
            Living board JSON →
          </a>
          <Link
            href="/pricing-free"
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/20"
          >
            Agent pay path →
          </Link>
        </div>

        <section aria-labelledby="pipeline-h" className="mt-14">
          <h2 id="pipeline-h" className="text-xl font-bold text-emerald-300">
            Measure → sign → root → anchor
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {PIPELINE.map((step) => (
              <li key={step.k} className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5">
                <div className="text-lg font-bold text-slate-100">{step.k}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-400">
            Council Attestation Network = measurement house with a signed recording path. Rails that
            index us are not us.
          </p>
        </section>

        <section aria-labelledby="board-h" className="mt-14">
          <h2 id="board-h" className="text-xl font-bold text-emerald-300">
            Living GSPC board
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Counts are fetched from <code>GET /api/gspc</code>. Derived from the axis array — never
            typed into marketing copy. No accuracies or leaders invented here.
          </p>
          <div className="mt-4">
            {boardErr ? (
              <p className="text-sm text-amber-200/80">
                Living board unreachable from this render. Open{" "}
                <a href="/api/gspc" className="underline">
                  /api/gspc
                </a>{" "}
                directly — do not invent a triple.
              </p>
            ) : (
              <BoardTriple totals={totals} />
            )}
          </div>
        </section>

        <section aria-labelledby="verify-h" className="mt-14">
          <h2 id="verify-h" className="text-xl font-bold text-emerald-300">
            Verify free — forever
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Paste a card. Your browser recomputes the hash and checks the Ed25519 signature. Nothing
            is sent to us. No account. VALID / INVALID / UNCHECKABLE are integrity outcomes — not
            certificates of conformity.
          </p>
          <Link
            href="/gspc-verify"
            className="mt-4 inline-flex rounded-full border border-emerald-400/50 bg-emerald-500/15 px-5 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
          >
            Open GSPC Verify →
          </Link>
        </section>

        <section id="agent-pay" aria-labelledby="agent-h" className="mt-14">
          <h2 id="agent-h" className="text-xl font-bold text-emerald-300">
            Agents — pay for the signed recording
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Agents buy work with a signature on it over HTTP 402 in USDC on Base. Amounts live only
            inside each resource’s 402 challenge — this page names no price. You get issuance /
            assembly / durable signature. You never buy a grade, a rank, a MEASURED cell, or a place
            on the board.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            measurement house · indexed by agent payment rails
          </p>
          <p className="mt-3 text-sm text-slate-400">
            PayAI, x402scan, agent402, GoPlausible and peers discover and index settled resources.
            Council of AI is the measurement house those rails crawl — we are not a facilitator
            clone.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/api/x402" className="text-emerald-300 underline-offset-2 hover:underline">
              /api/x402
            </a>
            <a
              href="/.well-known/x402.json"
              className="text-emerald-300 underline-offset-2 hover:underline"
            >
              /.well-known/x402.json
            </a>
            <Link href="/pricing-free" className="text-emerald-300 underline-offset-2 hover:underline">
              /pricing-free
            </Link>
          </div>
        </section>

        <section aria-labelledby="witness-h" className="mt-14">
          <h2 id="witness-h" className="text-xl font-bold text-emerald-300">
            Where the record lives
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>
              Public root:{" "}
              <a href="/root.json" className="text-emerald-300 underline-offset-2 hover:underline">
                /root.json
              </a>
            </li>
            <li>
              Irys L1 witness:{" "}
              <a
                href="https://gateway.irys.xyz/XiohTfKHMF1YaVBtUhzjSrUayokpEUTXjoUaReYJa6y"
                className="text-emerald-300 underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                gateway.irys.xyz/XiohTfKHMF1YaVBtUhzjSrUayokpEUTXjoUaReYJa6y
              </a>
            </li>
            <li>
              Verify:{" "}
              <Link href="/gspc-verify" className="text-emerald-300 underline-offset-2 hover:underline">
                /gspc-verify
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Irys here is an L1 bundler witness of the published root bytes — not a claim of a native
            arweave.net transaction.
          </p>
        </section>

        <section aria-labelledby="trust-leaf-h" className="mt-14 border-t border-emerald-500/15 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            x402 Trust Snapshot · free leaf
          </p>
          <h2 id="trust-leaf-h" className="mt-2 text-2xl font-bold text-slate-50">
            Catalogs index resources — we attest the recording
          </h2>
          <p className="mt-3 text-slate-300 leading-relaxed">
            The first leaf of the x402 Trust Report (Hermes{" "}
            <a
              className="underline decoration-emerald-400/50"
              href="https://github.com/CSOAI-ORG/councilof-ai/pull/1763"
              target="_blank"
              rel="noopener noreferrer"
            >
              #1763
            </a>
            ) is a DRY probe of facilitator catalog rows: challenge terms only — nothing signed,
            nothing sent. Report counts stay free forever. Per-resource attestation/verification
            cards ride the paid <code className="text-emerald-300">commission_card</code> /{" "}
            <code className="text-emerald-300">receipts</code> doors. Catalogs list self-reported
            resources; we publish a measured, counts-only trust view. We measure, never certify.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Free counts + methodology (no host dump):{" "}
            <a href="/interop/x402-trust/" className="text-emerald-300 underline-offset-2 hover:underline">
              /interop/x402-trust/
            </a>{" "}
            · machine JSON{" "}
            <a
              href="/interop/x402-trust/2026-09-07.json"
              className="text-emerald-300 underline-offset-2 hover:underline"
            >
              /interop/x402-trust/2026-09-07.json
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="never-h" className="mt-14 border-t border-emerald-500/15 pt-10">
          <h2 id="never-h" className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Hard nevers
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-400">
            {NEVERS.map((n) => (
              <li key={n}>— {n}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
