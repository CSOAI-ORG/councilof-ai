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
        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-emerald-600/20 bg-white p-4">
            <p className="font-bold text-emerald-700">MEASURED</p>
            <p className="mt-1 text-gray-600">Our own signed, deterministic runs. Live at <code>GET /api/gspc</code>.</p>
          </div>
          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <p className="font-bold text-gray-600">UNMEASURED</p>
            <p className="mt-1 text-gray-600">Honestly withheld, with the reason stated — insufficient n, or no separation test yet. Empty cells stay empty.</p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-white p-4">
            <p className="font-bold text-amber-700">REPORTED</p>
            <p className="mt-1 text-gray-600">Third-party figures, cited and dated — reported by the source, not measured here. Live at <code>GET /api/reported</code>.</p>
          </div>
        </div>
        <h2 className="mt-14 text-2xl font-bold text-gray-900">What a signed measurement card gives you</h2>
        <ul className="mt-4 space-y-3">
          {CARD_ANATOMY.map((item) => (
            <li key={item.term} className="rounded-xl border border-emerald-600/15 bg-white p-4">
              <p className="font-semibold text-gray-900">{item.term}</p>
              <p className="mt-1 text-sm text-gray-600">{item.body}</p>
            </li>
          ))}
        </ul>
        <h2 className="mt-14 text-2xl font-bold text-gray-900">Loss context</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-600/15 bg-white p-5">
            <p className="font-bold text-gray-900">Frequency</p>
            <p className="mt-1 text-sm text-gray-600">
              The board shows which measurement slots a system fails, with the n behind each result. A failure
              rate with a sample size and a Wilson interval is a frequency input, not a marketing
              claim.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-4 text-sm">
          <a href="mailto:nicholas@csoai.org" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            Talk to us about an evidence pack →
          </a>
        </div>
      </div>
    </div>
  );
}

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
