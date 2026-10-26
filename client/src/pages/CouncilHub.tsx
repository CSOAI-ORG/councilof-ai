import { useEffect } from "react";

// CouncilHub (/me) — personal and developer workspace hub on councilof.ai.
// Routes technical and statutory evidence visitors directly to MCP/A2A connection,
// card verification, claim maintenance, and Council Minds/Design, while keeping
// consumer character/avatar products clearly scoped to meok.ai.
type Layer = { name: string; what: string; status: string; href: string; glyph: string };
const LAYERS: Layer[] = [
  {
    name: "Connect MCP & A2A Clients",
    what: "Wire Google Antigravity, Claude, Cursor, VS Code, Gemini CLI, NVIDIA NeMo Agent Toolkit, DeepSeek, MiniMax, Qwen, Kimi, or OpenClaw to the free MCP door (/mcp/free).",
    status: "Live · 50 clients",
    href: "/connect/",
    glyph: "MCP",
  },
  {
    name: "Verify Signed Cards & Roots",
    what: "Check Ed25519 measurement cards and Merkle root inclusion proofs in your browser or offline (VALID / INVALID / UNCHECKABLE). Verification is free.",
    status: "Live · Free",
    href: "/gspc-verify",
    glyph: "VFY",
  },
  {
    name: "Claim Maintenance Register",
    what: "Inspect public capability claims, scheduled re-reads, SHA-256 digests, and side-by-side measurements without verdicts.",
    status: "Live register",
    href: "/claim-maintenance/",
    glyph: "CLM",
  },
  {
    name: "Voice + Cognition (Council Minds)",
    what: "How the assistant reasons, speaks, and routes across Layer 0, with what runs locally and what remains a design.",
    status: "Architecture & demo",
    href: "/minds",
    glyph: "VOX",
  },
  {
    name: "Council Design (33-Seat Architecture)",
    what: "Explore the proposed 33-seat specialist roster and 23/33 target. No live vote or failure-resilience property is claimed.",
    status: "Design only",
    href: "/council",
    glyph: "33",
  },
];
export default function CouncilHub() {
  useEffect(() => {
    document.title = "Your Council assistant | Council of AI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Council of AI · Agent &amp; Developer Hub</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">One measurement &amp; assistant surface across the OS.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Connect your IDE or agent to the live GSPC measurement board, verify signed Ed25519 measurement cards, inspect maintained public claims, or explore the Council Minds architecture. Measurement, not certification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/connect/" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Connect an agent (50 clients) -&gt;</a>
            <a href="/gspc-verify" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Verify a signed card -&gt;</a>
            <a href="/dashboard" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Open Council OS -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l) => (
            <a key={l.name} href={l.href} className="flex flex-col rounded-2xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <div className="flex h-11 items-center justify-center rounded-xl bg-emerald-50 px-3 text-sm font-black text-emerald-700">{l.glyph}</div>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{l.status}</span>
              </div>
              <div className="mt-3 text-lg font-bold text-gray-900">{l.name}</div>
              <p className="mt-1 flex-1 text-sm text-gray-600 leading-snug">{l.what}</p>
              <span className="mt-3 text-sm font-bold text-emerald-700">Open -&gt;</span>
            </a>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <strong>Boundary note:</strong> Council of AI (CSOAI Ltd, UK Companies House 16939677) is the independent AI-behaviour measurement body — published tests, signed measurement cards, and free verification (<a href="/gspc-verify" className="font-semibold underline">/gspc-verify</a>). Consumer character, voice companion, and avatar products are operated separately on <a href="https://meok.ai" className="font-semibold underline" rel="noopener noreferrer">meok.ai</a>.
        </div>
      </section>
    </div>
  );
}
