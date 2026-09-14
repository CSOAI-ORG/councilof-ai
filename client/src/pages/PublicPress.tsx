import { useEffect, useState } from "react";
import evidenceNotes from "@/data/evidence-notes.json";

type BazaarFinding =
  | { state: "loading" }
  | { state: "uncheckable" }
  | {
      state: "probed";
      hosts: number;
      conformant: number;
      pct: number;
      source: string;
      asOf: string;
    };

function readNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// Pressroom - press one-pager + boilerplate for distribution. Quotable facts, the story,
// and a single CTA. Built for journalists, partners, and demo sharing.
const FACTS = [
  {
    k: "What it is",
    v: "An independent AI-measurement body. We measure AI systems against statute, sign the result, and publish what cannot be measured.",
  },
  {
    k: "The Council",
    v: "Designed multi-provider review. Live independence is published on the Refutation Ledger — a designed council, not a live claim.",
  },
  {
    k: "Coverage",
    v: "Statute-anchored instruments. Slot counts, dates and sample sizes live at GET councilof.ai/api/gspc — we do not type them here.",
  },
  {
    k: "The lineage",
    v: "Governance rediscovered from 4,000 years of human history - Athens to Bitcoin to AI.",
  },
  {
    k: "The proof",
    v: "Ed25519-signed measurement cards. Verify is free and loginless at councilof.ai/gspc-verify.",
  },
];
const QUOTES = [
  "We did not invent AI governance. We rediscovered it - and built it in digital form.",
  "No single agent can decide. That is the point.",
  "Measurement, not certification. Empty cells stay empty.",
];

