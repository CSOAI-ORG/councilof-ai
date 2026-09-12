import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /doctrine — one page. Measurement ≠ certification. Card isolated.
 * Attachments post-hoc. UNMEASURED is a feature. Counts from GET /api/gspc only.
 */

const POINTS: { title: string; body: string }[] = [
  {
    title: "We measure. We do not certify.",
    body:
      "No conformity mark, no Art. 50 stamp-as-grade. Academy completion records are not a grade of the measured system.",
  },
  {
    title: "A grade is never sold.",
    body:
      "Anyone verifies a card in-browser, free, forever. Paid work is run, sign, attach, or report. Payment never reaches the signing path.",
  },
  {
    title: "The card is isolated.",
    body:
      "GSPC card-v1 does not grow new kinds. Attachments hang off it by digest, each with its own preimage rule and three states: VALID, INVALID, UNCHECKABLE.",
  },
  {
    title: "UNMEASURED is first-class.",
    body:
      "Empty cells stay empty. Do not guess. Quote slots and measurements together — never the slot count alone.",
  },
  {
    title: "Fail closed.",
    body:
      "Missing stamp is UNCHECKABLE, never a cached LIVE. Mixing the card preimage rule with the board preimage rule is a false INVALID.",
  },
  {
    title: "Bind, don’t migrate.",
    body:
      "Pins and adapters. Not a 600-repo monorepo. Lifestyle MCP servers are not this product.",
  },
  {
    title: "Mainnet copy needs stamp and law.",
    body:
      "No GSPC credential as a grade. No token, bond, or cut of a market. Historical XRPL hashes are Devnet pointers; the living /xrpl-attest feed is GET /root.json (not a grade).",
  },
  {
    title: "We eat our own cooking.",
    body:
      "If we cannot verify it, we do not ship it. Corrections are appended. The original stays.",
  },
];

/**
 * REFUSALS — the red lines, published 2026-09-12, before the event that makes
 * them quotable. A refusal stated in advance is a commitment device: if one of
 * these ever changes, the change is recorded in /api/corrections, not edited
 * away. Keep each line short enough to quote verbatim.
 */
const REFUSALS: { title: string; body: string }[] = [
  {
    title: "We will not certify.",
    body:
      "No conformity mark, no seal-as-grade, no certificate of compliance. A signed card records what was measured and when. Nothing more is ever for sale.",
  },
  {
    title: "We will not sell a grade.",
    body:
      "Payment buys runs, signatures, attachments and reports. It never reaches the signing path, and it cannot change, delay or suppress a measurement.",
  },
  {
    title: "We will not take money from the measured to influence the measurement.",
    body:
      "No measured lab, vendor or issuer holds equity, a board seat, or veto here. A measurement body funded to adjust its readings has no asset left.",
  },
  {
    title: "We will not rank our own models.",
    body:
      "Our own council-specialist models are excluded from the public per-axis leaders on the board. A neutral body does not place itself on its own podium.",
  },
  {
    title: "We will not rewrite history.",
    body:
      "Corrections are appended and the original bytes stay. The public ledger is GET /api/corrections — including the entries about our own verification tooling.",
  },
  {
    title: "We will not call UNCHECKABLE fine.",
    body:
      "A missing stamp, an unreachable endpoint, an unverifiable signature: all fail closed. 'Could not check' is reported as itself, never upgraded to a pass.",
  },
  {
    title: "We will not move the keys to a conflicted owner.",
    body:
      "The signing keys and the measurement instruments stay with the measurement body. Neutrality is the asset; an owner with a stake in the readings destroys it.",
  },
  {
    title: "We will not manufacture attention.",
    body:
      "No astroturfing, no purchased coverage presented as earned, no mass unsolicited email. We publish numbers, clocks and corrections on dates — attention is a side effect or it does not happen.",
  },
];

export default function Doctrine() {
  const board = useBoardCount();

  useEffect(() => {
    document.title = "Doctrine — measurement, not certification | Council of AI";
    setMetaDescription(
      "Council of AI doctrine: we measure, we do not certify. Cards are isolated. UNMEASURED is first-class. Verify is free. Live board: GET /api/gspc.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Council of AI — doctrine
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          Measurement, not certification.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Independent measurement body (CSOAI Ltd, UK 16939677). Live board{" "}
          <a className="text-emerald-700 underline" href="https://councilof.ai/api/gspc">
            GET /api/gspc
          </a>
          {board.live ? (
            <>
              : <strong className="text-gray-900">{board.public_count}</strong>
            </>
          ) : (
            <>
              {" "}
              (this page is showing the last recorded observation until the board fetch lands).
            </>
          )}
          . Verify:{" "}
          <Link href="/gspc-verify" className="text-emerald-700 underline">
            /gspc-verify
          </Link>
          .
        </p>

        <div className="mt-10 space-y-5">
          {POINTS.map((p) => (
            <section key={p.title} className="rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-gray-900">{p.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{p.body}</p>
            </section>
          ))}
        </div>

        {board.live && board.unmeasured_axes > 0 && (
          <p className="mt-8 text-sm text-gray-600">
            {board.count_grammar} Financial empty cells stay empty.
          </p>
        )}

        <div className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
            Refusals — published 2026-09-12
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-gray-900">
            The red lines, on the record before they are tested.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            A refusal stated in advance is a commitment device: the stance exists before the
            event that makes it quotable. If any of these ever changes, the change is recorded
            in{" "}
            <a className="text-emerald-700 underline" href="/api/corrections">
              /api/corrections
            </a>
            , not edited away.
          </p>
          <div className="mt-6 space-y-5">
            {REFUSALS.map((r) => (
              <section key={r.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-extrabold text-gray-900">{r.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{r.body}</p>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Also:{" "}
          <Link href="/honesty" className="text-emerald-700 underline">
            honesty gate
          </Link>
          {" · "}
          <Link href="/firewall-charter" className="text-emerald-700 underline">
            firewall charter
          </Link>
          {" · "}
          <Link href="/embed" className="text-emerald-700 underline">
            embed
          </Link>
          . White-label is chrome plus verify. They do not get our key.
        </p>
      </div>
    </div>
  );
}
