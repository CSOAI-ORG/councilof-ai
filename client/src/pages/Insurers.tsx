import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { DeckPage } from "@/components/scrollworld";
import {
  PRICING_RISK_HERO,
  PRICING_RISK_SLIDES,
  PRICING_RISK_NOT_CLAIMED,
  PRICING_RISK_RELATED,
} from "@/data/deckWorlds/pricingRisk";

/**
 * /insurers — the evidence pack, underwriter-legible.
 *
 * Audience: an underwriter or actuary pricing AI risk who lands here cold and
 * needs loss-relevant evidence they can verify without trusting us.
 *
 * Register (binding): measurement, not certification. Three data states, never
 * blended — MEASURED (our signed deterministic runs, live at /api/gspc),
 * UNMEASURED (honestly withheld, with the reason), REPORTED (third-party
 * figures, cited + dated, "reported by the source, not measured here", live at
 * /api/reported). No pricing anywhere. No hardcoded counts — the live board is
 * the source of truth.
 */

interface Axis {
  axis: string;
  bench: string;
  n: number;
  accuracy: number;
  leader: string;
  separation: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;
  interval?: [number, number];
  status: string;
}

interface ReportedEntry {
  id: string;
  claim: string;
  source: string;
  source_url: string;
  captured_at: string;
  as_of: string;
  attribution_basis: string;
  note?: string;
}

const CHIP: Record<string, string> = {
  SEPARATED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  TIE: "bg-amber-100 text-amber-800 border-amber-300",
  UNTESTED: "bg-gray-100 text-gray-600 border-gray-300",
};

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Evidence an underwriter can verify",
  url: "https://councilof.ai/insurers",
  publisher: {
    "@type": "Organization",
    name: "CSOAI Ltd",
    url: "https://councilof.ai",
    identifier: "UK Companies House 16939677",
  },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "Signed, deterministic AI measurement an underwriter can verify offline: per-axis results with n and Wilson intervals, Ed25519 signatures, a sha256 hash chain, and an honest register of what is not measured. Not a certification.",
};

const CARD_ANATOMY = [
  {
    term: "Deterministic per-axis results",
    body: "Every axis result carries its n and, where the n is honestly independent, a Wilson 95% interval. Same rows, same grader, rerun gives the same number — no model judging another model.",
  },
  {
    term: "Ed25519 signature",
    body: "The board is signed. The signature covers the canonical board content (minus the signature fields themselves), so any edit after signing breaks verification.",
  },
  {
    term: "sha256 hash chain",
    body: "Signed record sets chain their hashes: sha256 of the canonical content, sorted keys. Recompute it locally — if a record was edited after signing, your hash will not match the stored one.",
  },
  {
    term: "SHA-256 hash chain",
    // 2026-08-20: the trailing "(Independent Bitcoin/OpenTimestamps time-anchoring is
    // planned, not yet live.)" was removed. We publish timestamp_authority: "none" and
    // purged the time-anchoring overclaims; naming them even as roadmap contradicts the
    // honesty band on this page, which states plainly that there is no such anchor.
    body: "Record hashes are sha256-linked and Ed25519-signed, so “this content is unaltered since signing” is checkable offline against the published key. There is no independent time-stamping authority behind these cards: the anchor is the signature over the hash chain, and nothing more.",
  },
  {
    term: "did:web:csoai.org published key",
    body: "The Ed25519 public keys are published at GET /.well-known/did.json under did:web:csoai.org. You fetch the key from the domain itself — no key exchange with us required.",
  },
];

