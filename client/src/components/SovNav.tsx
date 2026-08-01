import { Link, useLocation, useSearch } from "wouter";

// SovNav — one sub-nav binding the agentic Sovereign surfaces into a single suite.
// 2026-08-01 unification: the globe, the arena and the towns are LAYERS of
// Sov Space now, not separate products; the links carry ?view=.
const LINKS = [
  { href: "/sov-space?view=globe", label: "🌍 Globe", view: "globe" },
  { href: "/sov-space", label: "◈ Sov Space", alt: "/simulate", view: "" },
  { href: "/sov-space?view=arena", label: "🏟 Arena", view: "arena" },
  { href: "/sov-space?view=towns", label: "🏘 Towns", view: "towns" },
  { href: "/intel", label: "⬡ Distribution Hive", view: null },
  { href: "/try", label: "▶ Live Council", view: null },
];

export default function SovNav() {
  const [loc] = useLocation();
  const search = useSearch();
  const currentView = new URLSearchParams(search).get("view") || "";
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/55">Sovereign Space ·</span>
      {LINKS.map((l) => {
        const linkPath = l.href.split("?")[0];
        const active = l.view !== null
          ? loc === linkPath && currentView === l.view
          : loc === linkPath || (l.alt && loc === l.alt);
        return (
          <Link key={l.href} href={l.href} className={"rounded-full border px-3 py-1 text-[11px] font-bold transition " + (active ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-400/25 text-emerald-300/75 hover:bg-emerald-500/10")}>{l.label}</Link>
        );
      })}
    </div>
  );
}
