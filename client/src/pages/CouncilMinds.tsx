import { useEffect } from "react";

// CouncilMinds — the cognition + voice layer. Every Sov Town, humanoid and node
// is inhabited by a Sovereign mind: it perceives, remembers, reflects, plans and acts
// — governed end to end. Memory that compounds, a voice that speaks, a character that
// walks you through the world. Absorbed from Smallville, agent-village, A-MEM,
// Mnemosyne, Kokoro TTS and openWakeWord, wired under Layer 0.

type Step = { glyph: string; name: string; body: string };
const COG: Step[] = [
  { glyph: "◉", name: "Perceive", body: "Reads the world — your screen, the OS, the live reg-delta feed, the town it lives in." },
  { glyph: "✦", name: "Remember", body: "Writes to a compounding memory: episodic, semantic, procedural, relational, preference." },
  { glyph: "❂", name: "Reflect", body: "Periodically distils raw memory into higher-order insights — the Smallville reflection loop." },
  { glyph: "◈", name: "Plan", body: "Turns goals + memory into a governed plan, checked against Layer 0 policy before acting." },
  { glyph: "➤", name: "Act", body: "Executes through frameworks — MEOK bridge, social, legacy — with attestation on every step." },
];

type Mem = { type: string; body: string };
const MEM: Mem[] = [
  { type: "Episodic", body: "What happened, when — the timeline of the mind's experience." },
  { type: "Semantic", body: "Facts and concepts distilled from experience into knowledge." },
  { type: "Procedural", body: "Skills and how-to — the lifelong skill library (Voyager-style)." },
  { type: "Relational", body: "Who is who, and the state of every relationship and account." },
  { type: "Preference", body: "What the user likes, their voice, their tone, their boundaries." },
  { type: "Core", body: "The identity, charter and Maternal Covenant the mind never violates." },
];

type Cap = { name: string; src: string; body: string };
const VOICE: Cap[] = [
  { name: "Speaks", src: "Kokoro TTS", body: "On-device, natural voice — the Council assistant talks back, no cloud round-trip required." },
  { name: "Listens", src: "openWakeWord", body: "Custom wake word on any device — 'Council…' and it's listening." },
  { name: "Converses", src: "Council Dock", body: "The right-hand dock already turns speech and chat into governed actions, live now." },
];

export default function CouncilMinds() {
  useEffect(() => { document.title = "Council Minds — the cognition & voice layer · CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">ONE OS · the cognition &amp; voice layer</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Council Minds</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">Every Council Town, humanoid and node is inhabited by a mind. It perceives, remembers, reflects, plans and acts — governed end to end. Memory that compounds, a voice that speaks, a character that walks you through the world and does the work so you don't have to.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/towns" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">See the Towns they inhabit →</a>
            <a href="/tour" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Take the guided tour →</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900">The cognition loop</h2>
        <p className="mt-1 text-sm text-gray-500">Perceive → Remember → Reflect → Plan → Act. Always aware, always ensembling, never stuck.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COG.map((c, i) => (
            <div key={c.name} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700">{c.glyph}</div>
              <div className="mt-3 font-bold text-emerald-900">{i + 1}. {c.name}</div>
              <p className="mt-1 text-xs text-emerald-800/80 leading-snug">{c.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Memory that compounds</h2>
        <p className="mt-1 text-sm text-gray-500">A six-type memory taxonomy — the more the mind lives, the more it knows. Zettelkasten linking ties it all together.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEM.map((m) => (
            <div key={m.type} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{m.type}</div>
              <p className="mt-1 text-sm text-gray-500 leading-snug">{m.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">A voice, not a prompt box</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {VOICE.map((v) => (
            <div key={v.name} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="font-bold text-emerald-900">{v.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-600/70">{v.src}</div>
              <p className="mt-1 text-sm text-emerald-800/80 leading-snug">{v.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">How a mind acts</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">You · "Council, handle this"</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">Mind · perceive · recall · reflect · plan · Layer 0 gate</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">Acts via bridges · attested · done for you</span>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/hives" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the Hive Grid →</a>
          <a href="/jewels" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The minds we absorbed →</a>
          <a href="/register" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Give a node a mind →</a>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          We take the end user from doing the work to the Council assistant doing it for them — that clean, that seamless. The mind is modelled and the voice is live in the Council assistant Dock today; full memory, reflection and on-device voice (Kokoro + openWakeWord) switch on with the Layer 0 gateway. One mind per town, per humanoid, per node — governed, attested, always yours.
        </div>
      </section>
    </div>
  );
}
