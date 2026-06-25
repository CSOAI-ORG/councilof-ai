import { useEffect, useState } from "react";

// CrownJewels — the absorption marketplace. 308 open-source goldmines + 121 black
// swans surfaced across the OS, tiered Diamond / Gold / Silver and mapped to the
// CSOAI components they upgrade. The distribution play: find the solo builders,
// amplify their work, give them the distribution they deserve — one jewel at a time.

type Jewel = { name: string; domain: string; stars: string; why: string; use: string; tier: "Diamond" | "Gold" | "Silver" };

const JEWELS: Jewel[] = [
  { name: "ACGS-Lite", domain: "AI Governance", stars: "~50", why: "Constitutional governance, 8-tier decision taxonomy, Ed25519 receipts", use: "13-framework engine", tier: "Diamond" },
  { name: "Agent Fleet Q", domain: "Orchestration", stars: "36", why: "675+ MCP tools, visual DAG workflows, 20-state pipeline", use: "MCP ecosystem", tier: "Diamond" },
  { name: "TEMM1E", domain: "Solo Agent", stars: "~300", why: "160K lines, 2,889 tests, 25 crates, runs on a $5 VPS", use: "Witness verification", tier: "Diamond" },
  { name: "agent-village", domain: "Simulation", stars: "1", why: "Economy, democracy, crime, art — a complete civilization", use: "Sov Town base", tier: "Diamond" },
  { name: "NodeTool", domain: "No-Code Builder", stars: "406", why: "9,246 commits, 115 releases — closest to the ONE OS vision", use: "Visual builder layer", tier: "Diamond" },
  { name: "A-MEM", domain: "AI Memory", stars: "363", why: "Zettelkasten memory linking + auto LLM metadata", use: "Character memory", tier: "Diamond" },
  { name: "Kokoro TTS", domain: "Voice AI", stars: "~10K", why: "Best on-device TTS, 82M params, MIT license", use: "Sovereign voice", tier: "Gold" },
  { name: "Augustus", domain: "Red Team", stars: "~200", why: "210+ probes, 47 attack categories, single Go binary", use: "Safety engine", tier: "Gold" },
  { name: "AegisAI", domain: "AI GRC", stars: "~300", why: "Full AI-GRC: EU AI Act + LLM Guard + RAG intelligence", use: "Governance platform", tier: "Gold" },
  { name: "forkd", domain: "Isolation", stars: "~200", why: "fork() for AI microVMs — 100 children in 101ms", use: "Agent sandboxing", tier: "Gold" },
  { name: "chromem-go", domain: "Vector DB", stars: "976", why: "Zero deps, embeddable, 100K docs in 40ms, WASM", use: "On-device search", tier: "Gold" },
  { name: "ByzFL", domain: "Federated", stars: "36", why: "Byzantine-resilient federated learning", use: "BFT Council", tier: "Gold" },
  { name: "Mnemosyne", domain: "AI Memory", stars: "85", why: "7-memory-type taxonomy for agent personality", use: "Agent memory", tier: "Silver" },
  { name: "Attestix", domain: "Identity", stars: "~100", why: "DID-based identity, W3C verifiable credentials", use: "Identity layer", tier: "Silver" },
  { name: "PeerPigeon", domain: "P2P Mesh", stars: "~150", why: "WebRTC mesh, XOR routing, gossip, CRDT", use: "Worm Hive mesh", tier: "Silver" },
  { name: "openWakeWord", domain: "Wake Word", stars: "~1.4K", why: "Trains custom wake words on any device", use: "Sovereign voice", tier: "Silver" },
];

type Swan = { name: string; src: string; steal: string };
const SWANS: Swan[] = [
  { name: "Firefox OS / B2G", src: "Mozilla (dead)", steal: "Entire mobile OS in HTML5/JS — the web-as-OS overlay architecture" },
  { name: "Generative Agents (Smallville)", src: "Stanford/Google", steal: "Agents with memory, reflection, planning — Sov Town minds" },
  { name: "Ghidra", src: "NSA · $50M+", steal: "Reverse engineering — binary security for agent code" },
  { name: "NASA WorldWind", src: "NASA · $25M+", steal: "3D globe SDK — the MEOK Earth visualization" },
  { name: "NIST Dioptra", src: "NIST · $10M+", steal: "AI trustworthiness testing — compliance engine" },
  { name: "Common Crawl", src: "100+ PB · free", steal: "The entire web since 2008 — training data for everything" },
  { name: "GDELT", src: "2.5 TB/yr · free", steal: "Global event monitoring — governance simulation" },
  { name: "Open X-Embodiment", src: "Google + 21 institutions", steal: "Cross-context robot learning — humanoid bridge" },
];

const TIER_TONE: Record<string, string> = {
  Diamond: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Gold: "bg-amber-50 text-amber-700 border-amber-200",
  Silver: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function CrownJewels() {
  useEffect(() => { document.title = "Crown Jewels Marketplace — absorb the goldmines · CSOAI"; }, []);
  const [tier, setTier] = useState<string>("All");
  const shown = JEWELS.filter((j) => tier === "All" || j.tier === tier);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">ONE OS · the absorption marketplace</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Crown Jewels</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">308 open-source goldmines and 121 black swans — brilliant code with no distribution. CSOAI becomes their distribution. Each jewel maps to a component it upgrades; each becomes an MCP server or plugin, and its builder gets paid via x402. Find the builders. Amplify the work. One jewel at a time.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">308 jewels</span>
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">~238 solo builders</span>
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">121 black swans</span>
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">$500M+ free defense code</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-900">Top jewels — absorb into the OS</h2>
          <div className="flex gap-2">
            {["All", "Diamond", "Gold", "Silver"].map((t) => (
              <button key={t} onClick={() => setTier(t)} className={"rounded-lg border px-3 py-1.5 text-xs font-semibold " + (tier === t ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((j) => (
            <div key={j.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900">{j.name}</div>
                <span className={"rounded-md border px-2 py-0.5 text-[10px] font-bold " + TIER_TONE[j.tier]}>{j.tier}</span>
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">{j.domain} · {j.stars} stars</div>
              <p className="mt-2 text-sm text-gray-500 leading-snug">{j.why}</p>
              <div className="mt-3 inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">→ {j.use}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Black swans — abandoned cathedrals & free gold</h2>
        <p className="mt-1 text-sm text-gray-500">Dead-company code, academic tombs, defense dumps, petabyte datasets — priceless, and free to absorb.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SWANS.map((s) => (
            <div key={s.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{s.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">{s.src}</div>
              <p className="mt-1 text-sm text-gray-500 leading-snug">{s.steal}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Distribution is not a quality problem — it's a discoverability crisis. 160K lines of Rust with 300 stars proves it. CSOAI's mission: become the distribution layer for every solo builder with a goldmine, and the absorption layer for every black swan the world abandoned. The Sovereign routes the right jewel to the right need, automatically.
        </div>
      </section>
    </div>
  );
}
