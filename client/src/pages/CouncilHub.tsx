import { useEffect } from "react";

// CouncilHub - one end-user identity, 100% integrated into the OS: voice + cognition,
// social character + avatar, compliance passport, and chosen BFT setup. Reachable
// everywhere, shared across CSOAI and MEOK OS. This is the thing that helps the user.
type Layer = { name: string; what: string; status: string; href: string; glyph: string };
const LAYERS: Layer[] = [
  { name: "Voice + Cognition", what: "Your Council assistant companion - it understands, navigates, and acts with you across the OS.", status: "Live demo", href: "/minds", glyph: "VOX" },
  { name: "Social Character + Avatar", what: "Your AI character with your avatar, governing and posting across 12 platforms.", status: "Configurable", href: "/connect", glyph: "AVA" },
  { name: "Compliance Passport", what: "Your Ed25519-signed governance identity - provable, portable, never deniable.", status: "Live", href: "/readiness", glyph: "PASS" },
  { name: "Your Council Setup", what: "Choose how much designed multi-agent review your decisions run on - 5, 12, or 33.", status: "Live", href: "/council", glyph: "33" },
];
export default function CouncilHub() {
  useEffect(() => { document.title = "Your Council assistant - one identity across the OS | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - your Council assistant</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">One Council assistant. Everywhere in the OS.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Your voice, your AI character, your avatar, your passport, your consensus - one integrated identity that helps you across every surface of CSOAI. Not four tools. One Council assistant.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/connect" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Build your Council assistant -&gt;</a>
            <a href="/try" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Put it to work -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
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
          The Council assistant travels with you: the same identity, character, and governance settings work across CSOAI. The live companion (real voice + cross-surface action) switches on with the Layer 0 backend; everything here is configurable now.
        </div>
      </section>
    </div>
  );
}
