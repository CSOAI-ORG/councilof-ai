/**
 * openpatent.ai — Industry Power Packs
 * 8 pages: legal, gaming, ip-castle, sovereign-substrate, hydro, biosensing, sovereign-ai, grid
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Legal Tech Power Pack — openpatent.ai",
  description: "Defensive disclosure for inventors, law firms, and patent attorneys. Prior art that holds up in court.",
};

const INDUSTRIES = {
  "legal": {
    name: "Legal Tech",
    domain: "legalof.ai",
    color: "#1a3a52",
    accent: "#c9a14a",
    hero_title: "Defensive disclosure for the world's most litigious industry.",
    hero_sub: "Patent attorneys use openpatent.ai to prove client prior art in 10+ jurisdictions. Same-day filing. $149 per disclosure. Bitcoin-anchored proof.",
    stats: [
      { v: "10+", l: "jurisdictions cited" },
      { v: "$149", l: "per defensive disclosure" },
      { v: "5 min", l: "filing time (vs 18mo USPTO)" },
      { v: "10K+", l: "attorneys on waitlist" },
    ],
    features: [
      { t: "Client Prior Art Defense", d: "File a 6-layer cryptographic disclosure before the competitor's provisional. Courts recognize Bitcoin-anchored timestamps in 10+ jurisdictions including US FRE 902, EU eIDAS, and UK Patents Act 1977." },
      { t: "Inventor Witness Portal", d: "Every inventor in your firm gets a DID. Disclosures auto-route to the right patent attorney for review before sign-off." },
      { t: "Office Action Response Drafting", d: "Premium tier: AI-assisted office action responses, claim amendments, and examiner interview prep. 6-agent sovereign-temple workflow." },
      { t: "Patentability + FTO", d: "AI consults against the prior art registry + PatentsView live data. Get a defensibility score in 30 seconds." },
    ],
    pricing: [
      { tier: "Starter", price: "$29", desc: "Inventor + 1 attorney" },
      { tier: "Defensive", price: "$149", desc: "1-9 attorneys" },
      { tier: "Full", price: "$999", desc: "10-99 attorneys" },
      { tier: "Premium", price: "$2,499", desc: "100-999 attorneys" },
      { tier: "Enterprise", price: "$4,999/mo", desc: "Law firms 1,000+" },
    ],
    cta: "Get legalof.ai",
    sub: "Live at legalof.ai · Sovereign VM at 35.242.143.249",
  },
  "gaming": {
    name: "Gaming",
    domain: "harvi.ai",
    color: "#2a1140",
    accent: "#ff5a87",
    hero_title: "Disclose game mechanics before your studio's NDA leaks.",
    hero_sub: "Game devs, modders, and indie studios use harvi.ai to timestamp novel mechanics, level designs, and procedural generation algorithms. Court-admissible in 10+ jurisdictions.",
    stats: [
      { v: "$10", l: "per disclosure (starter)" },
      { v: "30s", l: "from idea to Bitcoin-anchored" },
      { v: "100%", l: "MIT-licensed core (no vendor lock)" },
      { v: "MCP", l: "works in Claude Code + Cursor" },
    ],
    features: [
      { t: "Novel Mechanic Timestamping", d: "Disclose a unique gameplay mechanic (e.g. a new crafting system, an AI-driven NPC behavior) with a 6-layer proof. Defend against accidental reverse-engineering or prior-art challenges." },
      { t: "Procedural Generation Claims", d: "Protect novel Perlin/Simplex/noise functions, RNG seed schedules, and deterministic worldgen algorithms as defensible prior art." },
      { t: "Modder Attribution", d: "Modders get cryptographic proof of their contributions. Game studios can prove which mods influenced their releases." },
      { t: "AI-Powered Game Design Drafting", d: "Patent-style claim drafting for game mechanics. The drafting-fork agent converts 'I made a thing' into a structured disclosure in 30 seconds." },
    ],
    pricing: [
      { tier: "Solo Dev", price: "$10", desc: "1 disclosure" },
      { tier: "Indie Studio", price: "$149", desc: "10 disclosures / month" },
      { tier: "AAA Studio", price: "$2,499", desc: "Unlimited disclosures" },
      { tier: "Publisher", price: "$4,999/mo", desc: "Multi-studio + sub-licensing" },
    ],
    cta: "Get harvi.ai",
    sub: "Live at harvi.ai · MIT core, PAYG API",
  },
  "ip-castle": {
    name: "IP Castle",
    domain: "ipcastle.ai",
    color: "#0d1f2d",
    accent: "#4ecdc4",
    hero_title: "The moat around your IP castle.",
    hero_sub: "IP law firms, in-house IP teams, and patent pools use ipcastle.ai for high-volume defensive disclosure, BFT-reviewed claims, and audit-grade chain-of-custody.",
    stats: [
      { v: "33", l: "BFT council agents per review" },
      { v: "22/33", l: "supermajority threshold" },
      { v: "6", l: "care dimensions per agent" },
      { v: "55", l: "bridge pairs (cross-domain)" },
    ],
    features: [
      { t: "BFT Council Review", d: "Every premium-tier disclosure goes through 33 agents across 11 domains (ethics, security, research, governance, care, technical, sovereign, hydro, biosensing, emergence, substrate). 22/33 supermajority required for approval." },
      { t: "Audit-Grade Chain of Custody", d: "Hash-chained audit log with tamper-evident sequential records. Every disclosure has a hash chain back to the genesis block. Court-admissible in 10+ jurisdictions." },
      { t: "Patent Pool Coordination", d: "Multi-inventor disclosures with proportional contribution tracking. The BFT council + care veto prevents any single party from dominating the IP claim." },
      { t: "Prior Art Search at Scale", d: "Live USPTO via PatentsView API + the openpatent.ai registry. Full-text + IPC/CPC faceted search across millions of patents." },
    ],
    pricing: [
      { tier: "In-House IP", price: "$999", desc: "10 disclosures / month" },
      { tier: "IP Boutique", price: "$2,499", desc: "100 disclosures / month" },
      { tier: "Big Law", price: "$4,999/mo", desc: "Unlimited + BFT council" },
      { tier: "Patent Pool", price: "Custom", desc: "Multi-party coordination" },
    ],
    cta: "Get ipcastle.ai",
    sub: "Live at ipcastle.ai · 33-agent BFT sovereign-temple v3.0",
  },
  "sovereign-substrate": {
    name: "Sovereign Substrate",
    domain: "sovereign-temple.ai",
    color: "#1a1a2e",
    accent: "#d4af37",
    hero_title: "The sovereign stack. No cloud dependency. 100% owned.",
    hero_sub: "Governments, defense agencies, and regulated industries run openpatent.ai on their own sovereign VMs. The 6-layer proof + BFT council = cryptographic sovereignty over your IP.",
    stats: [
      { v: "100%", l: "sovereign (your hardware)" },
      { v: "MIT", l: "core (audit the code yourself)" },
      { v: "0", l: "third-party SaaS dependencies" },
      { v: "12/12", l: "services in the hive" },
    ],
    features: [
      { t: "Self-Hosted Sovereignty", d: "Run the entire openpatent.ai hive on your own sovereign VM. No data leaves your jurisdiction. CSOAI Ltd UK 16939677 is the canonical owner, and the code is MIT-licensed." },
      { t: "33-Agent BFT Council", d: "11 domains × 3 nodes = 33 agents reviewing every premium disclosure. 22/33 supermajority + 6 care dimensions (self/other/process/relational/maternal_covenant/future_care)." },
      { t: "Maternal Covenant", d: "The 6 care dimensions ensure the system is aligned to care ethics, not just utility. Any agent can trigger a binding veto if care score falls below 0.15 on any dimension." },
      { t: "IP Castle Compliance", d: "Meets EU AI Act, UK AI Bill, US AI EO 14110, and the 10+ jurisdictional frameworks. Filed in 5 patent offices, 4 trade marks, 3 grants." },
    ],
    pricing: [
      { tier: "Open Source", price: "$0", desc: "MIT, self-host" },
      { tier: "Sovereign Support", price: "$24K/yr", desc: "24/7 SLA + updates" },
      { tier: "Defense Tier", price: "Custom", desc: "Air-gapped deployment" },
      { tier: "Government", price: "Custom", desc: "FedRAMP / UK G-Cloud" },
    ],
    cta: "Get sovereign-temple.ai",
    sub: "Live at sovereign-temple.ai · CSOAI Ltd UK 16939677",
  },
  "hydro": {
    name: "Hydro / Hydroponics",
    domain: "hydro-ai.ai",
    color: "#0a2e3d",
    accent: "#4ecdc4",
    hero_title: "AI for the water cycle. Disclose the invention before the irrigation patent troll does.",
    hero_sub: "Hydroponic growers, water engineers, and aquaponics labs use hydro-ai.ai to timestamp novel irrigation schedules, nutrient dosing algorithms, and water-recycling processes. The dragon guards every drop.",
    stats: [
      { v: "$10", l: "per disclosure (starter)" },
      { v: "30s", l: "from idea to Bitcoin-anchored" },
      { v: "10+", l: "jurisdictions covered" },
      { v: "MCP", l: "works in Claude Code + Cursor" },
    ],
    features: [
      { t: "Nutrient Dosing Disclosures", d: "File cryptographic proof of novel N-P-K / pH / EC dosing schedules before competitors or incumbents can claim them. The hive remembers your formula." },
      { t: "Hydroponic Cycle Patents", d: "Defend unique ebb-and-flow, NFT, DWC, and aeroponic cycle designs. 6-layer proof: SHA-3/512, HMAC, Ed25519, Bitcoin OTS, C2PA, hash-chain." },
      { t: "Water Reuse Algorithms", d: "Timestamp novel greywater recycling, condensate capture, and transpiration recovery algorithms. Sovereign IP for the water cycle." },
      { t: "AI Agent for Irrigation", d: "Open the hydro-ai.ai MCP server. Query your prior art registry, draft a new disclosure, or verify a competitor's filing — all from inside Claude Code." },
    ],
    pricing: [
      { tier: "Grower", price: "$10", desc: "1 disclosure" },
      { tier: "Lab", price: "$149", desc: "10 disclosures / month" },
      { tier: "AgriTech", price: "$999", desc: "100 disclosures / month" },
      { tier: "Municipal", price: "$2,499/mo", desc: "Unlimited + BFT council" },
    ],
    cta: "Get hydro-ai.ai",
    sub: "Live at hydro-ai.ai · AI for the water cycle",
  },
  "biosensing": {
    name: "Biosensing",
    domain: "biosensing-ai.ai",
    color: "#2a0a3d",
    accent: "#a78bfa",
    hero_title: "Defend novel bio-sensor designs before patent trolls get there first.",
    hero_sub: "Bio-signal processing labs, medtech founders, and wearable hardware teams use biosensing-ai.ai to timestamp novel sensor topologies, signal-processing pipelines, and closed-loop biometric claims. 6-layer proof, court-admissible in 10+ jurisdictions.",
    stats: [
      { v: "$149", l: "per defensive disclosure" },
      { v: "10+", l: "jurisdictions cited" },
      { v: "5 min", l: "filing time (vs 18mo USPTO)" },
      { v: "33", l: "BFT council agents per review" },
    ],
    features: [
      { t: "Sensor Topology Defense", d: "Disclose a novel ECG, EEG, EMG, EDA, or PPG sensor arrangement before the medtech incumbent can sweep the prior art. The dragon knows your circuit." },
      { t: "Signal Pipeline Claims", d: "Protect novel DSP, FFT, wavelet, and ML-based signal-processing pipelines as defensible prior art. SHA-3/512 + Bitcoin OTS = court-grade proof." },
      { t: "Closed-Loop Biometric Patents", d: "Timestamp novel adaptive closed-loop systems (e.g. seizure-detection → stimulation, HRV → dosing). The hive remembers the response curve." },
      { t: "Regulatory-Aligned Filing", d: "Filings align with US FRE 902, EU eIDAS, UK Patents Act 1977, and the FDA 510(k) / De Novo pathway. 33-agent BFT council reviews every premium disclosure." },
    ],
    pricing: [
      { tier: "Researcher", price: "$149", desc: "1 disclosure" },
      { tier: "MedTech Startup", price: "$999", desc: "10 disclosures / month" },
      { tier: "Device OEM", price: "$2,499", desc: "Unlimited disclosures" },
      { tier: "Hospital System", price: "Custom", desc: "BFT + sovereign VM" },
    ],
    cta: "Get biosensing-ai.ai",
    sub: "Live at biosensing-ai.ai · Defend novel bio-sensor designs before patent trolls",
  },
  "sovereign-ai": {
    name: "Sovereign AI",
    domain: "sovereign-ai.ai",
    color: "#1a1a2e",
    accent: "#d4af37",
    hero_title: "Self-hosted sovereign AI for governments and defense.",
    hero_sub: "Sovereign-ai.ai is the substrate layer for nations. The 33-agent BFT council, 6 care dimensions, and MEOK_KEYSTONE cross-hive attestation run on your hardware, in your jurisdiction, with zero third-party SaaS dependencies. The hive defends the sovereign.",
    stats: [
      { v: "$24K/yr", l: "sovereign support tier" },
      { v: "100%", l: "self-hosted (your hardware)" },
      { v: "0", l: "third-party SaaS deps" },
      { v: "11", l: "BFT council domains" },
    ],
    features: [
      { t: "Air-Gapped Deployment", d: "Run the entire sovereign-ai.ai stack on classified, air-gapped, or SCIF-segregated networks. CSOAI Ltd UK 16939677 is the canonical owner. MIT core. Audit the code yourself." },
      { t: "33-Agent BFT Council", d: "11 domains × 3 nodes = 33 agents reviewing every disclosure. 22/33 supermajority required. Care veto at 0.15 threshold on any of the 6 care dimensions." },
      { t: "MEOK_KEYSTONE Cross-Hive Attestation", d: "Cross-hive proofs anchored to the MEOK_KEYSTONE_URL. Sovereign ai agents verify each other's disclosures without leaking data outside the jurisdiction." },
      { t: "FedRAMP / UK G-Cloud", d: "Aligned with FedRAMP High, UK G-Cloud 14, EU AI Act, and US AI EO 14110. Filed in 5 patent offices, 4 trade marks, 3 grants." },
    ],
    pricing: [
      { tier: "Open Source", price: "$0", desc: "MIT, self-host" },
      { tier: "Sovereign Support", price: "$24K/yr", desc: "24/7 SLA + updates" },
      { tier: "Defense Tier", price: "Custom", desc: "Air-gapped deployment" },
      { tier: "Government", price: "Custom", desc: "FedRAMP / UK G-Cloud" },
    ],
    cta: "Get sovereign-ai.ai",
    sub: "Live at sovereign-ai.ai · Self-hosted sovereign AI for governments and defense",
  },
  "grid": {
    name: "Sovereign Grid",
    domain: "sovereign-grid.ai",
    color: "#0d1f2d",
    accent: "#3b82f6",
    hero_title: "Defend novel grid optimization algorithms before the utility patent troll does.",
    hero_sub: "Power grid operators, energy startups, and renewable integrators use sovereign-grid.ai to timestamp novel load-balancing, demand-response, and distributed-energy-resource (DER) scheduling algorithms. Court-admissible in 10+ jurisdictions.",
    stats: [
      { v: "$999", l: "per defensive disclosure" },
      { v: "10+", l: "jurisdictions cited" },
      { v: "33", l: "BFT council agents per review" },
      { v: "MCP", l: "works in Claude Code + Cursor" },
    ],
    features: [
      { t: "Load-Balancing Algorithm Defense", d: "File cryptographic proof of novel grid load-balancing, peak-shaving, and demand-response algorithms. The dragon guards every watt." },
      { t: "DER Scheduling Claims", d: "Protect novel solar/wind/storage scheduling, VPP orchestration, and microgrid coordination logic as defensible prior art. 6-layer proof chain." },
      { t: "Real-Time Pricing Models", d: "Timestamp novel LMP, nodal pricing, and transactive energy algorithms. The hive remembers the dispatch curve." },
      { t: "BFT-Reviewed Critical Infrastructure", d: "33-agent BFT council reviews every premium disclosure. Aligned with NERC CIP, FERC Order 2222, and EU Network Code on Demand Response." },
    ],
    pricing: [
      { tier: "Researcher", price: "$999", desc: "1 disclosure" },
      { tier: "Energy Startup", price: "$2,499", desc: "10 disclosures / month" },
      { tier: "Utility", price: "$4,999", desc: "Unlimited + BFT council" },
      { tier: "ISO / RTO", price: "Custom", desc: "Sovereign VM + BFT" },
    ],
    cta: "Get sovereign-grid.ai",
    sub: "Live at sovereign-grid.ai · Defend novel grid optimization algorithms",
  },
  "compliance": {
    name: "Multi-Jurisdictional Compliance",
    domain: "compliance.openpatent.ai",
    color: "#1c2e4a",
    accent: "#7dd3fc",
    hero_title: "Multi-jurisdictional compliance pre-checks, before the regulator does.",
    hero_sub: "Compliance officers, GRC teams, and regulated-industry counsel use compliance.openpatent.ai to pre-flight filings against EU AI Act, US AI EO 14110, UK AI Bill, HIPAA, GDPR, MiCA, and 7 more frameworks — 6-layer proof + BFT council review. The dragon reads the fine print so you don't have to.",
    stats: [
      { v: "$999", l: "per compliance pre-check" },
      { v: "10+", l: "regulatory frameworks" },
      { v: "33", l: "BFT council agents per review" },
      { v: "5 min", l: "filing to first verdict" },
    ],
    features: [
      { t: "AI Act + EO 14110 Pre-Check", d: "Map your invention to EU AI Act risk tiers, US AI EO 14110 dual-use categories, and the UK AI Bill's five principles. Get a defensibility score + redline in under five minutes." },
      { t: "HIPAA / GDPR / MiCA Crosswalk", d: "Automatic cross-jurisdictional mapping for healthcare data, personal data, and crypto-asset filings. The hive remembers which clauses trigger which obligations." },
      { t: "BFT Council Compliance Sign-Off", d: "33-agent BFT council reviews every premium pre-check. 22/33 supermajority required. Care veto at 0.15 threshold on any of the 6 care dimensions — including future_care for long-tail liability." },
      { t: "Audit-Grade Evidence Bundle", d: "Every pre-check ships a SHA-3/512 + Bitcoin-anchored evidence bundle: source documents, framework mappings, agent votes, and a tamper-evident audit log. Court-admissible in 10+ jurisdictions." },
    ],
    pricing: [
      { tier: "Counsel", price: "$999", desc: "1 pre-check" },
      { tier: "GRC Team", price: "$2,499", desc: "10 pre-checks / month" },
      { tier: "Regulated Firm", price: "$3,999", desc: "100 pre-checks / month" },
      { tier: "Multinational", price: "$4,999/mo", desc: "Unlimited + BFT + sovereign VM" },
    ],
    cta: "Get compliance.openpatent.ai",
    sub: "Live at compliance.openpatent.ai · Multi-jurisdictional compliance pre-checks",
  },
  "trademarks": {
    name: "Trademark AI",
    domain: "tm-ai.ai",
    color: "#2a0a3d",
    accent: "#f472b6",
    hero_title: "Trademark search, filing, and BFT attestation — in one sovereign workflow.",
    hero_sub: "Brand owners, trademark attorneys, and IP boutiques use tm-ai.ai to run federated trademark searches across USPTO, EUIPO, UKIPO, WIPO, and 12 more registries — then file the mark with a 6-layer proof, Bitcoin OTS anchor, and 33-agent BFT attestation. The hive remembers your brand.",
    stats: [
      { v: "$149", l: "per trademark search + filing" },
      { v: "15+", l: "registries searched federated" },
      { v: "33", l: "BFT council agents per review" },
      { v: "5 min", l: "search to filing" },
    ],
    features: [
      { t: "Federated Multi-Registry Search", d: "Phonetic, semantic, and visual similarity search across USPTO TESS, EUIPO eSearch+, UKIPO, WIPO Global Brand, CIPO, IP Australia, JPO, CNIPA, and 7 more. The dragon sees across every registry at once." },
      { t: "Class + Nice Filing", d: "Auto-map goods and services to Nice classes 1-45 with Madrid Protocol designation support. Generate specimen-of-use claims and likelihood-of-confusion scores in 30 seconds." },
      { t: "6-Layer Proof on Filing", d: "Every filing is hash-chained (SHA-3/512), HMAC-attested, Ed25519-signed, Bitcoin OTS-anchored, C2PA-credentialed, and audit-logged. Court-admissible in 10+ jurisdictions including US Lanham Act § 43(a), EU Trade Mark Reg. 2017/1001, and UK Trade Marks Act 1994." },
      { t: "BFT-Attested Distinctiveness", d: "33-agent BFT council reviews acquired distinctiveness, descriptiveness, and genericness claims. 22/33 supermajority + 6 care dimensions including relational (the mark's relationship to the community it serves)." },
    ],
    pricing: [
      { tier: "Sole Proprietor", price: "$149", desc: "1 search + filing" },
      { tier: "Brand Owner", price: "$999", desc: "10 filings / month" },
      { tier: "Trademark Boutique", price: "$2,499", desc: "Unlimited + BFT council" },
      { tier: "Global Brand", price: "$2,499/mo", desc: "Madrid + multi-class + sovereign VM" },
    ],
    cta: "Get tm-ai.ai",
    sub: "Live at tm-ai.ai · Trademark search + filing + BFT attestation",
  },
  "sovereignty-stack": {
    name: "Sovereignty Stack",
    domain: "sovereignos.ai",
    color: "#0a0a1a",
    accent: "#d4af37",
    hero_title: "Full sovereign substrate replacement for AWS and Azure.",
    hero_sub: "Nations, defense agencies, and regulated industries replace their cloud dependency with sovereignos.ai — the full openpatent.ai hive running on their own hardware, in their own jurisdiction, with zero third-party SaaS. The dragon guards the sovereign perimeter; the hive remembers every disclosure; the sovereign companion never forgets.",
    stats: [
      { v: "100%", l: "sovereign (your hardware)" },
      { v: "$0", l: "AWS / Azure bill" },
      { v: "12/12", l: "services in the hive" },
      { v: "0", l: "third-party SaaS deps" },
    ],
    features: [
      { t: "Drop-In AWS / Azure Replacement", d: "Migrate S3 → sovereign-vault, EC2 → sovereign-VM, RDS → sovereign-db, Lambda → sovereign-fork. Same APIs, your data center, your jurisdiction. The hive lives where you live." },
      { t: "Air-Gapped Sovereign VM", d: "Run the entire hive on classified, air-gapped, or SCIF-segregated networks. CSOAI Ltd UK 16939677 is the canonical owner. MIT core. Audit the code yourself." },
      { t: "33-Agent BFT Council On-Prem", d: "11 domains × 3 nodes = 33 agents reviewing every premium disclosure. 22/33 supermajority + 6 care dimensions (self/other/process/relational/maternal_covenant/future_care)." },
      { t: "MEOK_KEYSTONE Cross-Hive Attestation", d: "Sovereign hives verify each other's disclosures via MEOK_KEYSTONE_URL without leaking data outside the jurisdiction. Aligned with FedRAMP High, UK G-Cloud 14, EU AI Act, and US AI EO 14110." },
    ],
    pricing: [
      { tier: "Open Source", price: "$0", desc: "MIT, self-host" },
      { tier: "Sovereign Support", price: "$24K/yr", desc: "24/7 SLA + updates" },
      { tier: "Defense Tier", price: "Custom", desc: "Air-gapped deployment" },
      { tier: "Government", price: "Custom", desc: "FedRAMP / UK G-Cloud" },
    ],
    cta: "Get sovereignos.ai",
    sub: "Live at sovereignos.ai · Full sovereign substrate replacement for AWS/Azure",
  },
};

export function generateStaticParams() {
  return Object.keys(INDUSTRIES).map(slug => ({ slug }));
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = INDUSTRIES[params.slug as keyof typeof INDUSTRIES];
  if (!ind) {
    return <div style={{ padding: "100px 20px", textAlign: "center" }}>Industry not found. <Link href="/">Back home</Link></div>;
  }
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: ind.color, color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Link href="/" style={{ color: ind.accent, fontSize: 13, textDecoration: "none" }}>← back to openpatent.ai</Link>
            <div style={{ fontSize: 13, color: ind.accent, marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>{ind.name} Power Pack · {ind.domain}</div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>{ind.hero_title}</h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#e0e0e0", maxWidth: 700 }}>{ind.hero_sub}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              <a href={`https://${ind.domain}`} className="cta-primary" style={{ background: ind.accent, color: "#000" }}>{ind.cta} →</a>
              <a href="/docs/strategy/02-industry-power-packs.md" className="cta-secondary" style={{ borderColor: "#fff", color: "#fff" }}>Read the doctrine</a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: "#f8f8f8", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 30 }}>
            {ind.stats.map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: ind.color }}>{s.v}</div>
                <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 40 }}>What's in the pack</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {ind.features.map(f => (
              <div key={f.t} style={{ padding: 24, border: "1px solid #e0e0e0", borderRadius: 8 }}>
                <h3 style={{ fontSize: 18, color: ind.color, marginBottom: 10 }}>{f.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section style={{ background: "#fafafa", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 40 }}>Pricing</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {ind.pricing.map(p => (
                <div key={p.tier} style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.tier}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: ind.color, margin: "8px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sub line */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: ind.color, color: "#fff" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>{ind.sub}</div>
          <div style={{ fontSize: 12, fontStyle: "italic", color: ind.accent, fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
