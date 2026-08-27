import { useEffect } from "react";
import HeroSlides from "../components/HeroSlides";

// One safe space for all AI governance — shine a light on the open-source frameworks,
// standards bodies and responsible-AI work CSOAI crosswalks into one signed floor.
// Every partner card links to its real clause-by-clause crosswalk (/frameworks/:slug) or hive.

type Item = { name: string; note: string; href: string; tag: string };
const GROUPS: { title: string; blurb: string; accent: string; items: Item[] }[] = [
  {
    title: "Law & binding regulation", accent: "#ef4444",
    blurb: "The frameworks that carry force. We crosswalk them so you comply once, everywhere.",
    items: [
      { name: "EU AI Act", note: "Risk-tiered, GPAI, transparency", href: "/hive/eu-ai-act", tag: "Binding" },
      { name: "GDPR", note: "Automated decisions · DPIA", href: "/hive/gdpr", tag: "Binding" },
      { name: "Council of Europe AI Treaty", note: "First binding AI treaty", href: "/hive/council-of-europe-ai-convention", tag: "Treaty" },
      { name: "Korea AI Basic Act", note: "Asia's first comprehensive AI law", href: "/hive/korea-ai-basic-act", tag: "Binding" },
      { name: "HIPAA", note: "Health data in AI pipelines", href: "/hive/hipaa", tag: "Binding" },
    ],
  },
  {
    title: "Cybersecurity & critical infrastructure", accent: "#f43f5e",
    blurb: "Security is governance. The cyber regimes, in the same OS.",
    items: [
      { name: "EU Cyber Resilience Act", note: "Secure-by-design · SBOM · 24h reporting", href: "/hive/cra", tag: "Cyber" },
      { name: "NIS2 Directive", note: "Essential entities · board accountability", href: "/hive/nis2", tag: "Cyber" },
      { name: "DORA", note: "Financial ICT resilience · testing", href: "/hive/dora", tag: "Cyber" },
    ],
  },
  {
    title: "Standards & measurement bodies", accent: "#0ea5e9",
    blurb: "The auditable standards enterprises certify against.",
    items: [
      { name: "ISO/IEC 42001", note: "Certifiable AI management system", href: "/hive/iso-42001", tag: "Standard" },
      { name: "ISO/IEC 42005", note: "AI impact assessment", href: "/hive/iso-42005", tag: "Standard" },
      { name: "NIST AI RMF", note: "Govern · Map · Measure · Manage", href: "/hive/nist-ai-rmf", tag: "US" },
      { name: "IEEE Ethically Aligned Design", note: "Engineering ethics standard", href: "/frameworks/ieee-ethically-aligned-design", tag: "Standard" },
      { name: "OECD AI Principles", note: "The allied-policy baseline", href: "/hive/oecd-ai-principles", tag: "Soft law" },
      { name: "UNESCO AI Ethics", note: "194 member states", href: "/hive/unesco-ai-ethics", tag: "Soft law" },
    ],
  },
  {
    title: "AI labs — responsible-AI, crosswalked", accent: "#a855f7",
    blurb: "We don't compete with the labs' safety work — we map it into the signed floor and credit it. Open, CC BY 4.0.",
    items: [
      { name: "Anthropic — Constitutional AI", note: "Charter maps clause-by-clause", href: "/frameworks/anthropic-constitutional-ai", tag: "Crosswalk" },
      { name: "OpenAI — Model Spec", note: "Behaviour spec crosswalk", href: "/frameworks/openai-model-spec", tag: "Crosswalk" },
      { name: "Asilomar AI Principles", note: "3,800+ researchers", href: "/frameworks/asilomar-ai-principles", tag: "Crosswalk" },
      { name: "Montreal Declaration", note: "Responsible AI", href: "/frameworks/montreal-declaration", tag: "Crosswalk" },
      { name: "Toronto Declaration", note: "Rights & non-discrimination", href: "/frameworks/toronto-declaration", tag: "Crosswalk" },
      { name: "Beijing AI Principles", note: "Harmony & human-centred", href: "/frameworks/beijing-ai-principles", tag: "Crosswalk" },
    ],
  },
  {
    title: "Open-source & the commons", accent: "#34d399",
    blurb: "The CSOAI Charter is open (CC BY 4.0); the core is MIT. Governed MCP tools you can pip-install today.",
    items: [
      { name: "Tool Commons — published MCP tools", note: "Count is live from the gateway, not a slogan", href: "/tools", tag: "Open" },
      { name: "MCP Fleet — 216 servers, 10 hives", note: "Layer 0 wrapped", href: "/mcp-fleet", tag: "Open" },
      { name: "Framework crosswalks — CC BY 4.0", note: "22+ frameworks, cite freely", href: "/crosswalks", tag: "CC BY" },
      { name: "Open Commons media", note: "Creative-Commons search", href: "/commons", tag: "Open" },
    ],
  },
];

export default function Ecosystem() {
  useEffect(() => { document.title = "The safe space for all AI governance — partners & open source | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · the ecosystem</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">One safe space for <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">all AI governance.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">Every framework, every standard, every lab's safety work, and the open-source commons — collected on one signed Layer 0 floor. Not to own them: to crosswalk them, credit them, and let you test, simulate and prove compliance in one place.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a href="/hive" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Open the framework hive →</a>
            <a href="/gspc-arena" className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-white/5">▶ Run a simulation</a>
            <a href="/system-card" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/20">Get a signed proof</a>
          </div>
        </div>
      </section>

      <HeroSlides />
      <section className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: g.accent, boxShadow: "0 0 12px " + g.accent }} />
              <h2 className="text-xl font-black text-emerald-50">{g.title}</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-emerald-100/70">{g.blurb}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <a key={it.name} href={it.href} className="group flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 transition hover:scale-[1.01] hover:border-emerald-400/50">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: g.accent + "22", color: g.accent }}>{it.tag}</span>
                    <span className="opacity-0 transition group-hover:opacity-100 text-emerald-300">→</span>
                  </div>
                  <div className="mt-2 font-bold text-emerald-50">{it.name}</div>
                  <div className="text-[12px] text-emerald-100/70">{it.note}</div>
                </a>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5 text-center">
          <div className="text-sm font-bold text-emerald-100">Building an AI governance tool, plugin or framework?</div>
          <p className="mt-1 text-[13px] text-emerald-100/70">Bring it into the safe space — crosswalked to Layer 0, testable, and credited. Governance should be a commons, not a moat.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a href="/distribution" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Distribute on Layer 0</a>
            <a href="/connect" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Connect a tool</a>
          </div>
        </div>
      </section>
    </div>
  );
}
