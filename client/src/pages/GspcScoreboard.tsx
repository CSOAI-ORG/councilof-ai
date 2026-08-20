import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { Band, Caveat, PageHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";

/**
 * /gspc-scoreboard — the live board, honestly displayed (NEXT-100 #2).
 * Every hero CTA already points here; until now it fell through to the SPA
 * catch-all. Renders LIVE from /api/gspc: per-axis n, leader accuracy with
 * Wilson CI where the n is honest, and first-class separation chips.
 * LMArena rule adopted verbatim: overlapping/failed separation renders as
 * "statistically indistinguishable" — never as a ranking.
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

// The board Dataset + a hasPart catalog of all 13 published per-axis banks, so
// Hugging Face Dataset-Search and answer engines can index each bank (real HF
// URLs, CC-BY-4.0, the resolving concept DOI) from this one crawlable page.
// Derived from the axis registry — see client/src/lib/datasetSchema.ts.
const DATASET_LD = gspcDatasetLd();

const CHIP: Record<string, string> = {
  SEPARATED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  TIE: "bg-amber-100 text-amber-800 border-amber-300",
  UNTESTED: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function GspcScoreboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "The GSPC board — 13 measured of 14, live | Council of AI";
    setMetaDescription("The live GSPC board — 13 measured of 14, every measured cell with n and 95% CI where honest. UNMEASURED is reported, never hidden. Counts and stamps come from GET /api/gspc.");
    fetch("/api/gspc")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DATASET_LD) }} />

      <PageHero
        kicker="Live from GET /api/gspc — recompute anything, free"
        title={<>The GSPC board.</>}
        lede={
          <>
            Deterministic grading on frozen, published splits. A <strong>TIE</strong> means the
            leader&apos;s edge is <strong>statistically indistinguishable</strong> (McNemar p≥0.05),
            and ties are never counted as wins. Empty cells stay empty.
          </>
        }
        image={{ src: "/images/coliseum_hero_arena.jpg", alt: "The Council of AI arena, the board raised above a full house" }}
        points={[
          { tag: "pain", text: "Leaderboards show you a ranking and hide the sample size, so you cannot tell a lead from noise." },
          { tag: "benefit", text: "Every cell carries its n and, where the n is honest, a Wilson 95% interval." },
          { tag: "usp", text: "A lead that fails its separation test is printed as a tie, not quietly rounded into a win." },
        ]}
        actions={[
          { href: "/gspc-verify", label: "Verify a card, free" },
          { href: "/methodology", label: "Read the method", tone: "ghost" },
        ]}
        footnote={
          <>
            The board count is read live from the wire —{" "}
            <strong className="text-gray-900">
              {data?.totals?.public_count ?? "fetching the live count…"}
            </strong>
            . Measurement, not certification.
          </>
        }
      />

      <Band tone="tint" width="wide">

        {err && <p className="text-red-600">Board fetch failed: {err} — the API at /api/gspc is the source of truth.</p>}
        {!data && !err && <p className="text-gray-500">Loading the live board…</p>}

        {data && (
          <div className="overflow-x-auto rounded-2xl border border-emerald-900/10 bg-white shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-gray-600">
                  <th className="p-3">Axis</th>
                  <th className="p-3">Bench</th>
                  <th className="p-3">n</th>
                  <th className="p-3">Leader accuracy</th>
                  <th className="p-3">95% CI</th>
                  <th className="p-3">Separation</th>
                </tr>
              </thead>
              <tbody>
                {(data.axes as Axis[]).map((a) => (
                  <tr key={a.axis} className="border-b last:border-0">
                    <td className="p-3 font-semibold text-gray-900">{a.axis}</td>
                    <td className="p-3 text-gray-600">{a.bench}</td>
                    <td className="p-3 font-mono">{a.n}</td>
                    <td className="p-3 font-mono">
                      {(a as any).accuracy_is ? "≥" : ""}{(a.accuracy * 100).toFixed(1)}%
                      {(a as any).accuracy_is && (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400" title={(a as any).accuracy_is}>
                          lower bound
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-gray-600">
                      {a.interval ? `${(a.interval[0] * 100).toFixed(1)}–${(a.interval[1] * 100).toFixed(1)}%` : "withheld (n not independent)"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[a.separation]}`}>
                        {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                      </span>
                      {a.separation_p !== undefined && (
                        <span className="ml-2 font-mono text-[11px] text-gray-400">p={a.separation_p}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </Band>

      <Band width="prose">
        <PanelGrid cols={3}>
          {[
            { href: "/gspc-verify", label: "Verify a card — free, in your browser" },
            { href: "/honesty", label: "The honesty gate — our own losses" },
            { href: "/api/reported", label: "REPORTED — third-party context, cited" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-emerald-600/20 bg-white p-5 text-[15px] font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
            >
              {l.label} →
            </a>
          ))}
        </PanelGrid>

        <div className="mt-8">
          <Caveat title="How to read this board">
            <p>
              Measurement, not certification. The leaders shown are point estimates — swarm quotes its
              95% lower bound — and only <strong>SEPARATED</strong> leads are statistically real. The
              live slot counts, including how many are separated, come from{" "}
              <code>GET /api/gspc</code> rather than from this page.
            </p>
            <p>
              Jail is a <strong>measured floor with separation untested</strong>: it was measured on a
              smaller fleet and never given a separation test, which is stated here rather than
              hidden. Full per-axis notes, fleet means, harm tails and the signed living stamp all
              live on the wire.
            </p>
          </Caveat>
        </div>
      </Band>
    </div>
  );
}
