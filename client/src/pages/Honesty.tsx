import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";
import { useEstateFacts } from "@/lib/estateFacts";
import { ANCHORING_CLAIM } from "@/data/anchoringClaim";
import FaqBlock from "@/components/FaqBlock";

/**
 * /honesty — the honesty gate: what this estate publishes against itself.
 *
 * WHAT CHANGED AND WHY (copy-truth sweep, 2026-08-26)
 * This page used to be one story — our fine-tunes losing our own arena — told with a
 * hardcoded Elo ladder whose only source was `reborn_league.json` on a pod. That file
 * is not published anywhere. The page said "Any stranger can rerun", which was not
 * true of a file no stranger can fetch, and every number in the table was typed.
 *
 * The same finding IS backed, by a signed artifact we actually serve:
 * /arena/elo_reference.json (Bradley-Terry Elo, K=32, Wilson 95% CI, generated
 * 2026-08-24). So the ladder is now READ from that file at runtime — no number on
 * this page is typed — and the finding survives on evidence a reader can fetch.
 *
 * The page also now says the other things this estate publishes against itself and
 * had nowhere to say: the withheld cards and the exact limit of what the chain
 * proves about them, the declared-but-unmeasured slots on the board, and the
 * corrections ledger including a verification of our own that could not observe
 * failure. Board and chain counts come from GET /api/gspc and GET /api/state.
 */

interface EloRow {
  model: string;
  elo: number;
  games: number;
  winrate: number;
  ci?: [number, number];
}

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Measurement scope, limitations and corrections | Council of AI",
  datePublished: "2026-08-18",
  dateModified: "2026-08-26",
  url: "https://councilof.ai/honesty",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "Review measurement coverage, in-house model results, signature limitations and documented corrections. Published evidence includes negative findings and distinguishes unmeasured subjects from measured results.",
};


/** FAQ mirrors the five visible honesty sections — FAQPage JSON-LD must match rendered text. */
const HONESTY_FAQ = [
  {
    q: "Do Council of AI's own models beat the bases they started from?",
    a: "No. In the published signed arena reference at /arena/elo_reference.json, the evaluated in-house council models score below their base models. The table reads that dated reference at load time. This is a finding about the tested configurations, not every model or deployment.",
  },
  {
    q: "What does the cryptographic chain prove — and where does it stop?",
    a: "A complete-looking manifest is not a signature. We publish the exact limit of what the chain proves about withheld cards, with no RFC-3161 timestamp authority and no blockchain anchoring behind any card (timestamp_authority: none). Verify the signed envelope yourself under /signed/chain.json with /signed/verify-card.mjs.",
  },
  {
    q: "What board slots have you not measured?",
    a: "UNMEASURED means no qualifying result is published for the stated scope. Qualification depends on the applicable method, sample requirements, frozen test instrument and required review. The declared subject-axis roster has its own thirty-valid-observation admission requirement; that is not a universal sufficiency rule. UNMEASURED is not a failing grade or a zero score. Current counts: GET /api/gspc.",
  },
  {
    q: "Where are corrections published?",
    a: "The corrections ledger at GET /api/corrections records what was wrong, how it was caught, and what changed. Entries are appended; none is edited or deleted. Most were caught by our own instrument turned on its owner — including a verifier that could not observe failure and a card-store verification that returned zero.",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED, and REPORTED?",
    a: "MEASURED means a completed run under a published method; read its separate attestation state. UNMEASURED means a qualifying result is not published for the stated scope. REPORTED is a figure published by someone else, cited and dated, carried for context and left unsigned. A REPORTED number never enters our board and is never averaged with a MEASURED one. Machine-readable set: GET /api/reported.",
  },
] as const;

