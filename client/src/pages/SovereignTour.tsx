import { useEffect, useState } from "react";

// SovereignTour — the Sovereign walks you through the CSOAI world like a game:
// each surface introduced and narrated, with a way to step in. The guided
// onboarding layer. You command; the Sovereign leads.

type Step = { glyph: string; title: string; say: string; href?: string; label?: string };

const STEPS: Step[] = [
  { glyph: "\u25C9", title: "I am your Sovereign", say: "Welcome to the CSOAI world. I will walk you through it \u2014 the tools, the flow, what matters for you. You command; I act." },
  { glyph: "\u25A6", title: "Sovereign Town", say: "The living, signed record of AI governance \u2014 governed vs ungoverned, in real time, externally anchored to Bitcoin. This is the heartbeat.", href: "/sovereign-town", label: "Visit Sovereign Town" },
  { glyph: "\u25A5", title: "Layer 0", say: "The eight trust controls every governed agent stands on \u2014 identity, policy, attestation. The floor beneath everything.", href: "/trust-center", label: "See Layer 0" },
  { glyph: "\u2756", title: "Your jurisdiction", say: "I already know the regulations and crosswalks for your region. Live AI law across 40+ jurisdictions \u2014 what applies, and what to do.", href: "/global-regulations", label: "Open Regulation Atlas" },
  { glyph: "\u21C4", title: "Crosswalks", say: "One control set mapped across EU AI Act, NIST AI RMF, ISO 42001 and TC260 \u2014 comply once, satisfy many.", href: "/crosswalks", label: "Open Crosswalks" },
  { glyph: "\u229F", title: "The MCP Fleet", say: "216 governed MCP servers across 10 hives \u2014 every tool call identity-checked, policy-gated, and attestable.", href: "/mcp-fleet", label: "See the fleet" },
  { glyph: "\u2316", title: "Distribution", say: "Everywhere we ship \u2014 GitHub, npm, PyPI, glama, mcpize, Smithery, Vercel \u2014 each mapped to its Layer 0 coverage.", href: "/distribution", label: "Open Distribution" },
  { glyph: "\u229E", title: "Evidence & certification", say: "Continuous, automated compliance evidence \u2014 then earn a Watchdog Certificate: provable proof your AI is governed.", href: "/evidence", label: "Open Evidence Hub" },
  { glyph: "\u2726", title: "You are ready", say: "That is the world. From here, just tell me what you need \u2014 speak or type to the Sovereign on the right, any page, any time. I will do the work.", href: "/os", label: "Enter the OS" },
];

export default function SovereignTour() {
  const [i, setI] = useState(0);
  useEffect(() => { document.title = "Your Sovereign \u2014 Guided Tour"; }, []);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  const aurora = { background: "radial-gradient(900px 520px at 50% -10%, rgba(16,185,129,.20), transparent 60%), radial-gradient(700px 520px at 85% 115%, rgba(45,212,191,.16), transparent 60%)" };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070d] text-[#e7f6ef]">
      <div className="pointer-events-none absolute inset-0" style={aurora} />
      <a href="/os" className="absolute right-5 top-5 z-20 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/50 hover:text-emerald-300">Skip {"\u2192"}</a>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 h-20 w-20 rounded-full bg-emerald-400/25 animate-ping" />
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 text-3xl text-emerald-200">{s.glyph}</div>
        </div>

        <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Step {i + 1} of {STEPS.length}</div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">{s.title}</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-emerald-50/85">{s.say}</p>

        {s.href && (
          <a href={s.href} className="mt-6 rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5 transition">{s.label} {"\u2197"}</a>
        )}

        <div className="mt-9 flex items-center gap-4">
          <button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} className="rounded-lg px-4 py-2 text-sm font-semibold text-emerald-200/70 disabled:opacity-30 hover:bg-white/5">{"\u2190"} Back</button>
          {!last ? (
            <button onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition">Next {"\u2192"}</button>
          ) : (
            <a href="/os" className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition">Enter the OS {"\u2192"}</a>
          )}
        </div>

        <div className="mt-8 flex gap-1.5">
          {STEPS.map((_, n) => (
            <button key={n} aria-label={"Step " + (n + 1)} onClick={() => setI(n)} className={"h-1.5 rounded-full transition-all " + (n === i ? "w-6 bg-emerald-400" : "w-1.5 bg-emerald-400/30 hover:bg-emerald-400/60")} />
          ))}
        </div>

        <div className="mt-8 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/40">Guided by your Sovereign {"\u00B7"} on one signed Layer 0 floor</div>
      </div>
    </div>
  );
}
