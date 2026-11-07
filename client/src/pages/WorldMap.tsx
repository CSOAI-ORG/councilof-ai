import { useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import RelevanceMap from "./RelevanceMap";
import RegionsMap from "./RegionsMap";
import RiskHeatmap from "./RiskHeatmap";

/**
 * WorldMap — one page for the regulatory world views, 2 Nov 2026 consolidation.
 *
 * What was wrong (the owner's own complaint, "we have like 3 diff main UI for the map"):
 * three sibling surfaces — /map (relevance bridges), /regions (frameworks by region) and
 * /risk-heatmap (a worked risk matrix) — each with its own hero, its own nav path and no
 * link between them, while the immersive globe lived on its own redirect. They are now tabs
 * of this one page; the old paths redirect into their tab (in App.tsx), and /globe carries
 * WorldGlobe again. No new data and no new model calls: the tabs mount the existing page
 * bodies in their `embedded` modes (the same mode the Regulation matrix pane uses).
 */

type WorldTab = {
  id: string;
  label: string;
  blurb: string;
};

const TABS: WorldTab[] = [
  {
    id: "bridges",
    label: "What governs what",
    blurb: "Pick an industry; the map renders the connectors that carry evidence for it and the frameworks they touch.",
  },
  {
    id: "regions",
    label: "By region",
    blurb: "EU, US and Global: the frameworks in force, what is phasing in, and what covers each.",
  },
  {
    id: "risk",
    label: "Risk matrix",
    blurb: "A worked example: likelihood × impact, a plotted register, owners and treatments.",
  },
];

const VALID_IDS = TABS.map((t) => t.id);

function tabFromSearch(search: string): string {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("tab");
  return raw && VALID_IDS.includes(raw) ? raw : VALID_IDS[0];
}

export default function WorldMap() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const active = useMemo(() => tabFromSearch(search), [search]);

  useEffect(() => {
    document.title = "World maps — what governs what, by region, risk · CSOAI";
  }, []);

  const selectTab = (id: string) => {
    setLocation(`/map?tab=${id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · world maps</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">What governs AI, in one place</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Three views of the regulatory world, and the globe on its own page. Maps show relevance,
            not compliance verdicts.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="/globe" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
              Open the globe →
            </a>
            <a href="/law" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">
              Your jurisdiction stack →
            </a>
            <a href="/gspc-arena" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">
              Council Space →
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        {/* ARIA tabs pattern (P6 accessibility pass, 2026-11-02): role=tablist/tab/tabpanel,
            aria-selected + aria-controls instead of the looser aria-current, roving tabIndex and
            Arrow/Home/End keys per WAI-ARIA. The URL stays the source of truth (?tab=), so the
            keyboard and a screen-reader rotation behave exactly like a click. */}
        <div
          role="tablist"
          aria-label="World map views"
          className="flex flex-wrap gap-2"
          data-testid="world-tabs"
          onKeyDown={(e) => {
            const idx = TABS.findIndex((t) => t.id === active);
            let next = -1;
            if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
            else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = TABS.length - 1;
            if (next < 0) return;
            e.preventDefault();
            selectTab(TABS[next].id);
            document.getElementById(`world-tab-${TABS[next].id}`)?.focus();
          }}
        >
          {TABS.map((t) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`world-tab-${t.id}`}
                onClick={() => selectTab(t.id)}
                aria-selected={selected}
                aria-controls={`world-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                data-testid={`world-tab-${t.id}`}
                className={
                  "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold transition-colors " +
                  (selected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-500" data-testid="world-tab-blurb">
          {TABS.find((t) => t.id === active)?.blurb}
        </p>

        <div
          role="tabpanel"
          id={`world-panel-${active}`}
          aria-labelledby={`world-tab-${active}`}
          tabIndex={-1}
          className="mt-6 focus-visible:outline-none"
          data-testid={`world-panel-${active}`}
        >
          {active === "bridges" ? <RelevanceMap embedded /> : null}
          {active === "regions" ? <RegionsMap embedded /> : null}
          {active === "risk" ? <RiskHeatmap embedded /> : null}
        </div>
      </section>
    </div>
  );
}