export default function Pressroom() {
  const [revenue, setRevenue] = useState<
    | { state: "loading" }
    | { state: "uncheckable" }
    | {
        state: "measured";
        payers: number;
        settlements: number;
        usdcAtomic: number;
      }
  >({ state: "loading" });
  const [bazaar, setBazaar] = useState<BazaarFinding>({ state: "loading" });

  useEffect(() => {
    document.title = "Pressroom — Council of AI (CSOAI)";
    const controller = new AbortController();
    fetch("/api/revenue", {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`HTTP ${response.status}`)),
      )
      .then((body) => {
        const payers = body?.one_number?.all_time;
        const settlements = body?.one_number?.settlements;
        const usdcAtomic = body?.settled_usdc?.count;
        if (
          body?.one_number?.status === "MEASURED" &&
          Number.isSafeInteger(payers) &&
          payers >= 0 &&
          Number.isSafeInteger(settlements) &&
          settlements >= 0 &&
          Number.isSafeInteger(usdcAtomic) &&
          usdcAtomic >= 0
        ) {
          setRevenue({ state: "measured", payers, settlements, usdcAtomic });
        } else {
          setRevenue({ state: "uncheckable" });
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRevenue({ state: "uncheckable" });
        }
      });
    fetch("/api/coverage", {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`HTTP ${response.status}`)),
      )
      .then((body) => {
        const row = Array.isArray(body?.rows)
          ? body.rows.find((candidate: { id?: unknown }) => candidate?.id === "bazaar")
          : null;
        const note = typeof row?.note === "string" ? row.note : "";
        const hosts = Number.isSafeInteger(row?.indexed?.value) ? row.indexed.value : null;
        const conformant = readNumber(note, /;\s*([0-9]+) answered a conformant v2 402/);
        const pct = readNumber(note, /\(([0-9]+(?:\.[0-9]+)?)%\)/);
        const asOf = note.match(/; as_of ([^.]*)\./)?.[1] ?? null;
        const source = typeof row?.indexed?.source === "string" ? row.indexed.source : null;
        if (hosts !== null && conformant !== null && pct !== null && asOf && source) {
          setBazaar({ state: "probed", hosts, conformant, pct, source, asOf });
        } else {
          setBazaar({ state: "uncheckable" });
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setBazaar({ state: "uncheckable" });
        }
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">
            CSOAI - pressroom
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Press & media kit
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Everything you need to write about CSOAI - the facts, the story, and
            the quotes. The live site is councilof.ai.
          </p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Fast facts</h2>
        <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200">
          {FACTS.map((f) => (
            <div
              key={f.k}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                {f.k}
              </div>
              <div className="text-sm text-gray-700">{f.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            Live commercial proof
          </div>
          {revenue.state === "measured" ? (
            <p className="mt-2 text-sm text-emerald-950">
              <strong>MEASURED:</strong> {revenue.payers.toLocaleString()}{" "}
              outside {revenue.payers === 1 ? "payer" : "payers"},{" "}
              {revenue.settlements.toLocaleString()} non-self{" "}
              {revenue.settlements === 1 ? "settlement" : "settlements"},{" "}
              {(revenue.usdcAtomic / 1_000_000).toFixed(2)} USDC settled on
              Base.
            </p>
          ) : revenue.state === "loading" ? (
            <p className="mt-2 text-sm text-emerald-950">
              Reading the live settlement ledger…
            </p>
          ) : (
            <p className="mt-2 text-sm text-emerald-950">
              <strong>UNCHECKABLE:</strong> the live settlement ledger could not
              be read; no previous count is reused.
            </p>
          )}
          <a
            href="/api/revenue"
            className="mt-3 inline-block font-mono text-xs font-semibold text-emerald-800 underline underline-offset-4"
          >
            Inspect GET /api/revenue
          </a>
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Latest public finding</h2>
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-sky-800">
            x402 Bazaar conformance census
          </div>
          {bazaar.state === "probed" ? (
            <>
              <p className="mt-2 text-lg font-bold text-sky-950">
                {bazaar.conformant.toLocaleString()} of {bazaar.hosts.toLocaleString()} public hosts answered a strict x402 v2 conformance probe ({bazaar.pct.toFixed(2)}%).
              </p>
              <p className="mt-2 text-sm leading-6 text-sky-950">
                This is a daily, read-only probe of third-party doors. It is not a grade, endorsement, customer count, signed measurement, or payment. Snapshot: {bazaar.asOf}.
              </p>
              <a className="mt-3 inline-block font-mono text-xs font-semibold text-sky-800 underline underline-offset-4" href={bazaar.source}>
                Inspect the public dataset
              </a>
            </>
          ) : bazaar.state === "loading" ? (
            <p className="mt-2 text-sm text-sky-950">Reading the live coverage ledger…</p>
          ) : (
            <p className="mt-2 text-sm text-sky-950">
              <strong>UNCHECKABLE:</strong> the live census could not be read; no previous snapshot is reused.
            </p>
          )}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Evidence notes</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          Short notes dated {evidenceNotes.date}. Each one names the signed cards, receipts, ledgers or
          endpoints behind it, and a reader can fetch every one. Measurement, not certification: a gap
          without a separation test is not a ranking, and an UNMEASURED card has no quotable accuracy.
        </p>
        <div className="mt-4 space-y-3">
          {evidenceNotes.notes.map((note) => (
            <details
              key={note.id}
              id={`note-${note.id}`}
              className="rounded-2xl border border-gray-200 p-4"
            >
              <summary className="cursor-pointer">
                <span className="text-sm font-bold text-gray-900">{note.title}</span>
                <span className="mt-1 block text-sm text-gray-600">{note.summary}</span>
              </summary>
              <p className="mt-3 break-words text-sm leading-6 text-gray-800">{note.body}</p>
              <ul className="mt-3 space-y-1">
                {note.artifacts.map((artifact) => (
                  <li key={artifact.url} className="text-xs">
                    <a
                      href={artifact.url}
                      className="break-all font-mono font-semibold text-emerald-800 underline underline-offset-4"
                    >
                      {artifact.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Quotable</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {QUOTES.map((q) => (
            <blockquote
              key={q}
              className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50 p-4 text-sm italic text-emerald-900"
            >
              "{q}"
            </blockquote>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Boilerplate</h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-700 leading-relaxed">
          Council of AI (CSOAI Ltd, UK Companies House 16939677) is an
          independent measurement body for AI behaviour. We run systems against
          frozen, published tests drawn from statute, sign the result, and
          publish the parts we could not measure. We do not certify or
          remediate. A grade is never sold. Verify stays free at
          councilof.ai/gspc-verify. Live board counts are at GET
          councilof.ai/api/gspc.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/try"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
          >
            See the Council live -&gt;
          </a>
          <a
            href="/lineage"
            className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            The story -&gt;
          </a>
          <a
            href="/sectors"
            className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Sector coverage -&gt;
          </a>
        </div>
      </section>
    </div>
  );
}
