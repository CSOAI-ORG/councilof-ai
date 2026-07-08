import { Link, useLocation } from "wouter";

// SovNav — one sub-nav binding the agentic Sovereign surfaces into a single suite,
// so the globe, the sims, the hive and the live council feel like one product.
const LINKS = [
  { href: "/globe", label: "🌍 Globe" },
  { href: "/sov-space", label: "◈ Sov Space", alt: "/simulate" },
  { href: "/intel", label: "⬡ Distribution Hive" },
  { href: "/try", label: "▶ Live Council" },
];

export default function SovNav() {
  const [loc] = useLocation();
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/55">Sovereign Space ·</span>
      {LINKS.map((l) => {
        const active = loc === l.href || (l.alt && loc === l.alt);
        return (
          <Link key={l.href} href={l.href} className={"rounded-full border px-3 py-1 text-[11px] font-bold transition " + (active ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-400/25 text-emerald-300/75 hover:bg-emerald-500/10")}>{l.label}</Link>
        );
      })}
    </div>
  );
}
