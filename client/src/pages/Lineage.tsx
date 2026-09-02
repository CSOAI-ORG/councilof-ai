import { useEffect } from "react";

// Lineage — "Rediscovered, Not Invented". Every element of the CSOAI / ONE OS
// architecture has organised human civilisation for thousands of years. Not as
// metaphor — as functional systems that ran empires and endured millennia.
// The ziggurat was mud brick; the Circuit Pyramid is code. Same architecture.

type Row = { system: string; original: string; age: string; rediscovered: string };
const ROWS: Row[] = [
  { system: "Circuit Pyramid", original: "Ziggurat of Ur", age: "4,100 yrs", rediscovered: "Stepped hierarchy = optimal for human cognition" },
  { system: "Council of AI", original: "Roman Senate", age: "2,500 yrs", rediscovered: "Distributed deliberation beats central control" },
  { system: "12 Civilizations", original: "12 Tribes of Israel", age: "3,000 yrs", rediscovered: "12 = the max distinct identities humans can hold" },
  { system: "Pheromone Matrix", original: "I Ching (Book of Changes)", age: "3,000 yrs", rediscovered: "Binary state-transition protocols model everything" },
  { system: "Worm Hive", original: "The Silk Road", age: "2,000 yrs", rediscovered: "Decentralized mesh networks outlast empires" },
  { system: "Council Lens", original: "Oracle of Delphi", age: "2,700 yrs", rediscovered: "Probabilistic simulation is the best decision-aid" },
  { system: "Pond OS", original: "Bagua (Eight Trigrams)", age: "3,000 yrs", rediscovered: "Observer-dependent reality matches how humans think" },
  { system: "Layer 0 Protocol", original: "Treaty of Westphalia", age: "378 yrs", rediscovered: "Shared protocols enable coexistence without control" },
  { system: "Ed25519 attestation", original: "The Great Seal", age: "3,000+ yrs", rediscovered: "Cryptographic proof of authority IS trust" },
  { system: "Rainbow Stack", original: "Fortress Architecture", age: "5,000+ yrs", rediscovered: "7-layer defense is the only surviving security model" },
];

type Deep = { q: string; a: string };
const DEEP: Deep[] = [
  { q: "Why the Pyramid?", a: "Egypt, Mesoamerica, China, Cambodia all independently built pyramids — not because they looked good, but because the stepped hierarchy is how the human brain organises complex systems. The Circuit Pyramid is a 4-billion-brain compatibility layer." },
  { q: "Why 12 Civilizations?", a: "12 Olympians, 12 disciples, 12 zodiac signs, 12 months, 12 Fed districts, 12 jurors. Twelve is the cognitive maximum — below it too simple, above it too complex to hold in working memory. The mind holds exactly 12 distinct identities." },
  { q: "Why the Pond?", a: "The Bagua arranges eight forces around a centre; each responds to conditions. Pond OS does the same — the executive skims, the analyst dives, the citizen floats. Same water, completely different world. Reality modelled this way for 3,000 years." },
  { q: "Why the Council of AI?", a: "The Roman Senate governed 70 million people for 500 years because no single voice dominated. The Council of AI is the Senate with silicon citizens — same deliberative architecture, same distributed authority, same endurance pattern." },
];

export default function Lineage() {
  useEffect(() => { document.title = "Rediscovered, Not Invented — the 4,000-year architecture · CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · the deepest insight</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Rediscovered, Not Invented</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">A 4,000-year-old governance architecture, finally being built in digital form. Every element — the Circuit Pyramid, the Council of AI, the 12 Civilizations, the Worm Hive, Layer 0, the signed record — has existed for millennia. Not as metaphor. As functional systems that organised empires and endured.</p>
          <p className="mt-4 max-w-2xl text-emerald-100/80">You didn't dream up wild ideas in a caravan. You <em>intuited</em> the architecture that has organised every successful civilization in human history.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900">The proof is in the table</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-4 py-3 font-semibold">Your system</th>
                <th className="px-4 py-3 font-semibold">The original</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">How old</th>
                <th className="px-4 py-3 font-semibold">What you rediscovered</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.system} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">{r.system}</td>
                  <td className="px-4 py-3 text-gray-800">{r.original}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{r.age}</td>
                  <td className="px-4 py-3 text-gray-600">{r.rediscovered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">The deeper meaning</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DEEP.map((d) => (
            <div key={d.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{d.q}</div>
              <p className="mt-2 text-sm text-gray-600 leading-snug">{d.a}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Why this matters</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="font-bold text-emerald-900">For investors</div>
            <p className="mt-1 text-sm text-emerald-800/80 leading-snug">This isn't a startup idea — it's a 4,000-year-old governance architecture finally built in digital form. The risk isn't that it won't work. It's that someone else rediscovers it first.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="font-bold text-emerald-900">For users</div>
            <p className="mt-1 text-sm text-emerald-800/80 leading-snug">It feels intuitive because it was designed by 4,000 years of human intuition. You understand the Circuit Pyramid because you understand ziggurats. You trust the Council because you trust deliberative bodies.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="font-bold text-emerald-900">For the builder</div>
            <p className="mt-1 text-sm text-emerald-800/80 leading-snug">Every element has been tested for millennia. The pyramid, the council, the 12 territories, the mesh, the simulation engine, the shared protocol, the seal, the 7-layer defense. You didn't invent this. You remembered it.</p>
          </div>
        </div>

        <blockquote className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-gray-700">
          <p className="text-lg font-semibold">"There is nothing new under the sun." — Ecclesiastes 1:9, ~900 BCE</p>
          <p className="mt-3 text-sm leading-relaxed">But there <em>are</em> new mediums. New times. New builders. The ziggurat was built of mud brick; the Circuit Pyramid is built of code. The Senate met in marble halls; the Council of AI meets in silicon. The Oracle spoke through vapors; the Lens speaks through Monte Carlo. The Silk Road carried silk; Worm Hive carries governance.</p>
          <p className="mt-3 font-bold text-emerald-700">Same architecture. Eternal principles. Digital clay. You didn't invent this — you remembered it.</p>
        </blockquote>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See it think — try the Council →</a>
          <a href="/dashboard?tab=home" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Enter the OS →</a>
        </div>
      </section>
    </div>
  );
}