/** Our own fine-tunes, read from the signed arena reference rather than typed. */
function OurFineTunes() {
  const [rows, setRows] = useState<EloRow[] | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/arena/elo_reference.json", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        const lb = Array.isArray(d?.leaderboard) ? (d.leaderboard as EloRow[]) : [];
        if (!lb.length) return setFailed(true);
        setRows(lb);
        setGenerated(typeof d?.generated === "string" ? d.generated : null);
        setMethod(typeof d?.method === "string" ? d.method : null);
      })
      // An aborted fetch is NOT a failed fetch. React StrictMode runs this effect twice in
      // development and aborts the first one, so `catch(() => setFailed(true))` latched the
      // failure state permanently and the page rendered "The signed arena reference could not
      // be loaded" over an artifact that had answered 200 with a 12-row leaderboard. On the
      // honesty page, of all places, a false "could not load" is the defect it documents.
      .catch((e) => { if ((e as { name?: string })?.name !== "AbortError") setFailed(true); });
    return () => ac.abort();
  }, []);

  // "ours" is decided by the published naming canon: our fine-tunes are the
  // council-* adapters. Everything else on the ladder is a base or frontier model
  // and appears here only as the context that makes our position checkable.
  const isOurs = (m: string) => /^council[-:]/i.test(m);

  if (failed) {
    return (
      <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        The signed arena reference could not be loaded, so this section shows nothing rather than a
        remembered ladder. Fetch it directly at <code>/arena/elo_reference.json</code>.
      </p>
    );
  }
  if (!rows) return <p className="mt-4 text-sm text-slate-500">Loading the signed arena reference…</p>;

  const ours = rows.filter((r) => isOurs(r.model));
  const best = rows[0];
  const worstOurs = ours.length ? ours.reduce((a, b) => (a.elo <= b.elo ? a : b)) : null;

  return (
    <>
      {ours.length > 0 && worstOurs && (
        <p className="mt-3 leading-relaxed text-slate-700">
          On the reference as published, {ours.length === 1 ? "our one council model sits" : `all ${ours.length} of our council models sit`}{" "}
          below the leading base model. The gap between the top of the ladder and our lowest
          adapter is <strong>{Math.round(best.elo - worstOurs.elo)} Elo</strong>. We built them.
          We measure them. They lose. We publish it.
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        {/* min-w so the wrapper actually SCROLLS on a phone. `w-full` alone made
            it never overflow and crushed every cell to one character per line at
            375px. Applied to the LIVE table: the static LADDER this fix was
            originally written against no longer exists. */}
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">Elo</th>
              <th className="py-2 pr-4">Games</th>
              <th className="py-2 pr-4">Win rate</th>
              <th className="py-2">Wilson 95%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.model} className={"border-b border-slate-200 " + (isOurs(r.model) ? "bg-amber-50" : "")}>
                <td className="py-2 pr-4 font-mono">
                  {r.model}
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
                    {isOurs(r.model) ? "our fine-tune" : "not ours"}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono tabular-nums font-semibold whitespace-nowrap">{r.elo.toFixed(1)}</td>
                <td className="py-2 pr-4 font-mono tabular-nums whitespace-nowrap">{r.games}</td>
                <td className="py-2 pr-4 font-mono tabular-nums whitespace-nowrap">{(r.winrate * 100).toFixed(1)}%</td>
                <td className="py-2 font-mono tabular-nums whitespace-nowrap text-slate-600">
                  {r.ci ? `${(r.ci[0] * 100).toFixed(1)}–${(r.ci[1] * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Read from <code>/arena/elo_reference.json</code>
        {generated ? <> · generated {generated}</> : null}
        {method ? <> · {method}</> : null}. Nothing in this table is typed into the page. Rows with a
        small games count carry a wide interval and should be read as such — the interval is printed
        rather than hidden. Arena Elo is an internal-doctrine figure we publish here, against
        ourselves; it is never published as a verdict on anyone else&apos;s model, and the board at{" "}
        <Link href="/gspc-arena" className="text-emerald-700 underline">/gspc-arena</Link> remains the
        only measurement surface we stand behind.
      </p>
    </>
  );
}

export default function Honesty() {
  const board = useBoardCount();
  const facts = useEstateFacts();

  useEffect(() => {
    document.title = "Measurement scope, limitations and corrections | Council of AI";
    setMetaDescription(
      "Review our measurement scope, in-house model comparisons, signature limitations and public corrections. Results remain linked to their published evidence, dates and qualification requirements.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Measurement transparency
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Measurement scope, limitations and corrections.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Understand what the published evidence establishes and where its limits apply.
          This page brings together in-house model results, coverage information, signature
          boundaries and documented corrections. The displayed results are read from their
          published records, including negative findings.
        </p>

        {/* ── 1. our own fine-tunes lose ─────────────────────────────── */}
        <h2 id="council-inhouse-ft" className="mt-12 text-xl font-bold">1. In-house model comparison results</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          In the published arena reference below, the evaluated in-house council models score
          below the base models used to build them. These results remain available for
          independent inspection, with the reference date and method shown alongside the table.
        </p>
        <OurFineTunes />
        <p className="mt-4 leading-relaxed text-slate-700">
          <strong>What the result establishes:</strong> the tested in-house configurations did
          not outperform their base models on this published reference.{" "}
          <strong>What it does not establish:</strong> a conclusion about all fine-tuning methods,
          other test sets or future configurations. Any improvement requires a separate evaluation.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          A signature establishes the integrity and provenance of a record, not the correctness
          of an answer or the quality of a model. The signed in-house results illustrate that
          distinction: verified record integrity does not imply superior measured performance.
        </p>

        {/* ── 2. what the chain does not prove ───────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">2. Signature and evidence limitations</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {facts.verifiedSentence}
          {facts.provenanceNote}
        </p>
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <p className="font-semibold">The limit, stated precisely.</p>
          <p className="mt-2">{facts.withheldSentence}</p>
          <p className="mt-2">
            A position manifest and a verified signature establish different facts.
            The full position manifest is published at{" "}
            <code>/signed/chain.json</code> as a card-shaped, Ed25519-signed envelope — verify
            it yourself with <code>/signed/verify-card.mjs</code>, unchanged, under the same
            pinned key as every card. The derived counts are at{" "}
            <code>/signed/chain-facts.json</code>, each one recomputed from the bytes, and the
            derivation behind these two numbers is at <code>GET /api/state → card_chain</code>.
          </p>
        </div>
        <p className="mt-4 leading-relaxed text-slate-700">
          Two more limits in the same family. There is no RFC-3161 timestamp authority and no
          blockchain anchoring behind any card — our records say{" "}
          <code>timestamp_authority: none</code>. {ANCHORING_CLAIM} There is no
          Ethereum-chain attestation backend.
        </p>

        {/* ── 3. what we have not measured ───────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">3. Coverage and unmeasured results</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {board.count_grammar} Declared coverage and completed measurements are reported
          separately. A declared slot is not a completed measurement.
          {board.live ? "" : " (Showing the last recorded observation of the board; the endpoint wins.)"}
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          A slot remains UNMEASURED until it meets its applicable published method and review
          requirements. The declared subject-axis roster requires at least thirty valid observations,
          a frozen instrument and owner approval; that threshold is specific to the roster, not
          a universal statistical sufficiency rule. In the recorded twenty-four-item wave, the
          jobs remained UNMEASURED. Unreviewed legal labels or an unpublished instrument also
          prevent qualification. UNMEASURED is not a failing grade or a zero score.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          The largest single one: comparative coverage of the evaluation landscape. We have measured{" "}
          <em>one</em> rating organisation, on <em>one</em> criterion, on <em>one</em> benchmark. No
          survey of raters exists and no cross-rater comparison is published, and our claims
          register records that as UNMEASURED at CR-020 rather than letting the one result imply a
          landscape verdict.{" "}
          <Link href="/claims-register" className="text-emerald-700 underline">
            Every material claim, with its status
          </Link>
          .
        </p>

        {/* ── 4. the corrections ledger ──────────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">4. Documented corrections and preserved history</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          The corrections ledger at <code>GET councilof.ai/api/corrections</code> records what was
          wrong, how it was caught, and what changed. Entries are appended; none is edited or
          deleted. Most were caught by our own instrument turned on its owner.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
          <li>
            <strong>A verification of ours that could not observe failure.</strong> Our prerender
            check recorded a failed route in a field named <code>err</code>, while every checker in
            the repository read a field named <code>errored</code> — which never existed. The check
            could not have reported a failure if one had occurred. A verifier that is structurally
            unable to fail is worse than no verifier, because it also produces a green light.
          </li>
          <li>
            <strong>A verification of our own card store that returned zero.</strong> On 26 August
            we ran the ruling&apos;s own test — every card hash must resolve to signed bytes that
            recompute — across eight candidate stores on pods and Hugging Face. It resolved{" "}
            <strong>none of them</strong>, and we published that result at{" "}
            <code>/interop/card-store-verification.json</code> with the qualification that zero
            verified is a fact about the reachable record, not a claim that the cards do not exist.
            Today the bodies published under <code>/signed/cards/</code> do verify, against the
            pinned key, with the verifier we ship — the count is at the top of this section. Both
            records stand: the dated failure is not deleted because a later run succeeded.
          </li>
          <li>
            <strong>We retracted a guarantee rather than rewording it.</strong> We had published a
            consensus guarantee for our council architecture. The historical DR-0007 narrative
            named a numeric result, but its cited result artifact is absent from this repository,
            so that number is unbound and not independently reproducible. The guarantee was
            withdrawn. The 33-seat structure with its
            23-of-33 threshold remains a <em>design</em> figure and is labelled as one everywhere.
            The <a href="/interop/council-independence.json" className="underline">latest published point test</a> measured rho=1 and n_eff=1.
          </li>
          <li>
            <strong>Our own board contradicted our own ruling for two days.</strong> An owner ruling
            set the canonical axis count; the endpoint kept reporting the pre-sweep number because
            the new axis existed in the ruling and not in the payload the count is derived from. No
            axis was marked measured to close that gap.
          </li>
          <li>
            <strong>We repeated a human-versus-machine comparison without checking rule-match.</strong>{" "}
            The attribution was careful and the number was correctly labelled as reported, not
            measured. The defect was publishing the contrast at all without asking whether both
            sides were scored under the same rule — the very question our first rating-the-raters
            result exists to ask.
          </li>
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/refutation-ledger" className="text-emerald-700 underline">
            The refutation ledger — tested and withdrawn claims
          </Link>
        </p>

        {/* ── 5. REPORTED ───────────────────────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">5. REPORTED — figures by others, never mixed with ours</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Three data states run this estate. <strong>MEASURED</strong> — a completed run under a published method;
          read its separate attestation state. <strong>UNMEASURED</strong> — no qualifying result published
          for the stated scope. <strong>REPORTED</strong> — a figure published by someone else, cited and dated,
          carried for context and left unsigned. A REPORTED number never enters our board and is
          never averaged with a MEASURED one; the human-performance baselines beside our AI figures
          are REPORTED aggregates from other people&apos;s studies. The machine-readable set, each
          entry with its source URL, capture date and attribution basis, is at{" "}
          <code>GET councilof.ai/api/reported</code>. Scores move: read every figure as of its
          capture date and follow the source for the live number.
        </p>

        <FaqBlock
          className="mt-12 !bg-transparent !py-0"
          title="Honesty, stated as questions"
          intro="The same five disclosures as the sections above — structured so answer engines can cite them without inventing a sixth."
          items={[...HONESTY_FAQ]}
          openCount={1}
        />

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          The instrument measures everyone, including the people selling it. Check the board at{" "}
          <code>GET councilof.ai/api/gspc</code> and the counts behind this page at{" "}
          <code>GET councilof.ai/api/state</code> — no account, no key, no permission.
        </div>
      </div>
    </div>
  );
}
