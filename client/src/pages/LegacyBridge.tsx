import { useEffect } from "react";

// LegacyBridge — Layer 0 control H. COBOL & mainframe systems, securely tunneled
// into the agentic economy under Layer 0: did:csoai identity on every legacy call,
// Ed25519 attestation of each transaction, and finance pre-checks. The missing
// link for enterprise modernization. Deep product: cobolbridge.ai.

type Cap = { glyph: string; title: string; body: string };

const CAPS: Cap[] = [
  { glyph: "▤", title: "COBOL tunnels", body: "Expose COBOL programs and copybooks as governed, callable services — no rewrite of the core." },
  { glyph: "▥", title: "Mainframe connectors", body: "Bridge CICS, IMS, JCL and VSAM to modern AI agents and REST/MCP, safely." },
  { glyph: "◉", title: "Identity on every call", body: "did:csoai identity is attached to each legacy transaction — who/what acted, provable." },
  { glyph: "✦", title: "Ed25519 attestation", body: "Every bridged transaction is signed and verifiable offline — an audit trail mainframes never had." },
  { glyph: "◆", title: "Finance pre-checks", body: "x402 / ACP / AP2 compliance checks before a legacy transaction touches money." },
  { glyph: "▦", title: "Policy gate", body: "PDCA runtime policy decides allow / escalate / deny before the mainframe executes." },
];

export default function LegacyBridge() {
  useEffect(() => { document.title = "Legacy Bridge (L0-H) — CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Layer 0 · control H · the legacy bridge</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Legacy Bridge</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">COBOL and mainframe systems — securely tunneled into the agentic economy and governed by Layer 0. The trillions of lines still running the world, finally able to act through trusted AI without a rewrite.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="https://cobolbridge.ai" target="_blank" rel="noopener" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">Open CobolBridge →</a>
            <a href="/trust-center" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">See all 8 Layer 0 controls →</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900">What it does</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">{c.glyph}</div>
              <div className="mt-3 font-bold text-gray-900">{c.title}</div>
              <p className="mt-1 text-sm text-gray-500 leading-snug">{c.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">How it flows</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">COBOL / Mainframe</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">CSOAI Legacy Bridge · Layer 0 gate + Ed25519 attest</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">AI agent · API · MCP</span>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Google built coordination. Stripe built checkout. CSOAI built the floor under it all — including the half‑century of COBOL still running banks, governments and insurers. Ask your Council assistant “bridge my mainframe” and it routes you here. Live tunnels and attestation switch on with the Layer 0 gateway.
        </div>
      </section>
    </div>
  );
}
