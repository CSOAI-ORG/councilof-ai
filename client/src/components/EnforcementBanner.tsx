import { useLocation } from "wouter";

// EnforcementBanner — a slim global "who are you?" mini-nav. Instead of a single
// countdown, it lets each visitor self-segment in one click: insurers, regulators,
// enterprises and developers each meet their own door. Hidden on immersive/app routes
// so it never clutters the OS. Dismissable per-session.
const PERSONAS: { who: string; hook: string; href: string }[] = [
  { who: "Insurers", hook: "price AI risk on signed evidence", href: "/industries/insurance" },
  { who: "Regulators", hook: "check behaviour against the law", href: "/regulators" },
  { who: "Enterprises", hook: "prove your AI before you ship", href: "/start" },
  { who: "Developers", hook: "verify a signed card — free forever", href: "/gspc-verify" },
];
// Routes where the banner would clutter the immersive experience.
const HIDE = ["/dashboard?tab=home", "/workbench", "/world", "/globe", "/demo", "/try", "/scan", "/watchdog-map", "/council-space", "/gspc-arena", "/graph", "/council-twin", "/me", "/enter", "/globe3d"];

export default function EnforcementBanner() {
  const [loc] = useLocation();
  if (HIDE.some((h) => loc === h || loc.startsWith(h + "/"))) return null;
  try { if (sessionStorage.getItem("csoai_enf_dismiss") === "1") return null; } catch (e) {}

  function dismiss(e: any) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem("csoai_enf_dismiss", "1"); } catch (er) {} location.reload(); }

  return (
    <div className="w-full border-b border-emerald-600/20 bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-1.5 text-[13px]">
        <span className="hidden shrink-0 font-semibold text-white/90 md:inline">Signed, verifiable evidence of how your AI behaves —</span>
        <span className="shrink-0 font-semibold text-white/90 md:hidden">You're a…</span>
        <nav className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Choose your path">
          {PERSONAS.map((p) => (
            <a
              key={p.who}
              href={p.href}
              title={p.hook}
              className="group inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-0.5 font-semibold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/22"
            >
              {p.who}
              <span className="hidden text-[11px] font-normal text-white/70 lg:inline">· {p.hook}</span>
              <span aria-hidden className="opacity-60 transition group-hover:translate-x-0.5">→</span>
            </a>
          ))}
        </nav>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded px-1.5 text-white/70 hover:bg-white/15 hover:text-white">✕</button>
      </div>
    </div>
  );
}
