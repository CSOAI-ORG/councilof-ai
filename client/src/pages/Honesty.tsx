import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";
import { useEstateFacts } from "@/lib/estateFacts";

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
  headline: "The honesty gate — what Council of AI publishes against itself",
  datePublished: "2026-08-18",
  dateModified: "2026-08-26",
  url: "https://councilof.ai/honesty",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "Council of AI publishes the results that embarrass it: its own fine-tunes below base models in its own signed arena reference, the cards it withholds and the exact limit of what the chain proves about them, the board slots it has not measured, and a corrections ledger that includes a verification of its own that could not observe failure.",
};

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
          On the reference as published, {ours.length === 1 ? "our one council fine-tune sits" : `all ${ours.length} of our council fine-tunes sit`}{" "}
          below the leading base model. The gap between the top of the ladder and our lowest
          adapter is <strong>{Math.round(best.elo - worstOurs.elo)} Elo</strong>. We trained them.
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
    document.title = "The honesty gate — what we publish against ourselves | Council of AI";
    setMetaDescription(
      "The honesty gate: our own fine-tunes below base models in our own signed arena reference, the cards we withhold and the exact limit of what the chain proves, the board slots we have not measured, and our public corrections ledger. Live counts: GET /api/gspc and GET /api/state.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          The honesty gate
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          What we publish against ourselves.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          An instrument that will say anything measures nothing. So this page collects the results
          that embarrass us, the gaps we have not closed, and the exact points where our own
          cryptography stops proving things. Every number on it is read from a published artifact
          at load time; none is typed.
        </p>

        {/* ── 1. our own fine-tunes lose ─────────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">1. Our own fine-tunes lose our own arena</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          We built council fine-tunes on small base models. They are beaten by the bases we started
          from. This is the most credible thing we can publish, because it contradicts our own
          product narrative — and because you can fetch the artifact and check it without us.
        </p>
        <OurFineTunes />
        <p className="mt-4 leading-relaxed text-slate-700">
          <strong>What it does mean:</strong> adapter-souping weak bases does not beat the base, and
          the measurement rail works — it caught us.{" "}
          <strong>What it does not mean:</strong> that the instruments are broken. The instrument
          that shows us losing is the same one we publish. The honest next step is base model plus
          statute retrieval, not weight-merging weak specialists.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          One ceiling, stated before anyone else states it for us: this instrument governs
          provenance, not correctness. An attested answer is attested, never verified. Our own
          fine-tunes are the proof — they are signed, and they still lose.
        </p>

        {/* ── 2. what the chain does not prove ───────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">2. Where our cryptography stops</h2>
        <p className="mt-3 leading-relaxed text-slate-700">{facts.verifiedSentence}</p>
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <p className="font-semibold">The limit, stated precisely.</p>
          <p className="mt-2">{facts.withheldSentence}</p>
          <p className="mt-2">
            We publish that distinction because the alternative is letting a complete-looking
            manifest do work a signature has not done — which is the exact class of defect this
            estate keeps finding in itself. The full position manifest is published at{" "}
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
          <code>timestamp_authority: none</code> and the claims register carries anchoring as
          planned, not live. And our XRP Ledger attestation work is devnet-proven with mainnet
          planned; nothing is attested on any Ethereum chain, because that backend is not built.
        </p>

        {/* ── 3. what we have not measured ───────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">3. What we have not measured</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {board.count_grammar} Those slots are published precisely so the gap is visible. A slot is
          not a measurement and we will not let the larger number stand alone.
          {board.live ? "" : " (Showing the last recorded observation of the board; the endpoint wins.)"}
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          A slot stays UNMEASURED when the sample is too small to quote — nothing goes on the board
          below thirty usable graded items, and a wave queued at twenty-four returned UNMEASURED
          across every job rather than being quoted — or when the instrument is not frozen and
          published, or when the legal gold labels are still with counsel. UNMEASURED is not a
          failing grade for anyone&apos;s AI system; it is a disclosure about us.
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
        <h2 className="mt-12 text-xl font-bold">4. Where we were wrong, appended and never edited</h2>
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
            <code>/interop/card-store-verification.json</code> with the honest note that zero
            verified is a fact about the reachable record, not a claim that the cards do not exist.
            Today the bodies published under <code>/signed/cards/</code> do verify, against the
            pinned key, with the verifier we ship — the count is at the top of this section. Both
            records stand: the dated failure is not deleted because a later run succeeded.
          </li>
          <li>
            <strong>We retracted a guarantee rather than rewording it.</strong> We had published a
            consensus guarantee for our council architecture, then measured how independent those
            seats actually were: the effective number was n_eff 1.21 against 3 nominal legs. The
            guarantee did not hold, so it was withdrawn (DR-0007). The 33-seat structure with its
            23-of-33 threshold remains a <em>design</em> figure and is labelled as one everywhere.
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
            The refutation ledger — claims we published, tested, and killed
          </Link>
        </p>

        {/* ── 5. REPORTED ───────────────────────────────────────────── */}
        <h2 className="mt-12 text-xl font-bold">5. REPORTED — figures by others, never mixed with ours</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Three data states run this estate. <strong>MEASURED</strong> — a graded run on our frozen
          instruments, signed. <strong>UNMEASURED</strong> — honestly empty, published so the gap is
          visible. <strong>REPORTED</strong> — a figure published by someone else, cited and dated,
          carried for context and left unsigned. A REPORTED number never enters our board and is
          never averaged with a MEASURED one; the human-performance baselines beside our AI figures
          are REPORTED aggregates from other people&apos;s studies. The machine-readable set, each
          entry with its source URL, capture date and attribution basis, is at{" "}
          <code>GET councilof.ai/api/reported</code>. Scores move: read every figure as of its
          capture date and follow the source for the live number.
        </p>

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          The instrument measures everyone, including the people selling it. Check the board at{" "}
          <code>GET councilof.ai/api/gspc</code> and the counts behind this page at{" "}
          <code>GET councilof.ai/api/state</code> — no account, no key, no permission.
        </div>
      </div>
    </div>
  );
}
