import { Link, useLocation } from "wouter";

/**
 * Council section nav — slim horizontal bar that sits above all /council/*
 * pages. Mirrors the Council substrate: 5 facets (Overview + Dome, Maps,
 * Compliance, Law, Sigil).
 */
const councilLinks = [
  { href: "/council", label: "Overview" },
  { href: "/council/dome", label: "Dome" },
  { href: "/council/maps", label: "Maps" },
  { href: "/council/compliance", label: "Compliance" },
  { href: "/council/law", label: "Law" },
  { href: "/council/sigil", label: "Sigil" },
];

export default function CouncilNav() {
  const [location] = useLocation();
  return (
    <div className="border-y border-emerald-500/20 bg-slate-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 overflow-x-auto text-sm">
        <span className="text-emerald-400 font-bold tracking-tight mr-3 shrink-0">
          CSOAI Council
        </span>
        {councilLinks.map((l) => {
          const active = location === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                active
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
