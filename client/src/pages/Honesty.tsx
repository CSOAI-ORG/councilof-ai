import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";
import { Band, Caveat, PageHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";
import { BoardCount } from "@/components/pagekit/useBoardCount";

// /honesty — the honesty gate, published. Our own fine-tunes losing our own arena,
// with every number from the live pod state (reborn_league.json, 2026-08-18).
//
// De-brand note: the source draft said "sovereign fine-tunes"; the public surface
// says "council fine-tunes" per naming canon. The Elo-doctrine carve-out is
// documented on the page itself: our doctrine keeps arena Elo internal and never
// publishes it as a verdict about anyone's model — this page is the one exception,
// published as evidence AGAINST ourselves, with the base-model rows kept as the
// context that makes our loss checkable.
//
// Design: the homepage scroll-world language via components/pagekit/PageKit.

const LADDER = [
  { model: "qwen3:4b", kind: "base model", elo: 1326.7, games: 672, note: "no council adapter" },
  { model: "qwen2.5:1.5b", kind: "base model", elo: 1311.5, games: 711, note: "smallest base, still ahead" },
  { model: "mistral:7b", kind: "base model", elo: 1252.4, games: 639, note: "base" },
  { model: "council-safe", kind: "our fine-tune", elo: 1124.6, games: 533, note: "−202 vs leader" },
  { model: "qwen2.5:0.5b", kind: "base model", elo: 1113.0, games: 730, note: "tiny base" },
  { model: "council-oowm", kind: "our fine-tune", elo: 1015.8, games: 496, note: "dead last, −311 vs leader" },
];

const WHY = [
  {
    h: "It contradicts our own sales story",
    b: "Nobody should buy measurement from a body that only publishes the results that flatter it. So here is the one that does not.",
  },
  {
    h: "It is fully reproducible",
    b: "3,700+ signed arena rounds (reborn_league.json + reborn_rounds.jsonl, Ed25519-signable). Any stranger can rerun it and check our arithmetic.",
  },
  {
    h: "It matches the known pattern",
    b: "Small-base fine-tunes on narrow governance batteries usually do not beat their base. Our own earlier finding said the same: a base Qwen2.5-0.5B beat every council fine-tune on 8 of 9 measured governance axes.",
  },
  {
    h: "It states our ceiling before anyone else does",
    b: "This instrument governs provenance, not correctness. An attested answer is attested, never verified. Our fine-tunes make the point: they are signed, and they still lose.",
  },
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
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />

      <PageHero
        kicker="The honesty gate · published 18 Aug 2026"
        title={<>Our own fine-tunes are losing our own arena.</>}
        lede={
          <>
            We trained them. We measure them. They lose to the plain base models we started from —
            and one of ours is dead last. Here is the ladder, the sample sizes and the recompute path,
            so you can check the most embarrassing result we have.
          </>
        }
        image={{ src: "/images/coliseum_swarm_clash.jpg", alt: "Swarms of AI systems clashing across the arena floor while the stands look on" }}
        points={[
          { tag: "pain", text: "Every vendor publishes the benchmark it wins. You have no way to tell scorekeeping from marketing." },
          { tag: "benefit", text: "The one result we would most like to hide, published with its n and its raw rounds." },
          { tag: "usp", text: "The instrument that catches us is the same instrument we sell. That is the whole argument." },
        ]}
        actions={[
          { href: "/gspc-scoreboard", label: "See the live board" },
          { href: "/refutation-ledger", label: "Read the Refutation Ledger", tone: "ghost" },
        ]}
        footnote={
          <>
            Measurement, not certification. The public board reports <BoardCount suffix="axes" />,
            read live from GET /api/gspc — never typed into this page.
          </>
        }
      />

      <Band
        tone="tint"
        kicker="The numbers · arena league, 2026-08-18"
        title={<>The bottom half is ours.</>}
        lede={
          <>
            Both council fine-tunes sit in the bottom half of the ladder. The base models we built on
            beat the adapters we built on them.
          </>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Elo</th>
                  <th className="px-5 py-3">Games</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {LADDER.map((r) => (
                  <tr
                    key={r.model}
                    className={
                      "border-b border-gray-100 last:border-0 " +
                      (r.kind === "our fine-tune" ? "bg-amber-50/80" : "")
                    }
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                      {r.model}
                      <span className="ml-2 text-[10px] font-sans uppercase tracking-wide text-gray-400">
                        {r.kind}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold tabular-nums text-gray-900">{r.elo.toFixed(1)}</td>
                    <td className="px-5 py-3 font-mono tabular-nums text-gray-600">{r.games}</td>
                    <td className="px-5 py-3 text-gray-600">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-gray-600">
          Every figure above comes from the live arena league state at 2026-08-18 —{" "}
          <code className="text-[13px]">reborn_league.json</code>, ~3,700 rounds, Elo K=32. That is
          the arena&apos;s internal battery convention, not the public board.
        </p>
      </Band>

      <Band
        kicker="Why we publish it"
        title={<>A measurer that hides its losses is not a measurer.</>}
        lede={
          <>
            This page exists because the credibility of everything else on this site depends on it.
            Four reasons it is the most useful thing we can put in front of you.
          </>
        }
      >
        <PanelGrid cols={2}>
          {WHY.map((w) => (
            <Panel key={w.h}>
              <h3 className="text-lg font-black tracking-tight text-gray-900">{w.h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{w.b}</p>
            </Panel>
          ))}
        </PanelGrid>
      </Band>

      <Band
        tone="tint"
        width="prose"
        kicker="What it means, and what it does not"
        title={<>Read this the careful way.</>}
      >
        <div className="space-y-5 text-[16px] leading-relaxed text-gray-700">
          <p>
            <strong className="text-gray-900">It does mean</strong> that souping adapters onto weak
            base models does not beat the base. The measurement rail works — it caught us.
          </p>
          <p>
            <strong className="text-gray-900">It does not mean</strong> the instruments are broken.
            The instrument that shows us losing is the same one we sell. That is the point.
          </p>
          <p>
            <strong className="text-gray-900">The next honest step</strong> is a base model plus
            statute retrieval — the only path that beat the fine-tunes in our own evaluations — not
            weight-merging weak specialists.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <Caveat title="The Elo carve-out, disclosed">
            <p>
              Our doctrine keeps arena Elo internal: we never publish Elo as a verdict on anyone
              else&apos;s model, and the public board reports only deterministic per-axis
              measurements with n and intervals. This page is the single exception, and it exists to
              publish evidence <em>against ourselves</em>. The base-model rows appear because without
              them our loss would not be checkable — they are the context for our failure, not a
              ranking we endorse. The board at{" "}
              <a href="/gspc-arena" className="font-semibold underline">
                /gspc-arena
              </a>{" "}
              remains the only measurement surface we stand behind.
            </p>
          </Caveat>

          <Caveat title="REPORTED — figures by others, cited, never mixed with ours">
            <p>
              Three data states run this estate. <strong>MEASURED</strong> — signed runs on our frozen
              instruments. <strong>GATED / UNMEASURED</strong> — honestly withheld. And{" "}
              <strong>REPORTED</strong> — figures published by <em>others</em>, cited and timestamped
              for context: reported by the source, not measured here, unsigned, never entering the
              board, and implying no endorsement of the source&apos;s method.
            </p>
            <p>
              The machine-readable set — each entry with its source URL, capture date and attribution
              basis — lives at <code>GET councilof.ai/api/reported</code>. Scores move: treat every
              figure as &ldquo;as of its capture date&rdquo; and follow the source for the live number.
            </p>
          </Caveat>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-[15px] leading-relaxed text-emerald-900">
          The instrument measures everyone, including the people selling it. Verify the board
          yourself: <code>GET councilof.ai/api/gspc</code> — no account, no key, no charge.
        </div>
      </Band>
    </div>
  );
}
