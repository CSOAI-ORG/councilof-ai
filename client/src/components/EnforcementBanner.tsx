import { useLocation } from "wouter";

// EnforcementBanner — a slim tagline + dismiss. Keeps the header clean.
// Hidden on immersive/app routes so it never clutters the OS. Dismissable per-session.
const HIDE = ["/os", "/workbench", "/world", "/globe", "/demo", "/try", "/scan", "/watchdog-map", "/council-space", "/sov-space", "/graph", "/council-twin", "/sovereign-twin", "/enter", "/globe3d", "/gspc-arena", "/gspc-scoreboard", "/gspc-verify"];

export default function EnforcementBanner() {
  const [loc] = useLocation();
  if (HIDE.some((h) => loc === h || loc.startsWith(h + "/"))) return null;
  try { if (sessionStorage.getItem("csoai_enf_dismiss") === "1") return null; } catch (e) {}

  function dismiss(e: any) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem("csoai_enf_dismiss", "1"); } catch (er) {} location.reload(); }

  return (
    <div className="w-full border-b border-emerald-600/20 bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-[13px]">
        <span className="font-medium text-white/95">
          Council of AI — verified measurement credentials for AI governance
        </span>
        <div className="flex items-center gap-3">
          <a
            href="/gspc-verify"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-white hover:bg-white/25 transition"
          >
            Verify free →
          </a>
          <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded px-1.5 text-white/70 hover:bg-white/15 hover:text-white">✕</button>
        </div>
      </div>
    </div>
  );
}
