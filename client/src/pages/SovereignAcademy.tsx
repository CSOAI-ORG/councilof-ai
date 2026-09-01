import { useEffect } from "react";

// Council Academy — learning as an immersive journey inside the OS, not a manual.
// The guide walks you path by path (Foundations -> Your Jurisdiction -> Apply
// -> Attest); every module flows straight into the real tool. Learn by living it.
// NB: the fourth path attests TRAINING, never conformity — Council of AI certifies nothing.

type Mod = { name: string; href: string };
type Path = { n: number; title: string; blurb: string; ring: string; chip: string; modules: Mod[] };

const PATHS: Path[] = [
  { n: 1, title: "Foundations", blurb: "Stand on the floor first — identity, policy, attestation.", ring: "border-amber-300", chip: "bg-amber-100 text-amber-800", modules: [
    { name: "Layer 0 — the 8 trust controls", href: "/layer0" },
    { name: "The 52-Article Charter", href: "/charter" },
    { name: "SOAI-PDCA methodology", href: "/soai-pdca" },
  ] },
  { n: 2, title: "Your jurisdiction", blurb: "Learn the frameworks and law that apply to you — wherever you are.", ring: "border-emerald-300", chip: "bg-emerald-100 text-emerald-800", modules: [
    { name: "EU AI Act", href: "/eu-ai-act" },
    { name: "NIST AI RMF", href: "/nist-ai-rmf" },
    { name: "ISO/IEC 42001", href: "/iso-42001" },
    { name: "TC260 (China)", href: "/tc260" },
  ] },
  { n: 3, title: "Apply", blurb: "Turn knowledge into governance — map, assess, generate.", ring: "border-blue-300", chip: "bg-blue-100 text-blue-800", modules: [
    { name: "Framework Crosswalks", href: "/crosswalks" },
    { name: "Readiness Assessment (free)", href: "/assess" },
    { name: "Policy Generator", href: "/policy-generator" },
  ] },
  { n: 4, title: "Attest", blurb: "Finish a course and get a signed training record. It attests training, not conformity — we certify nothing.", ring: "border-violet-300", chip: "bg-violet-100 text-violet-800", modules: [
    { name: "Training records — how they work", href: "/courses" },
    { name: "Full course catalog", href: "/courses" },
  ] },
];

export default function SovereignAcademy() {
  useEffect(() => { document.title = "Council Academy — CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.25), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 text-xl">{"\u25C9"}</div>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Learn by living it</p>
          </div>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Council Academy</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">No manuals. Your Council assistant walks you through governance as a journey — from the Layer 0 floor to the frameworks and law that apply to you, into the tools, then into a signed training record. We attest training — never conformity. Every step flows into the real OS.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/tour" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">Take the guided tour {"\u2192"}</a>
            <a href="/assess" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Free readiness check {"\u2192"}</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="space-y-6">
          {PATHS.map((p, idx) => (
            <div key={p.n} className="relative">
              {idx < PATHS.length - 1 && <div className="absolute left-[27px] top-14 h-[calc(100%-1rem)] w-px bg-gray-200" />}
              <div className="flex gap-5">
                <div className={"relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white text-lg font-black text-gray-700 " + p.ring}>{p.n}</div>
                <div className="flex-1 rounded-2xl border border-gray-200 p-5">
                  <h2 className="text-xl font-bold text-gray-900">{p.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{p.blurb}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {p.modules.map((m) => (
                      <a key={m.name} href={m.href} className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition">
                        <span className="text-sm font-medium text-gray-800">{m.name}</span>
                        <span className={"ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold " + p.chip}>Begin {"\u2192"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          You never have to read a manual. Open the <b>Council assistant</b> on any page and say <i>"teach me about the EU AI Act"</i> or <i>"start my training record"</i> — it takes you straight there. Learning and doing are the same motion now.
        </div>
      </section>
    </div>
  );
}
