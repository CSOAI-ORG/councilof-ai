import { useEffect } from "react";
import { Link } from "wouter";
import {
  Umbrella,
  Landmark,
  HeartPulse,
  Shield,
  Server,
  Radar,
  Network,
  GitBranch,
  Boxes,
  Lock,
  Cog,
  PersonStanding,
  Glasses,
  Scale,
  Brain,
  ArrowRight,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import { industriesForGrid } from "../data/industries";
import { useGspcBoard, type GspcAxis } from "../components/board/useGspcBoard";

/**
 * The hub chip used to read a `separation` verdict typed into the industries
 * data file. It now derives from the live board: a sector's chip is the state
 * of the axis that sector names. "reading the board" shows until the fetch
 * lands — a chip is a claim about a measurement, and showing one before the
 * measurement has been read would be asserting it.
 */
type SectorState = "SEPARATED" | "TIE" | "UNMEASURED" | "PENDING";

function sectorState(axes: string[], rows: GspcAxis[] | null): SectorState {
  if (!rows) return "PENDING";
  const mine = axes.map((id) => rows.find((r) => r.axis === id)).filter(Boolean) as GspcAxis[];
  if (!mine.length || mine.every((a) => a.status !== "MEASURED")) return "UNMEASURED";
  if (mine.some((a) => a.separation === "SEPARATED")) return "SEPARATED";
  return "TIE";
}

const SECTOR_CHIP: Record<SectorState, { text: string; className: string; title: string }> = {
  SEPARATED: {
    text: "SEPARATED",
    className: "bg-emerald-100 text-emerald-800",
    title: "At least one axis this sector names has a statistically separated leader (McNemar p<0.05).",
  },
  TIE: {
    text: "TIE",
    className: "bg-slate-200 text-slate-700",
    title: "Measured, but no separated lead. A tie is never counted as a win.",
  },
  UNMEASURED: {
    text: "UNMEASURED",
    className: "bg-amber-100 text-amber-800",
    title: "No run stands behind the axis this sector names. Published so the gap is visible.",
  },
  PENDING: {
    text: "reading the board",
    className: "bg-slate-100 text-slate-500",
    title: "GET /api/gspc has not answered yet. No state is claimed until it does.",
  },
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Umbrella,
  Landmark,
  HeartPulse,
  Shield,
  Server,
  Radar,
  Network,
  GitBranch,
  Boxes,
  Lock,
  Cog,
  PersonStanding,
  Glasses,
  Scale,
  Brain,
};

// Hub for /industries — one 15-card grid, one hue (emerald + neutral),
// driven by the same data array as every per-sector page.
export default function IndustrySolutions() {
  const { data } = useGspcBoard();
  const rows = (data?.axes as GspcAxis[] | undefined) ?? null;
  useEffect(() => {
    document.title = "Industries — what we measure, by sector · CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Measurement, not certification
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What we measure, by industry
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {industriesForGrid.length} sectors, each with its own law and its own named board axes.
            Pick a sector to see the provisions that bind it, what we measure against the
            Governance · Safety · Provenance · Continuity axis, and that sector's live rows — n,
            interval and separation verdict, read from <code>GET /api/gspc</code> as the page loads
            rather than written into the page. Where no run stands behind an axis, it reads
            unmeasured.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> deterministic grading on frozen splits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDot className="h-4 w-4 text-amber-500" /> ties reported as ties, gaps labelled UNMEASURED
            </span>
          </div>
        </div>
      </section>

      {/* 15-card grid */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industriesForGrid.map((industry) => {
            const Icon = ICONS[industry.icon] ?? Shield;
            const chip = SECTOR_CHIP[sectorState(industry.axes, rows)];
            return (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                className={`group relative flex flex-col rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  industry.beachhead
                    ? "border-emerald-300 ring-1 ring-emerald-200"
                    : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                {industry.beachhead && (
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Beachhead
                  </span>
                )}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{industry.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{industry.short}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {industry.bench}
                  </span>
                  <span
                    title={chip.title}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${chip.className}`}
                  >
                    {chip.text}
                  </span>
                </div>

                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                  See the measurement <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Honesty footer */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-slate-600">
            CSOAI is a measurement body. Every number is a measured run on a published, frozen split;
            the harness is public and anyone can recompute and challenge it. A “leader” is the highest
            point estimate on the board — a TIE means that lead is not statistically separated, and we
            do not count ties as wins. Nothing here is certification, accreditation or approval.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Measure free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard?task=enterprise-start&tab=measured"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Enterprise lobby
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