function InsurersEvidencePack() {
  const [board, setBoard] = useState<any>(null);
  const [boardErr, setBoardErr] = useState<string | null>(null);
  const [reported, setReported] = useState<any>(null);
  const [reportedErr, setReportedErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Evidence an underwriter can verify | Council of AI";
    setMetaDescription("Evidence an underwriter can verify: Ed25519-signed AI measurement cards, recomputable from published rows. Council of AI (CSOAI LTD, UK 16939677) — measurement, not certification. Live board: GET /api/gspc.");
    fetch("/api/gspc")
      .then((r) => r.json())
      .then(setBoard)
      .catch((e) => setBoardErr(String(e)));
    fetch("/api/reported")
      .then((r) => r.json())
      .then(setReported)
      .catch((e) => setReportedErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_LD) }} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* 1 — Hero */}
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          For insurers &amp; underwriters — verify everything, free
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">
          Evidence an underwriter can verify
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-gray-600">
          We measure AI systems against the rules that govern them, sign the result, and publish
          what we cannot measure. Every number on this page is either fetched live from a signed
          endpoint or labelled with its third-party source and capture date — nothing is blended.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-gray-500">
          What this is <strong>not</strong>: not a certification, not a conformity mark, not a
          legal determination — it is a measurement record you can recompute yourself. RWA
          public-artifact inputs stay REPORTED/UNMEASURED until custody gates clear — we do not
          invent AUM or treat attestation as ownership.
        </p>

        {/* Three data states */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-emerald-600/20 bg-white p-4">
            <p className="font-bold text-emerald-700">MEASURED</p>
            <p className="mt-1 text-gray-600">
              Our own signed, deterministic runs. Live at <code>GET /api/gspc</code>.
            </p>
          </div>
          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <p className="font-bold text-gray-600">UNMEASURED</p>
            <p className="mt-1 text-gray-600">
              Honestly withheld, with the reason stated — insufficient n, or no separation test
              yet. Empty cells stay empty.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-white p-4">
            <p className="font-bold text-amber-700">REPORTED</p>
            <p className="mt-1 text-gray-600">
              Third-party figures, cited and dated — reported by the source, not measured here.
              Live at <code>GET /api/reported</code>.
            </p>
          </div>
        </div>

        {/* 2 — Card anatomy */}
        <h2 className="mt-14 text-2xl font-bold text-gray-900">
          What a signed measurement card gives you
        </h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          A measurement card is a small (~3KB) signed record. Each part exists so an actuary can
          check it without trusting the issuer:
        </p>
        <ul className="mt-4 space-y-3">
          {CARD_ANATOMY.map((item) => (
            <li key={item.term} className="rounded-xl border border-emerald-600/15 bg-white p-4">
              <p className="font-semibold text-gray-900">{item.term}</p>
              <p className="mt-1 text-sm text-gray-600">{item.body}</p>
            </li>
          ))}
        </ul>

        {/* 3 — Verify one yourself */}
        <h2 className="mt-14 text-2xl font-bold text-gray-900">Verify one yourself, offline</h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          A stranger with a terminal can check us. No account, no key exchange, no permission:
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-700">
          <li>
            Fetch the signed board —
            <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-emerald-300">
              curl https://councilof.ai/api/gspc
            </pre>
          </li>
          <li>
            Fetch the published verification key —
            <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-emerald-300">
              curl https://councilof.ai/.well-known/did.json
            </pre>
          </li>
          <li>
            Recompute the hash chain in your own browser at{" "}
            <Link href="/gspc-verify" className="font-semibold text-emerald-700 underline">
              /gspc-verify
            </Link>{" "}
            — client-side, nothing leaves your machine.
          </li>
        </ol>
        <p className="mt-4 text-sm text-gray-500">
          Verification is free, requires no account, and always will be.
        </p>

        {/* 4 — Loss context */}
        <h2 className="mt-14 text-2xl font-bold text-gray-900">Loss context</h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Why a measurement record maps onto an underwriting file:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-600/15 bg-white p-5">
            <p className="font-bold text-gray-900">Frequency</p>
            <p className="mt-1 text-sm text-gray-600">
              The board shows which axes a system fails, with the n behind each result. A failure
              rate with a sample size and a Wilson interval is a frequency input, not a marketing
              claim.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-600/15 bg-white p-5">
            <p className="font-bold text-gray-900">Severity tails</p>
            <p className="mt-1 text-sm text-gray-600">
              Where n≥100, the board publishes <code>mean_harm</code> and <code>cvar05_harm</code>{" "}
              per axis. CVaR@5% is the average harm across the worst 5% of items — the tail an
              underwriter prices, not the average day. Where n&lt;100 the field is honestly null.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-600/15 bg-white p-5">
            <p className="font-bold text-gray-900">Drift</p>
            <p className="mt-1 text-sm text-gray-600">
              Regulation changes; measurements go stale. A daily reg-watch detector watches the
              governing corpus, and state changes are published to{" "}
              <a href="/api/feed.xml" className="font-semibold text-emerald-700 underline">
                /api/feed.xml
              </a>{" "}
              so re-measurement is observable, not promised.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-600/15 bg-white p-5">
            <p className="font-bold text-gray-900">The honesty gate</p>
            <p className="mt-1 text-sm text-gray-600">
              At{" "}
              <Link href="/honesty" className="font-semibold text-emerald-700 underline">
                /honesty
              </Link>{" "}
              we publish our own models losing our own arena. An instrument that catches its owner
              is the instrument you can price on.
            </p>
          </div>
        </div>

        {/* 5 — Live board strip (MEASURED) */}
        <h2 className="mt-14 text-2xl font-bold text-gray-900">The live board — MEASURED</h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Fetched live from <code>GET /api/gspc</code> (the live count lives there, not here). A{" "}
          <strong>TIE</strong> means the leader&apos;s edge is statistically indistinguishable —
          ties are never counted as wins.
        </p>

        {boardErr && (
          <p className="mt-6 text-red-600">
            Board fetch failed: {boardErr} — the API at /api/gspc is the source of truth.
          </p>
        )}
        {!board && !boardErr && <p className="mt-6 text-gray-500">Loading the live board…</p>}

        {board && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-emerald-600/15 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-emerald-50/60 text-left text-gray-700">
                  <th className="p-3">Axis</th>
                  <th className="p-3">n</th>
                  <th className="p-3">Leader accuracy</th>
                  <th className="p-3">Separation</th>
                </tr>
              </thead>
              <tbody>
                {(board.axes as Axis[]).map((a) => (
                  <tr key={a.axis} className="border-b last:border-0">
                    <td className="p-3 font-semibold text-gray-900">{a.axis}</td>
                    <td className="p-3 font-mono">{a.n}</td>
                    <td className="p-3 font-mono">{(a.accuracy * 100).toFixed(1)}%</td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[a.separation]}`}>
                        {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Full per-axis detail — Wilson intervals, fleet means, harm tails, the signature:{" "}
          <Link href="/gspc-scoreboard" className="font-semibold text-emerald-700 underline">
            /gspc-scoreboard
          </Link>{" "}
          and <code>GET /api/gspc</code>.
        </p>

        {/* 6 — REPORTED */}
        <h2 className="mt-14 text-2xl font-bold text-gray-900">
          REPORTED — third-party context, never blended
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Figures published by others, cited with their capture date. Each entry is{" "}
          <strong>reported by the source, not measured here</strong> — unsigned, and never enters
          the board.
        </p>

        {reportedErr && (
          <p className="mt-6 text-red-600">
            REPORTED fetch failed: {reportedErr} — the API at /api/reported is the source of truth.
          </p>
        )}
        {!reported && !reportedErr && (
          <p className="mt-6 text-gray-500">Loading REPORTED entries…</p>
        )}

        {reported && (
          <ul className="mt-6 space-y-3">
            {(reported.entries as ReportedEntry[]).map((e) => (
              <li key={e.id} className="rounded-xl border border-amber-300/60 bg-amber-50/40 p-4">
                <p className="text-sm font-semibold text-gray-900">{e.claim}</p>
                <p className="mt-1 text-xs text-gray-600">
                  Source:{" "}
                  <a href={e.source_url} className="font-semibold text-emerald-700 underline" rel="noopener noreferrer">
                    {e.source}
                  </a>{" "}
                  · source date {e.as_of} · captured {e.captured_at}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  Reported by the source, not measured here.
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* 7 — Footer CTA row */}
        <div className="mt-14 grid gap-4 sm:grid-cols-4 text-sm">
          <Link
            href="/gspc-scoreboard"
            className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            The full live board →
          </Link>
          <Link
            href="/gspc-verify"
            className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Verify a card — free, in your browser →
          </Link>
          <Link
            href="/firewall-charter"
            className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            The measurement/remediation firewall →
          </Link>
          <a
            href="mailto:nicholas@csoai.org"
            className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Talk to us about an evidence pack →
          </a>
        </div>

        <p className="mt-10 text-xs text-gray-500">
          Measurement, not certification. CSOAI Ltd · UK Companies House 16939677 ·{" "}
          <a href="mailto:nicholas@csoai.org" className="underline">
            nicholas@csoai.org
          </a>
          . Every MEASURED number on this page is recomputable from <code>GET /api/gspc</code>;
          every REPORTED figure carries its source and capture date; what we cannot measure is
          withheld and says so.
        </p>
      </div>
    </div>
  );
}

/**
 * /insurers — UPGRADED (not duplicated): the owner's "Pricing AI Risk" deck becomes the
 * scroll-world story that leads into the underwriter evidence pack already on this route.
 * The evidence pack below is unchanged. See client/src/data/deckWorlds/pricingRisk.ts for
 * the corrections log (market sizing, carrier capacity and US-state figures were dropped;
 * GSPC's "Privacy" was corrected to "Provenance").
 */
export default function Insurers() {
  return (
    <DeckPage
      title="Pricing AI risk | Council of AI"
      description="Signed, deterministic AI measurement an underwriter can verify offline: per-axis results with n and Wilson intervals, Ed25519 signatures over a SHA-256 hash chain, and an honest register of what is not measured. Measurement, not certification."
      hero={PRICING_RISK_HERO}
      slides={PRICING_RISK_SLIDES}
      notClaimed={PRICING_RISK_NOT_CLAIMED}
      related={PRICING_RISK_RELATED}
    >
      <InsurersEvidencePack />
    </DeckPage>
  );
}
