import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /harness — the measurement harness, as a product, described only to the extent
 * the code supports.
 *
 * PROVENANCE RULE (ADR-001). No count on this page is typed. The board's totals come
 * from GET /api/gspc via useBoardCount; the published card count comes from
 * GET /api/state -> signed_cards.count, rendered together with the `kind` and `as_of`
 * that endpoint attaches to it. If a number is not in one of those payloads it does
 * not appear here at all — a blank is honest, a literal is not.
 *
 * STATUS RULE. The capability table below is the output of an audit that ran each
 * tool rather than reading its description (council-os/HARNESS-PRODUCT-INVENTORY.md).
 * "Not yet available" is a first-class published status here. A capability whose code
 * does not do what its name says is listed as not available, not quietly omitted —
 * omitting it is how a name comes to promise what the code lacks.
 *
 * BOUNDARY. We measure against an obligation; we do not enforce one and we issue no
 * certification. The measurement core is not open source; the verifier and the schemas
 * are. Nothing on this page states a price.
 */

type Status = "available" | "limited" | "node-only" | "not-yet";

const STATUS_CHIP: Record<Status, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-300",
  limited: "bg-amber-100 text-amber-900 border-amber-300",
  "node-only": "bg-sky-100 text-sky-900 border-sky-300",
  "not-yet": "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_LABEL: Record<Status, string> = {
  available: "Available",
  limited: "Available, limited",
  "node-only": "Runs on the measurement node",
  "not-yet": "Not yet available",
};

interface Capability {
  name: string;
  status: Status;
  what: string;
  /** The honest caveat. Rendered for every row that has one — never suppressed. */
  limit?: string;
}

const CAPABILITIES: Capability[] = [
  {
    name: "Signed measurement cards",
    status: "available",
    what:
      "One card per model per axis. Each carries the model, the axis, the graded result, the issuer and a verify path, signed Ed25519 over canonical JSON.",
    limit:
      "A card records one graded run. It is not a judgement about the model overall, and it is not a compliance determination.",
  },
  {
    name: "Offline verification of a card",
    status: "available",
    what:
      "A recipient recomputes sha256 over the canonical body and checks the signature against the published key, with no call back to us. The verifier is open source.",
  },
  {
    name: "The card chain",
    status: "available",
    what:
      "Cards are linked: each names the previous card's identifier, and the manifest names the head. A card removed or reordered after the fact breaks the chain.",
    limit:
      "The chain proves internal order and integrity. It is not an external timestamp — see below.",
  },
  {
    name: "EU AI Act findings report",
    status: "limited",
    what:
      "A deterministic report that maps measured axes to the obligations they bear on, grades the gap on a fixed scale, and states the penalty tier the obligation sits in. No model is consulted to produce it.",
    limit:
      "The obligation map currently names a subset of the board's axes, and several of its names no longer match the board's. Where a name does not match, the report says UNMEASURED for an axis that has in fact been measured — it under-reports coverage rather than over-reporting it. Read it beside the live board until the map is re-pointed.",
  },
  {
    name: "Surface probe",
    status: "available",
    what:
      "A live check of the published surfaces a result depends on — the board, the card index, the registers, the archive records — reporting each one's actual response.",
  },
  {
    name: "Dataset intake screening",
    status: "limited",
    what:
      "Candidate benchmark datasets are screened on licence before anything is measured from them. Copyleft and non-commercial licences are rejected.",
    limit:
      "Licence is the only predicate implemented today. The canary-string and row-shape checks are described in the tool but are not yet performed, so a clean verdict means licence-clean and nothing more.",
  },
  {
    name: "Card issuance",
    status: "node-only",
    what:
      "Cards are signed on the measurement node, where the key stays. The key is not in any repository and never leaves that machine.",
    limit:
      "There is no issuance on a laptop and no self-service issuance. A run is scheduled on the node; the artifacts and the verifier are what travel.",
  },
  {
    name: "Automatic sweep of newly released models",
    status: "not-yet",
    what:
      "The intended behaviour is that a newly published model is detected and queued for measurement within days of release.",
    limit:
      "The recency filter in the current dispatcher does not function — every model the registry returns is admitted regardless of age — so the queue it produces is not the selective one the name implies. Treated as not available until the filter is repaired and re-tested.",
  },
  {
    name: "External timestamp anchor",
    status: "not-yet",
    what:
      "The intended behaviour is a third-party timestamp proving a card existed at a given moment independently of us.",
    limit:
      "The stored anchor records a success that did not occur: the timestamp authority returned an error and the error was recorded as an ok status. There is no valid external timestamp on any card today. The card chain and the signature are unaffected — but neither of them is a proof of time.",
  },
  {
    name: "Tokenised-asset measurement",
    status: "not-yet",
    what:
      "A register of tokenised real-world assets exists, and each entry carries a signed card naming the asset and its public issuing address.",
    limit:
      "Every entry in that register reads UNMEASURED, because no question bank exists for these issuers yet. The cards verify as signed documents; they contain no assessment of the asset. Nothing in this register should be read as a rating.",
  },
];

