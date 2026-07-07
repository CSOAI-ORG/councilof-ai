import { useLocation } from "wouter";

// EnforcementBanner — a slim, global "next EU/US deadline" strip. Auto-picks the
// nearest upcoming enforcement date and links to its page. Hidden on immersive /
// app routes so it never clutters the OS. Dismissable per-session.
const DEADLINES: { d: string; label: string; href: string }[] = [
  { d: "2026-08-02", label: "EU AI Act — GPAI supervision + Article 50 transparency enforceable", href: "/article-50" },
  { d: "2026-09-11", label: "Cyber Resilience Act — vulnerability & incident reporting begins", href: "/cra" },
  { d: "2026-09-30", label: "FedRAMP RFC-0024 — machine-readable OSCAL readiness", href: "/fedramp" },
  { d: "2026-10-17", label: "NIS2 — national transposition deadline", href: "/nis2" },
  { d: "2026-12-02", label: "EU AI Act Article 50 — AI-content marking (legacy systems)", href: "/article-50" },
];
// Routes where the banner would clutter the immersive experience.
const HIDE = ["/os", "/workbench", "/world", "/globe", "/demo", "/try", "/scan", "/watchdog-map", "/sov-space", "/graph", "/emergence", "/enter", "/globe3d"];

export default function EnforcementBanner() {
  const [loc] = useLocation();
  if (HIDE.some((h) => loc === h || loc.startsWith(h + "/"))) return null;
  try { if (sessionStorage.getItem("csoai_enf_dismiss") === "1") return null; } catch (e) {}

  const now = Date.now();
  const next = DEADLINES
    .map((x) => ({ ...x, days: Math.ceil((new Date(x.d + "T00:00:00Z").getTime() - now) / 86400000) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
  if (!next) return null;

  function dismiss(e: any) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem("csoai_enf_dismiss", "1"); } catch (er) {} location.reload(); }

  return (
    <a href={next.href} className="block w-full bg-gradient-to-r from-emerald-700 to-teal-700 text-white hover:from-emerald-600 hover:to-teal-600">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 text-center text-[13px]">
        <span className="hidden sm:inline shrink-0 rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-bold">{next.days}d</span>
        <span className="flex-1 truncate"><b className="sm:hidden">{next.days}d → </b>{next.label} <span className="underline opacity-80">— get ready →</span></span>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded px-1.5 text-white/70 hover:bg-white/15 hover:text-white">✕</button>
      </div>
    </a>
  );
}
