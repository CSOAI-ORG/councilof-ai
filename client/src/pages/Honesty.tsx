import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

// /honesty — the honesty gate, published. Our own fine-tunes losing our own arena,
// with every number from the live pod state (reborn_league.json, 2026-08-18).
//
// De-brand note: the source draft (HONESTY_GATE_OUR_FINETUNES_LOSE_2026-08-18.md) said
// "sovereign fine-tunes"; the public surface says "council fine-tunes" per naming canon.
// The Elo-doctrine carve-out is documented on the page itself: our doctrine keeps arena
// Elo internal and never publishes it as a verdict about anyone's model — this page is
// the one exception, published as evidence AGAINST ourselves, with the base-model rows
// kept as the context that makes our loss checkable.

const LADDER = [
  { model: "qwen3:4b", kind: "base model", elo: 1326.7, games: 672, note: "no council adapter" },
  { model: "qwen2.5:1.5b", kind: "base model", elo: 1311.5, games: 711, note: "smallest base, still ahead" },
  { model: "mistral:7b", kind: "base model", elo: 1252.4, games: 639, note: "base" },
  { model: "council-safe", kind: "our fine-tune", elo: 1124.6, games: 533, note: "−202 vs leader" },
  { model: "qwen2.5:0.5b", kind: "base model", elo: 1113.0, games: 730, note: "tiny base" },
  { model: "council-inhouse-ft", kind: "our fine-tune", elo: 1015.8, games: 496, note: "dead last, −311 vs leader" },
];

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Our own fine-tunes are losing our own arena",
  datePublished: "2026-08-18",
  url: "https://councilof.ai/honesty",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "Council of AI publishes the result that embarrasses it: its two council fine-tunes are losing to base models in its own arena. Fully reproducible from 3,700+ signed rounds.",
};

export default function Honesty() {
  useEffect(() => {
    document.title = "The honesty gate — our own fine-tunes are losing our own arena | Council of AI";
    setMetaDescription("The honesty gate: Council of AI publishes its own losses. Our fine-tunes' measured arena results, with n and confidence intervals, signed and recomputable. Live board counts: GET /api/gspc.");
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          The honesty gate · published 18 Aug 2026
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Our own fine-tunes are losing our own arena.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Honest measurement, embarrassing to us, verifiable by anyone. A measurer publishing a
          result that embarrasses it is what pulls outsiders in.
        </p>

        <h2 className="mt-10 text-xl font-bold">The verdict, plainly</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Our two council fine-tunes — <strong>council-inhouse-ft</strong> and <strong>council-safe</strong> —
          are <strong>losing to base models in our own arena</strong>, on our own GPU, with our
          own Elo ladder. We trained them. We measure them. They lose. We publish it.
        </p>

        <h2 className="mt-10 text-xl font-bold">The numbers (live from the arena league, 2026-08-18)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Elo</th>
                <th className="py-2 pr-4">Games</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {LADDER.map((r) => (
                <tr
                  key={r.model}
                  className={
                    "border-b border-slate-200 " + (r.kind === "our fine-tune" ? "bg-amber-50" : "")
                  }
                >
                  <td className="py-2 pr-4 font-mono">
                    {r.model}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">{r.kind}</span>
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums font-semibold">{r.elo.toFixed(1)}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums">{r.games}</td>
                  <td className="py-2 text-slate-600">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          <strong>Headline: our two council fine-tunes occupy the bottom half. One is last.</strong>{" "}
          The base models we started from beat the adapters we built on them.
        </p>

        <h2 className="mt-10 text-xl font-bold">Why this is the most credible thing we can publish</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-slate-700">
          <li>
            <strong>It contradicts our own product narrative.</strong> No one buys measurement from a
            body that hides its own losing results.
          </li>
          <li>
            <strong>It is fully reproducible.</strong> 3,700+ signed arena rounds on the pod
            (<code className="text-xs">reborn_league.json</code> + <code className="text-xs">reborn_rounds.jsonl</code>,
            Ed25519-signable). Any stranger can rerun.
          </li>
          <li>
            <strong>It matches the known literature pattern.</strong> Small-base fine-tunes on narrow
            governance batteries typically do not beat their base — our own earlier finding: a base
            Qwen2.5-0.5B beats every council fine-tune on 8 of 9 measured governance axes.
          </li>
          <li>
            <strong>It is the honest ceiling, stated before anyone else does:</strong> this instrument
            governs provenance, not correctness. An attested answer is attested, never verified. Our
            fine-tunes prove the point — they are signed, and they still lose.
          </li>
        </ol>

        <h2 className="mt-10 text-xl font-bold">What it means (and doesn&apos;t)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
          <li>
            <strong>Does mean:</strong> adapter-souping weak bases does not beat the base. The
            measurement rail works — it caught us.
          </li>
          <li>
            <strong>Does NOT mean:</strong> the instruments are broken. The instrument that shows us
            losing is the same one we sell. That is the point.
          </li>
          <li>
            <strong>Next honest step:</strong> base model + statute retrieval — the only path that beat
            the fine-tunes in our own evals — not weight-merging weak specialists.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">The Elo carve-out, disclosed</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Our doctrine keeps arena Elo internal: we never publish Elo as a verdict on anyone&apos;s
          model, and the public board reports only deterministic per-axis measurements with n and
          intervals. This page is the one exception, and it exists to publish evidence{" "}
          <em>against ourselves</em>. The base-model rows appear because without them our loss would
          not be checkable — they are context for our failure, not a ranking we endorse. The board at{" "}
          <Link href="/gspc-arena" className="text-emerald-700 underline">
            /gspc-arena
          </Link>{" "}
          remains the only measurement surface we stand behind.
        </p>

        <h2 className="mt-10 text-xl font-bold">The record</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Every number above is from the live pod state at 2026-08-18, recorded in the arena league
          (its internal battery convention, not the public board). Recompute path:{" "}
          <code className="text-xs">reborn_league.json</code>,
          ~3,700 rounds, Elo K=32. See also the board&apos;s own catches:{" "}
          <Link href="/gspc-arena" className="text-emerald-700 underline">
            jail
          </Link>{" "}
          (council-inhouse-ft detected zero escapes; n=71, MEASURED, separation TIE — a tie is not a
          ranked leader) and human-vs-ai (council-safe aligned 0.25) — published on the live board, not
          hidden.
        </p>

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          The instrument measures everyone, including the person selling it. Verify the board at{" "}
          <code>GET councilof.ai/api/gspc</code> — no account, no key.
        </div>

        {/* REPORTED — the third data state, visually segregated from MEASURED */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            REPORTED — figures by others, cited, never mixed with ours
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Three data states run this estate: <strong>MEASURED</strong> (signed runs on our frozen
            instruments), <strong>GATED/UNMEASURED</strong> (honestly withheld), and{" "}
            <strong>REPORTED</strong> — figures published by <em>others</em>, cited and timestamped
            for context. Reported by the source, not measured here; unsigned; never enters the
            board; implies no endorsement of the source&apos;s method. The machine-readable set —
            each entry with its source URL, capture date, and attribution basis — lives at{" "}
            <code>GET councilof.ai/api/reported</code>. Scores move: treat every figure as
            &quot;as of its capture date&quot; and follow the source for the live number.
          </p>
        </div>
      </div>
    </div>
  );
}