interface Fact {
  value: unknown;
  kind?: string;
  source?: string;
  as_of?: string | null;
  as_of_field?: string | null;
  note?: string;
}

export default function Harness() {
  // The board's own totals, derived from GET /api/gspc. Never typed on this page.
  const board = useBoardCount();
  const [cards, setCards] = useState<Fact | null>(null);
  const [stateErr, setStateErr] = useState<string | null>(null);

  useEffect(() => {
    // No count in the title or the description. A number frozen into <head> is
    // precisely the literal ADR-001 forbids; the live counts render in the body.
    document.title = "The measurement harness | Council of AI";
    setMetaDescription(
      "How a measurement becomes a signed card anyone can verify offline, what the harness measures today, and which capabilities are not yet available. Measurement, not certification. Counts come from GET /api/gspc and GET /api/state.",
    );
    const ac = new AbortController();
    fetch("/api/state", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        const c = d?.signed_cards?.count;
        if (c && typeof c === "object" && typeof c.value === "number") setCards(c as Fact);
        else throw new Error("no signed_cards.count in the payload");
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setStateErr(String(e));
      });
    return () => ac.abort();
  }, []);

  const counted = (["available", "limited"] as Status[]).reduce(
    (n, s) => n + CAPABILITIES.filter((c) => c.status === s).length,
    0,
  );
  const notYet = CAPABILITIES.filter((c) => c.status === "not-yet").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          The measurement body
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl">The measurement harness</h1>
        <p className="mt-4 max-w-3xl text-lg text-gray-600">
          The harness is the machinery that turns a question bank and a fleet of models into a
          signed record a stranger can check without asking us anything. This page describes what
          it does <em>today</em>. Where a capability is named but not yet working, it is listed as
          not yet available rather than left out.
        </p>

        {/* ── The two numbers, both derived ───────────────────────────────── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">What is on the board</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{board.public_count}</p>
            <p className="mt-2 text-sm text-gray-600">{board.count_grammar}</p>
            <p className="mt-3 text-xs text-gray-500">
              {board.live ? "Read live from " : "Last recorded observation of "}
              <a className="font-semibold text-emerald-700 underline" href="/api/gspc">
                GET /api/gspc
              </a>
              {board.live ? "." : " — the endpoint is the authority and it has not answered yet."}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Cards published</p>
            {cards ? (
              <>
                <p className="mt-2 text-2xl font-black text-gray-900">
                  {String(cards.value)}
                  <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {cards.kind}
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Catalogued means the index lists them. It is not a claim that a verifier
                  re-checked every one of them today — that is what the verifier in your hands is
                  for.
                </p>
                {cards.as_of && (
                  <p className="mt-3 text-xs text-gray-500">
                    as of {cards.as_of}
                    {cards.as_of_field ? ` (read from ${cards.as_of_field})` : ""} ·{" "}
                    <a className="font-semibold text-emerald-700 underline" href="/api/state">
                      GET /api/state
                    </a>
                  </p>
                )}
              </>
            ) : stateErr ? (
              <p className="mt-2 text-sm text-red-600">
                Could not read the card count: {stateErr}. No number is shown rather than a
                remembered one —{" "}
                <a className="font-semibold underline" href="/api/state">
                  /api/state
                </a>{" "}
                is the authority.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Reading the card count from /api/state…</p>
            )}
          </div>
        </div>

        {/* ── How a result becomes a card ─────────────────────────────────── */}
        <h2 className="mt-14 text-2xl font-black text-gray-900">How a result becomes a signed card</h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Five steps. The first three happen on the measurement node, where the signing key lives
          and never leaves. The last two are what you receive.
        </p>
        <ol className="mt-6 space-y-4">
          {[
            {
              h: "A frozen bank is asked",
              b: "Every axis has a fixed set of items written from an obligation or a behaviour, not sampled at run time. The same fleet answers the same items, so two runs are comparable.",
            },
            {
              h: "The answer is graded deterministically",
              b: "A rule reads the answer, not a model. The same response always earns the same score. A response no rule can read is reported as unparsed — never counted as a wrong answer, and never silently dropped.",
            },
            {
              h: "The result is signed and chained",
              b: "The graded result is written into a small card, the card body is serialised to canonical JSON, and the body is signed Ed25519. The card names the previous card, so the set has an order that cannot be quietly edited.",
            },
            {
              h: "The card is published and indexed",
              b: "Each card is fetchable on its own, and an index lists every one with its identifier, its key and its signature.",
            },
            {
              h: "You verify it without us",
              b: "Recompute the hash over the canonical body, check the signature against the published key. Nothing calls home. If we vanished, every card already issued would still verify.",
            },
          ].map((s, i) => (
            <li key={s.h} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-gray-900">{s.h}</p>
                <p className="mt-1 text-sm text-gray-600">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Capability status ──────────────────────────────────────────── */}
        <h2 className="mt-14 text-2xl font-black text-gray-900">What works today</h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Each row below was classified by running the tool, not by reading its description. Where
          the two disagreed, the run decided. {counted} capabilities are available today, of which
          some are available with a stated limit; {notYet} are named but not yet working and are
          published as such.
        </p>
        <div className="mt-6 space-y-3">
          {CAPABILITIES.map((c) => (
            <div key={c.name} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_CHIP[c.status]}`}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{c.what}</p>
              {c.limit && (
                <p className="mt-2 border-l-2 border-amber-300 pl-3 text-sm text-gray-700">
                  <span className="font-semibold text-amber-800">Limit: </span>
                  {c.limit}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── What a customer receives ───────────────────────────────────── */}
        <h2 className="mt-14 text-2xl font-black text-gray-900">What you actually receive</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              h: "The cards for your subject",
              b: "One signed card per axis measured, each with its graded result, the size of the run behind it, and the key that signed it.",
            },
            {
              h: "The bank and the grader",
              b: "The items your subject was asked and the rule that read the answers, so you can reproduce the score rather than take it.",
            },
            {
              h: "A verifier you keep",
              b: "An open-source checker that validates a card offline. It is yours; it does not expire and it does not phone us.",
            },
            {
              h: "An honest register",
              b: "Measured, reported and unmeasured are separate statuses and are never added together. An axis we have not measured is listed as unmeasured, not omitted.",
            },
          ].map((d) => (
            <div key={d.h} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-bold text-gray-900">{d.h}</p>
              <p className="mt-1 text-sm text-gray-600">{d.b}</p>
            </div>
          ))}
        </div>

        {/* ── The boundary ───────────────────────────────────────────────── */}
        <h2 className="mt-14 text-2xl font-black text-gray-900">What the harness will not do</h2>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex gap-3">
            <span className="font-black text-gray-400">—</span>
            <span>
              <strong>It does not certify.</strong> We measure and publish the measurement. No mark
              is issued, nothing is approved, and no result should be presented as an approval.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-black text-gray-400">—</span>
            <span>
              <strong>It does not enforce.</strong> A regulator enforces. We measure against a
              published obligation and hand the reader the evidence and the arithmetic.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-black text-gray-400">—</span>
            <span>
              <strong>It does not score what it has not measured.</strong> An unmeasured axis is
              reported as unmeasured. It is never rendered as a zero, and never inferred from a
              neighbouring axis.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-black text-gray-400">—</span>
            <span>
              <strong>It is not open source.</strong> The verifier and the schemas are, so that a
              result can be checked by anyone. The measurement core is not, so that a subject
              cannot tune to the instrument.
            </span>
          </li>
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/gspc-scoreboard"
            className="rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
          >
            See the live board
          </Link>
          <Link
            href="/gspc-verify"
            className="rounded-lg border border-emerald-600 px-5 py-3 font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Verify a card yourself
          </Link>
          <Link
            href="/methodology"
            className="rounded-lg border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
          >
            Read the methodology
          </Link>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Measurement, not certification. Every figure on this page is read from{" "}
          <a className="font-semibold text-emerald-700 underline" href="/api/gspc">
            /api/gspc
          </a>{" "}
          or{" "}
          <a className="font-semibold text-emerald-700 underline" href="/api/state">
            /api/state
          </a>{" "}
          at page load, together with the kind of claim it is and the date it was read from. If an
          endpoint does not answer, this page shows no number in its place.
        </p>
      </div>
    </div>
  );
}
