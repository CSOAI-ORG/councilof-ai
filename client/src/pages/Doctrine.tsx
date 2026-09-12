import { useEffect } from "react";
import { Link } from "wouter";
import { useBoardCount } from "@/lib/boardCount";
import { setPageMetadata } from "@/lib/utils";

/**
 * /doctrine — one page. Measurement ≠ certification. Card isolated.
 * Attachments post-hoc. UNMEASURED is a feature. Counts from GET /api/gspc only.
 */

const POINTS: { title: string; body: string }[] = [
  {
    title: "We measure. We do not certify.",
    body: "No conformity mark, no Art. 50 stamp-as-grade. Academy completion records are not a grade of the measured system.",
  },
  {
    title: "A grade is never sold.",
    body: "Anyone verifies a card in-browser, free, forever. Paid work is run, sign, attach, or report. Payment never reaches the signing path.",
  },
  {
    title: "The card is isolated.",
    body: "GSPC card-v1 does not grow new kinds. Attachments hang off it by digest, each with its own preimage rule and three states: VALID, INVALID, UNCHECKABLE.",
  },
  {
    title: "UNMEASURED is first-class.",
    body: "Empty cells stay empty. Do not guess. Quote slots and measurements together — never the slot count alone.",
  },
  {
    title: "Fail closed.",
    body: "Missing stamp is UNCHECKABLE, never a cached LIVE. Mixing the card preimage rule with the board preimage rule is a false INVALID.",
  },
  {
    title: "Bind, don’t migrate.",
    body: "Pins and adapters. Not a 600-repo monorepo. Lifestyle MCP servers are not this product.",
  },
  {
    title: "Mainnet copy needs stamp and law.",
    body: "No GSPC credential as a grade. No token, bond, or cut of a market. Historical XRPL hashes are Devnet pointers; the living /xrpl-attest feed is GET /root.json (not a grade).",
  },
  {
    title: "We eat our own cooking.",
    body: "If we cannot verify it, we do not ship it. Corrections are appended. The original stays.",
  },
];

const REFUSALS: { title: string; body: string }[] = [
  {
    title: "We will not certify.",
    body: "A signed measurement records the subject, method, evidence and time. It is not a conformity mark, endorsement or certificate of compliance.",
  },
  {
    title: "We never sell a grade.",
    body: "Payment can fund a run, signature, attachment or report. It cannot alter, delay or suppress a result, and verification remains free.",
  },
  {
    title: "We will not turn absence into zero.",
    body: "An unread source, missing record or unmeasured cell stays null, UNMEASURED or UNCHECKABLE. Zero is a measured value.",
  },
  {
    title: "We will not count our tests as customers.",
    body: "Self-settlements and zero-value tests prove plumbing only. They are separated from outside buyers and revenue.",
  },
  {
    title: "We will not rewrite a correction away.",
    body: "The original claim remains inspectable. A dated correction records what was wrong, how it was caught and what changed.",
  },
  {
    title: "We will not call a pending stamp anchored.",
    body: "A witness must name the exact root bytes. An OpenTimestamps submission remains PENDING until an upgraded proof names a Bitcoin block.",
  },
  {
    title: "We will not publish a count without its owner.",
    body: "Counts render from the artifact or endpoint that owns them. If that source cannot be read, the public surface says so.",
  },
];

export default function Doctrine() {
  const board = useBoardCount();
  useEffect(() => {
    setPageMetadata({
      title: "Doctrine — measurement, not certification | Council of AI",
      description:
        "Council of AI doctrine and public refusal lines: measurement, not certification; uncertainty stays visible; verification remains free.",
      openGraphDescription:
        "The public rules that govern Council of AI measurements, payments, corrections and root witnesses.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Council of AI — doctrine
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
          Measurement, not certification.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Independent measurement body (CSOAI Ltd, UK 16939677). Live board{" "}
          <a
            className="text-emerald-700 underline"
            href="https://councilof.ai/api/gspc"
          >
            GET /api/gspc
          </a>
          {board.live ? (
            <>
              : <strong className="text-gray-900">{board.public_count}</strong>
            </>
          ) : (
            <>
              {" "}
              (this page is showing the last recorded observation until the
              board fetch lands).
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
            <section
              key={p.title}
              className="rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm"
            >
              <h2 className="text-base font-extrabold text-gray-900">
                {p.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                {p.body}
              </p>
            </section>
          ))}
        </div>

        {board.live && board.unmeasured_axes > 0 && (
          <p className="mt-8 text-sm text-gray-600">
            {board.count_grammar} Financial empty cells stay empty.
          </p>
        )}

        <section aria-labelledby="refusals-heading" className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Public refusal lines · 12 September 2026
          </p>
          <h2
            id="refusals-heading"
            className="mt-3 text-2xl font-black leading-tight text-gray-900 sm:text-3xl"
          >
            The lines this system will not cross.
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-gray-600">
            These statements are published before they become convenient. If a
            rule changes, the change belongs in the{" "}
            <a
              className="font-semibold text-emerald-800 underline underline-offset-4"
              href="/api/corrections"
            >
              public corrections ledger
            </a>
            , not in a quiet edit to history.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {REFUSALS.map((refusal) => (
              <section
                key={refusal.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <h3 className="text-base font-extrabold text-gray-900">
                  {refusal.title}
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-gray-600">
                  {refusal.body}
                </p>
              </section>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="proof-records-heading"
          className="mt-14 rounded-2xl bg-slate-950 p-5 text-slate-100 sm:p-7"
        >
          <h2
            id="proof-records-heading"
            className="text-xl font-extrabold sm:text-2xl"
          >
            See the doctrine catch its own publisher.
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            These public records apply the rules to Council of AI itself.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/postmortems/x402-settlement-reading"
              className="rounded-xl border border-slate-700 p-4 font-semibold text-emerald-300 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              X402 settlement-reading postmortem
            </Link>
            <Link
              href="/events/three-root-ceremony"
              className="rounded-xl border border-slate-700 p-4 font-semibold text-emerald-300 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              Exact public-root witness record
            </Link>
          </div>
        </section>

        <p className="mt-10 text-sm leading-6 text-gray-500">
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
