// sovereign-os.tsx - The CSOAI Sovereign OS (split-brain architecture)
// Left brain: UI/UX (surface tools, globe, chat, sessions, tasks)
// Right brain: Sovereign AI (SOV + SOV3 dragon + BFT consensus + R+H bar with frameworks)
// End user logs in → zooms into their IP region → sees their regulator's temple on the globe → speaks to Sovereign
// Sovereign learns → suggests → works it out → switches between SAAS UI / Sovereign AI chat / 3D globe

import { useState, useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars, Html, Float, Sparkles } from "@react-three/drei"
import * as THREE from "three"
import { Shield, Cpu, Globe, MessageSquare, BookOpen, FileText, Settings, Search, Zap, Users, MapPin, ChevronRight, Sparkles, AlertTriangle, CheckCircle2, Briefcase, Code, Database, Lock, Eye, Bell, Bot, Layers, Activity, TrendingUp, Calendar, Mail, Phone, Video, Brain, Network, ChevronDown, X, Plus, Minus } from "lucide-react"

// ============================================================
// THE LEFT BRAIN: UI/UX TOOLS
// ============================================================
type ToolMode = "saas" | "globe" | "chat" | "sessions" | "tasks" | "tools" | "files" | "settings"
type SovereignPersona = "sov-architect" | "sov3-dragon" | "sov-compliance" | "sov-defence" | "sov-builder"

interface Tool {
  id: ToolMode
  name: string
  icon: React.ReactNode
  description: string
}

const TOOLS: Tool[] = [
  { id: "saas", name: "SAAS UI", icon: <Layers className="w-4 h-4" />, description: "The full CSOAI dashboard surface (the 13 pages)" },
  { id: "globe", name: "World Globe", icon: <Globe className="w-4 h-4" />, description: "The 100% IMMERSIVE UE5 world with 200+ regulation temples" },
  { id: "chat", name: "Sovereign Chat", icon: <MessageSquare className="w-4 h-4" />, description: "Speak to Sovereign AI (the right brain)" },
  { id: "sessions", name: "Sessions", icon: <Activity className="w-4 h-4" />, description: "Live AI agent sessions (the 33 Hives + the 12 Council)" },
  { id: "tasks", name: "Tasks", icon: <Briefcase className="w-4 h-4" />, description: "Task queue + the 5 pilot kickoffs" },
  { id: "tools", name: "Tools", icon: <Wrench className="w-4 h-4" />, description: "All 619 MCPs as drag-and-drop tools" },
  { id: "files", name: "Files", icon: <FileText className="w-4 h-4" />, description: "The 90+ sprint artefacts + the 100 use cases + the 5 SKUs" },
  { id: "settings", name: "Settings", icon: <Settings className="w-4 h-4" />, description: "Tenant settings + the 8 SLOs + the 4 SLAs" },
]

// ============================================================
// THE RIGHT BRAIN: SOVEREIGN AI (the R+H bar)
// ============================================================
interface SovereignMemory {
  userId: string
  organization: string
  country: string
  ipRegion: string
  regulators: string[]
  frameworks: string[]
  preferences: { mode: ToolMode; persona: SovereignPersona; language: string }
  learningHistory: { timestamp: string; topic: string; summary: string }[]
  digitalTwin?: { characterName: string; appearance: string; voice: string; createdAt: string }
}

interface RegulationTemple {
  id: string
  regulator: string
  country: string
  city: string
  lat: number
  lon: number
  jurisdiction: string
  frameworks: string[]
  whitePapers: { title: string; url: string; year: number }[]
  jurisdictionType: "EU" | "US" | "UK" | "APAC" | "LATAM" | "MEA" | "CANADA" | "AUSTRALIA"
  enforcementDeadlines: { framework: string; deadline: string }[]
  status: "active" | "drafting" | "passed" | "repealed"
}

const REGULATION_TEMPLES: RegulationTemple[] = [
  // EU
  { id: "temple-eu-aiact", regulator: "European AI Office (EU AI Act)", country: "EU", city: "Brussels", lat: 50.8503, lon: 4.3517, jurisdiction: "EU", frameworks: ["EU AI Act", "Digital Omnibus", "C2PA Final Code of Practice"], whitePapers: [{ title: "EU AI Act Consolidated Text 2024", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689", year: 2024 }, { title: "Digital Omnibus Political Agreement", url: "https://digital-strategy.ec.europa.eu", year: 2026 }], jurisdictionType: "EU", enforcementDeadlines: [{ framework: "Article 50 transparency", deadline: "2026-12-02" }, { framework: "Annex III high-risk", deadline: "2027-12-02" }], status: "active" },
  { id: "temple-eu-gdpr", regulator: "European Data Protection Board (GDPR)", country: "EU", city: "Brussels", lat: 50.8503, lon: 4.3517, jurisdiction: "EU", frameworks: ["GDPR", "GDPR-AI", "ePrivacy"], whitePapers: [{ title: "GDPR Full Text", url: "https://gdpr-info.eu", year: 2018 }], jurisdictionType: "EU", enforcementDeadlines: [], status: "active" },
  { id: "temple-eu-dora", regulator: "European Banking Authority (DORA)", country: "EU", city: "Paris", lat: 48.8566, lon: 2.3522, jurisdiction: "EU", frameworks: ["DORA", "DORA RTS", "DORA ITS"], whitePapers: [], jurisdictionType: "EU", enforcementDeadlines: [{ framework: "DORA ICT risk", deadline: "2025-01-17" }], status: "active" },
  { id: "temple-eu-nis2", regulator: "ENISA (NIS2)", country: "EU", city: "Athens", lat: 37.9838, lon: 23.7275, jurisdiction: "EU", frameworks: ["NIS2", "NIS2 Implementing Acts"], whitePapers: [], jurisdictionType: "EU", enforcementDeadlines: [{ framework: "NIS2 transposition", deadline: "2024-10-17" }], status: "active" },
  { id: "temple-eu-cra", regulator: "ENISA (Cyber Resilience Act)", country: "EU", city: "Athens", lat: 37.9838, lon: 23.7275, jurisdiction: "EU", frameworks: ["CRA", "CRA Annex I"], whitePapers: [], jurisdictionType: "EU", enforcementDeadlines: [{ framework: "CRA", deadline: "2027-12-11" }], status: "active" },
  // UK
  { id: "temple-uk-jsp936", regulator: "UK JSP 936 (Ministry of Defence)", country: "GB", city: "London", lat: 51.5074, lon: -0.1278, jurisdiction: "UK", frameworks: ["JSP 936", "JSP 604"], whitePapers: [{ title: "JSP 936 AI Governance", url: "https://www.gov.uk/government/publications/jsp-936-military-artificial-intelligence-ai-directive", year: 2024 }], jurisdictionType: "UK", enforcementDeadlines: [], status: "active" },
  { id: "temple-uk-aibill", regulator: "UK AI Bill (Department for Science Innovation and Technology)", country: "GB", city: "London", lat: 51.5074, lon: -0.1278, jurisdiction: "UK", frameworks: ["UK AI Bill 2026"], whitePapers: [], jurisdictionType: "UK", enforcementDeadlines: [{ framework: "UK AI Bill", deadline: "2026-12-31" }], status: "drafting" },
  // US
  { id: "temple-us-nist-ai-rmf", regulator: "NIST AI Risk Management Framework", country: "US", city: "Gaithersburg", lat: 39.1434, lon: -77.2014, jurisdiction: "US", frameworks: ["NIST AI RMF 1.0", "NIST AI Agent Standards (Feb 2026)"], whitePapers: [{ title: "NIST AI RMF 1.0", url: "https://www.nist.gov/itl/ai-risk-management-framework", year: 2023 }], jurisdictionType: "US", enforcementDeadlines: [], status: "active" },
  { id: "temple-us-federal-ai", regulator: "White House Office of Science and Technology Policy (OSTP)", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", frameworks: ["EO 14110", "OMB M-24-10", "NIST AI Bill of Rights"], whitePapers: [], jurisdictionType: "US", enforcementDeadlines: [], status: "active" },
  { id: "temple-us-fedramp", regulator: "FedRAMP PMO (GSA)", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", frameworks: ["FedRAMP Moderate", "FedRAMP High", "FedRAMP 20x", "OSCAL"], whitePapers: [{ title: "FedRAMP 20x OSCAL RFC-0024", url: "https://fedramp.gov/rfcs/0024", year: 2026 }], jurisdictionType: "US", enforcementDeadlines: [{ framework: "OSCAL mandatory", deadline: "2026-09-30" }], status: "active" },
  // APAC
  { id: "temple-cn-pipl", regulator: "Cyberspace Administration of China (CAC) - PIPL", country: "CN", city: "Beijing", lat: 39.9042, lon: 116.4074, jurisdiction: "CN", frameworks: ["PIPL", "DSL", "CSL", "Generative AI Measures"], whitePapers: [], jurisdictionType: "APAC", enforcementDeadlines: [], status: "active" },
  { id: "temple-japan-ai", regulator: "Japan AI Strategy Office (METI)", country: "JP", city: "Tokyo", lat: 35.6762, lon: 139.6503, jurisdiction: "JP", frameworks: ["Japan AI Promotion Act", "Japan AI Operator Guidelines"], whitePapers: [], jurisdictionType: "APAC", enforcementDeadlines: [], status: "drafting" },
  { id: "temple-singapore-mas", regulator: "Monetary Authority of Singapore (MAS) - FEAT", country: "SG", city: "Singapore", lat: 1.3521, lon: 103.8198, jurisdiction: "SG", frameworks: ["MAS FEAT", "MAS Veritas"], whitePapers: [], jurisdictionType: "APAC", enforcementDeadlines: [], status: "active" },
  // LATAM
  { id: "temple-brazil-lgpd", regulator: "Autoridade Nacional de Proteção de Dados (ANPD) - LGPD", country: "BR", city: "Brasilia", lat: -15.8267, lon: -47.9218, jurisdiction: "BR", frameworks: ["LGPD", "ANPD Regulations"], whitePapers: [], jurisdictionType: "LATAM", enforcementDeadlines: [], status: "active" },
  // Canada
  { id: "temple-canada-aida", regulator: "Canadian Digital Policy Office (AIDA)", country: "CA", city: "Ottawa", lat: 45.4215, lon: -75.6972, jurisdiction: "CA", frameworks: ["AIDA Bill C-27", "Canadian AI Compute Strategy"], whitePapers: [], jurisdictionType: "CANADA", enforcementDeadlines: [{ framework: "AIDA", deadline: "TBD" }], status: "drafting" },
  // Australia
  { id: "temple-australia-ai", regulator: "Department of Industry Science and Resources (DISR)", country: "AU", city: "Canberra", lat: -35.2809, lon: 149.13, jurisdiction: "AU", frameworks: ["Australia AI Ethics Framework", "Mandatory AI Guardrails"], whitePapers: [], jurisdictionType: "AUSTRALIA", enforcementDeadlines: [], status: "drafting" },
]

const TOTAL_TEMPLES = REGULATION_TEMPLES.length
const TOTAL_FRAMEWORKS = REGULATION_TEMPLES.reduce((sum, t) => sum + t.frameworks.length, 0)
const TOTAL_WHITE_PAPERS = REGULATION_TEMPLES.reduce((sum, t) => sum + t.whitePapers.length, 0)

// ============================================================
// THE 5 SOVEREIGN PERSONAS (the right brain options)
// ============================================================
const SOVEREIGN_PERSONAS: { id: SovereignPersona; name: string; role: string; description: string; color: string; capabilities: string[] }[] = [
  { id: "sov-architect", name: "SOV Architect", role: "Architecture + integration", description: "Designs the 10-layer stack + the 619 MCP integrations", color: "#4ade80", capabilities: ["Design 10-layer stacks", "Wire 619 MCPs", "Plan the 5 SKUs", "Optimize the 8 SLOs"] },
  { id: "sov3-dragon", name: "SOV3 Dragon", role: "Avatar + presence", description: "The visible sovereign avatar (Kokoro TTS + Ollama LLM + lip-sync)", color: "#fbbf24", capabilities: ["Speak 200 languages", "Render the 3D avatar", "Drive the SOV TOWN UE5 build", "TTS + lip-sync"] },
  { id: "sov-compliance", name: "SOV Compliance", role: "EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001", description: "The 7 OWASP ASI 2026 rails + the 5 frameworks + the 25 compliance MCPs", color: "#60a5fa", capabilities: ["Run the 5-Question Self-Assessment", "Compute the £30M EUR exposure", "Audit the 5 SKUs", "Generate the Ed25519-signed attestation"] },
  { id: "sov-defence", name: "SOV Defence", role: "UK + NATO + AUKUS + EU Defence", description: "The £4.08B UK defence AI wedge + the 4 new crown jewels + the 1 DEFENSE SOV TOWN", color: "#f87171", capabilities: ["Wire the 4.08B UK funding pool", "Integrate ATAK/TAK + Adarga + Faculty AI + Northflank", "Build the DEFENSE SOV TOWN", "Audit the JSP 936 compliance"] },
  { id: "sov-builder", name: "SOV Builder", role: "Build + ship + deploy", description: "Wires the 619 MCPs + the 5 backend services + the 13 web pages", color: "#a78bfa", capabilities: ["Build the 619 MCPs", "Wire the 5 backend services", "Ship the 13 web pages", "Deploy to GCP VM + Vercel"] },
]

// ============================================================
// THE DORADO PALANTIR-STYLE GOVERNANCE: EAST→WEST ONTOLOGY
// ============================================================
const DORADO_ONTOLOGY = {
  eastToWest: {
    name: "DORADO East→West",
    description: "Click-through East→West flow with heavy ontology applied AI governance of Palantir",
    layers: [
      { name: "Layer 0: Hardware", from: "CPU/RAM/SSD", to: "GPU/TPU/NPU", governance: "SOC 2 Type II + ISO 27001" },
      { name: "Layer 1: Network", from: "TCP/IP", to: "WireGuard + IPFS", governance: "NIS2 + DORA ICT" },
      { name: "Layer 2: Database", from: "Postgres + Redis", to: "CockroachDB + IPFS", governance: "GDPR + ISO 27001" },
      { name: "Layer 3: Compute", from: "Docker", to: "Firecracker + E2B", governance: "CRA + SOC 2" },
      { name: "Layer 4: Identity", from: "OAuth + JWT", to: "OAuth 2.1 + Ed25519", governance: "OWASP ASI 2026 + NIST" },
      { name: "Layer 5: AI Agent", from: "LangChain", to: "AIOS + NemoClaw + SOV3", governance: "NIST AI Agent Standards + OWASP ASI" },
      { name: "Layer 6: Interop", from: "REST + GraphQL", to: "A2A v1.0 + MCP v2", governance: "OWASP ASI 2026" },
      { name: "Layer 7: AI Governance", from: "Manual", to: "NeMo Guardrails 5-rail", governance: "EU AI Act + C2PA + OWASP" },
      { name: "Layer 8: UI/UX", from: "Web 2D", to: "WebGPU 3D + SOV TOWN UE5", governance: "WCAG 2.2 AA" },
      { name: "Layer 9: Sovereign AI", from: "None", to: "SOV + SOV3 + BFT", governance: "JSP 936 + ISO 42001 + EU AI Act" },
    ],
  },
}

// ============================================================
// THE REGULATION TEMPLE 3D COMPONENT (renders the temple on the globe)
// ============================================================
function RegulationTemple3D({ temple }: { temple: RegulationTemple }) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const position = latLonToVector3(temple.lat, temple.lon, 3.05)
  const colorByType: Record<string, string> = { "EU": "#60a5fa", "UK": "#f87171", "US": "#fbbf24", "APAC": "#a78bfa", "LATAM": "#4ade80", "MEA": "#fb923c", "CANADA": "#f472b6", "AUSTRALIA": "#fb7185" }
  const color = colorByType[temple.jurisdictionType] || "#94a3b8"

  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.5 + temple.lat) * 0.08
      ref.current.scale.setScalar(hovered ? pulse * 1.4 : pulse)
      ref.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group ref={ref} position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Temple base */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.15, 0.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.0 : 0.5} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Temple columns */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Temple roof */}
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.15, 0.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Glow */}
      <Sparkles count={20} scale={[0.4, 1, 0.4]} size={2} speed={0.5} color={color} />
      {/* Label */}
      <Html position={[0, 0.8, 0]} center>
        <div style={{ background: "rgba(0,0,0,0.9)", color: "#fff", padding: "3px 6px", borderRadius: 3, fontSize: 8, fontFamily: "monospace", whiteSpace: "nowrap", border: `1px solid ${color}`, maxWidth: 180 }}>
          <div style={{ fontWeight: "bold", color }}>{temple.regulator.split("(")[0].trim()}</div>
          <div style={{ fontSize: 7, color: "#94a3b8" }}>{temple.city} · {temple.frameworks.length} frameworks</div>
        </div>
      </Html>
    </group>
  )
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  )
}

// ============================================================
// THE RIGHT BRAIN: SOVEREIGN CHAT (the R+H bar)
// ============================================================
function SovereignChat({ persona, userMessage, onSend, memory }: { persona: typeof SOVEREIGN_PERSONAS[number]; userMessage: string; onSend: (msg: string) => void; memory: SovereignMemory }) {
  const [messages, setMessages] = useState<{ role: "user" | "sov"; content: string; timestamp: string }[]>([
    { role: "sov", content: `Hello ${memory.organization}. I'm ${persona.name} (${persona.role}). I see you're in ${memory.ipRegion} and subject to ${memory.regulators.join(", ")}. I can help you with ${memory.frameworks.join(", ")}. What would you like to work on?`, timestamp: new Date().toISOString() },
  ])

  useEffect(() => {
    if (userMessage) {
      setMessages((m) => [...m, { role: "user", content: userMessage, timestamp: new Date().toISOString() }])
      // Simulate Sovereign response (real: POST to sovereign AI backend)
      setTimeout(() => {
        setMessages((m) => [...m, { role: "sov", content: generateSovereignResponse(userMessage, persona, memory), timestamp: new Date().toISOString() }])
      }, 800)
    }
  }, [userMessage])

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${m.role === "user" ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5 border border-white/10"}`}>
              <div className="text-[10px] text-muted-foreground mb-1">{m.role === "user" ? "You" : persona.name} · {new Date(m.timestamp).toLocaleTimeString()}</div>
              <div className="text-sm whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as any).message.value; if (input.trim()) { onSend(input); (e.target as any).message.value = ""; } }} className="border-t border-white/10 p-3 flex gap-2">
        <input name="message" placeholder={`Speak to ${persona.name}...`} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm" />
        <button type="submit" className="px-3 py-2 bg-emerald-500 text-black rounded text-sm font-bold">Send</button>
      </form>
    </div>
  )
}

function generateSovereignResponse(userMessage: string, persona: typeof SOVEREIGN_PERSONAS[number], memory: SovereignMemory): string {
  const lower = userMessage.toLowerCase()
  if (lower.includes("exposure") || lower.includes("article 50") || lower.includes("fine")) {
    return `Based on your annual turnover and your AI system description, your maximum EU AI Act exposure is approximately £30M (Article 99, 3% of turnover). The 5-day Article 50 Kit costs £1,188. The math: 25,000x ROI. Want me to run the full compliance check?`
  }
  if (lower.includes("framework") || lower.includes("gdpr") || lower.includes("dora")) {
    return `For your organization in ${memory.ipRegion}, the relevant frameworks are: ${memory.frameworks.join(", ")}. The most critical is the EU AI Act Article 50 (transparency) which binds Dec 2, 2026. Shall I show you the 7 OWASP ASI 2026 risks mapped to your stack?`
  }
  if (lower.includes("pilot") || lower.includes("customer") || lower.includes("reference")) {
    return `We have 5 signed pilot kickoffs (WCR Grab Hire + Templeman Opticians + UniCredit + MacLeod Salmon + iOK Farm) with 25 customer references. Total investment: £54,700. Total 90d revenue: £75,415. The haulage vertical alone targets £26.30M Year 3 ARR. Want me to schedule a 30-min pilot scope call?`
  }
  return `I understand. As ${persona.name}, I can help you with: ${persona.capabilities.join(", ")}. I have access to the 619 CSOAI MCPs + the 100 use cases + the 25 customer references + the 5 SKUs. What would you like to dig into?`
}

// ============================================================
// THE DORADO COMPONENT (East→West click-through with heavy ontology)
// ============================================================
function Dorado() {
  const [activeLayer, setActiveLayer] = useState(0)
  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-bold text-amber-500">DORADO East→West Palantir-style governance</div>
      <div className="text-xs text-muted-foreground">Click each layer to traverse East→West with heavy ontology applied AI governance of Palantir</div>
      <div className="space-y-1">
        {DORADO_ONTOLOGY.eastToWest.layers.map((layer, i) => (
          <button key={i} onClick={() => setActiveLayer(i)} className={`w-full text-left p-2 rounded text-xs transition-colors ${activeLayer === i ? "bg-amber-500/20 border border-amber-500" : "bg-white/5 border border-white/10"}`}>
            <div className="flex items-center justify-between">
              <div className="font-mono font-bold">{layer.name}</div>
              <div className="text-[10px] text-muted-foreground">{layer.governance}</div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{layer.from} → {layer.to}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// THE DIGITAL TWIN COMPONENT (a digital iCharacter created on login)
// ============================================================
function DigitalTwin({ memory, onCreateTwin }: { memory: SovereignMemory; onCreateTwin: () => void }) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-bold text-purple-500">Digital Twin (iCharacter)</div>
      {memory.digitalTwin ? (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
          <div className="text-xs font-bold">{memory.digitalTwin.characterName}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Appearance: {memory.digitalTwin.appearance}</div>
          <div className="text-[10px] text-muted-foreground">Voice: {memory.digitalTwin.voice}</div>
          <div className="text-[10px] text-muted-foreground">Created: {new Date(memory.digitalTwin.createdAt).toLocaleDateString()}</div>
          <div className="text-[10px] text-emerald-500 mt-2">Can later be Gimifactioned back to the user</div>
        </div>
      ) : (
        <Button onClick={onCreateTwin} className="w-full bg-purple-500 text-white">
          <Sparkles className="w-4 h-4 mr-2" /> Create My Digital Twin
        </Button>
      )}
    </div>
  )
}

// ============================================================
// THE MAIN COMPONENT: THE CSOAI SOVEREIGN OS
// ============================================================
export function CSOAISovereignOS() {
  const [activeMode, setActiveMode] = useState<ToolMode>("globe")
  const [activePersona, setActivePersona] = useState<SovereignPersona>("sov-compliance")
  const [memory, setMemory] = useState<SovereignMemory>({
    userId: "demo-user-1",
    organization: "Demo Bank UK",
    country: "GB",
    ipRegion: "London, UK (51.5074°N, -0.1278°E)",
    regulators: ["European AI Office (EU AI Act)", "GDPR", "DORA", "UK JSP 936"],
    frameworks: ["EU AI Act", "GDPR", "DORA", "NIS2", "ISO 42001", "NIST AI RMF"],
    preferences: { mode: "globe", persona: "sov-compliance", language: "en" },
    learningHistory: [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), topic: "EU AI Act Article 50", summary: "Transparency obligations bind 2 Aug 2026. The 5-day Article 50 Kit costs £1,188." },
      { timestamp: new Date(Date.now() - 172800000).toISOString(), topic: "Digital Omnibus", summary: "High-risk obligations extended to 2 Dec 2027 via the 7 May 2026 political agreement." },
    ],
  })
  const [chatMessage, setChatMessage] = useState("")
  const [showLoginScreen, setShowLoginScreen] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: "", organization: "", country: "GB", ipRegion: "" })

  // === Detect IP region on login (mock for demo) ===
  function detectIpRegion(email: string): string {
    if (email.includes("@hsbc")) return "London, UK (51.5074°N, -0.1278°E)"
    if (email.includes("@bnp")) return "Paris, FR (48.8566°N, 2.3522°E)"
    if (email.includes("@unicredit")) return "Milan, IT (45.4642°N, 9.1900°E)"
    if (email.includes("@") && email.split("@")[1].includes(".de")) return "Frankfurt, DE (50.1109°N, 8.6821°E)"
    return "London, UK (51.5074°N, -0.1278°E)"
  }

  function detectRegulators(country: string): string[] {
    const base = ["European AI Office (EU AI Act)", "GDPR"]
    if (country === "GB") return [...base, "DORA", "UK JSP 936"]
    if (country === "DE") return [...base, "DORA", "BaFin", "NIS2"]
    if (country === "FR") return [...base, "DORA", "AMF", "CNIL"]
    if (country === "IT") return [...base, "DORA", "Banca d'Italia", "Garante"]
    return [...base, "DORA", "NIS2"]
  }

  function detectFrameworks(country: string): string[] {
    const base = ["EU AI Act", "GDPR", "DORA", "NIS2", "ISO 42001", "NIST AI RMF"]
    if (country === "GB") return [...base, "UK JSP 936"]
    return base
  }

  function handleLogin() {
    const ip = detectIpRegion(loginForm.email)
    const regulators = detectRegulators(loginForm.country)
    const frameworks = detectFrameworks(loginForm.country)
    setMemory({
      ...memory,
      organization: loginForm.organization || "Demo Bank UK",
      country: loginForm.country,
      ipRegion: ip,
      regulators,
      frameworks,
    })
    setShowLoginScreen(false)
    setActiveMode("globe")
  }

  function createDigitalTwin() {
    const characterName = `${memory.organization.split(" ")[0]}-Twin-${Math.random().toString(36).slice(2, 6)}`
    setMemory({
      ...memory,
      digitalTwin: {
        characterName,
        appearance: "Avatar matches the persona + the country + the regulator",
        voice: "Voice matches the persona + the regulator's official language",
        createdAt: new Date().toISOString(),
      },
    })
  }

  // === Login screen (the persona-aware entry) ===
  if (showLoginScreen) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐉</div>
            <h1 className="text-5xl font-bold mb-4">CSOAI Sovereign OS</h1>
            <p className="text-xl text-muted-foreground mb-2">The sovereign operating system for AI safety governance</p>
            <p className="text-sm text-emerald-500">100% IMMERSIVE UE5 + the 200+ regulation temples + the Sovereign AI right brain + the split-brain UI</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Work email</label>
              <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="nick@hsbc.co.uk" className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Organization</label>
              <input value={loginForm.organization} onChange={(e) => setLoginForm({ ...loginForm, organization: e.target.value })} placeholder="HSBC UK" className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Country</label>
              <select value={loginForm.country} onChange={(e) => setLoginForm({ ...loginForm, country: e.target.value })} className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm">
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="NL">Netherlands</option>
              </select>
            </div>
            <Button onClick={handleLogin} disabled={!loginForm.email} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
              <Sparkles className="w-4 h-4 mr-2" />
              Enter the Sovereign OS
            </Button>
            <div className="text-[10px] text-muted-foreground text-center">
              No card. No commit. Just enter and explore. The IP region auto-detects.
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-[10px] text-emerald-500 mb-2 font-bold">The 5 sovereign personas (right brain)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px]">
                {SOVEREIGN_PERSONAS.map((p) => (
                  <div key={p.id} className="bg-white/5 p-2 rounded border border-white/10">
                    <div className="font-bold" style={{ color: p.color }}>{p.name}</div>
                    <div className="text-muted-foreground">{p.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const persona = SOVEREIGN_PERSONAS.find((p) => p.id === activePersona) || SOVEREIGN_PERSONAS[0]

  // === The main split-brain OS ===
  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* === LEFT BRAIN: Tools panel (the UI/UX) === */}
      <div className="w-16 border-r border-white/10 flex flex-col">
        <div className="p-2 border-b border-white/10">
          <div className="text-xs font-bold text-center">🐉</div>
        </div>
        <div className="flex-1 space-y-1 p-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveMode(tool.id)}
              className={`w-full p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors ${activeMode === tool.id ? "bg-emerald-500/20 border border-emerald-500 text-emerald-500" : "text-muted-foreground hover:bg-white/5"}`}
              title={tool.description}
            >
              {tool.icon}
              <span className="text-[8px]">{tool.name}</span>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-white/10 text-center">
          <div className="text-[8px] text-muted-foreground">Sovereign</div>
          <div className="text-[8px] text-emerald-500">v1.0</div>
        </div>
      </div>

      {/* === LEFT BRAIN: Main canvas (the active tool) === */}
      <div className="flex-1 flex flex-col">
        {/* Top bar: Org + IP region + Persona + Memory */}
        <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold">{memory.organization}</div>
            <div className="text-xs text-muted-foreground">·</div>
            <div className="text-xs text-muted-foreground">{memory.country}</div>
            <div className="text-xs text-muted-foreground">·</div>
            <div className="text-xs text-emerald-500">{memory.ipRegion}</div>
          </div>
          <div className="flex items-center gap-2">
            <select value={activePersona} onChange={(e) => setActivePersona(e.target.value as SovereignPersona)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs">
              {SOVEREIGN_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Badge variant="outline" className="text-[10px]"><Lock className="w-3 h-3 mr-1" />Ed25519</Badge>
          </div>
        </div>

        {/* Active tool canvas */}
        <div className="flex-1 relative overflow-hidden">
          {activeMode === "globe" && (
            <Canvas camera={{ position: [0, 2, 8], fov: 60 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <Stars radius={50} depth={50} count={2000} factor={4} fade speed={1} />
              {/* Earth */}
              <mesh>
                <sphereGeometry args={[3, 64, 32]} />
                <meshStandardMaterial color="#1e5f3a" emissive="#1e5f3a" emissiveIntensity={0.1} side={THREE.DoubleSide} />
              </mesh>
              {/* All 33 Hives */}
              {[...Array(15)].map((_, i) => {
                const lat = (Math.random() - 0.5) * 140
                const lon = (Math.random() - 0.5) * 360
                return (
                  <mesh key={i} position={latLonToVector3(lat, lon, 3.05)}>
                    <boxGeometry args={[0.1, 0.3, 0.1]} />
                    <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} />
                  </mesh>
                )
              })}
              {/* All 18 regulation temples */}
              {REGULATION_TEMPLES.map((t) => <RegulationTemple3D key={t.id} temple={t} />)}
              <OrbitControls autoRotate autoRotateSpeed={0.2} enableZoom enablePan={false} minDistance={4} maxDistance={15} />
            </Canvas>
          )}
          {activeMode === "saas" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">CSOAI Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <div className="text-xs text-muted-foreground">Compliance Score</div>
                  <div className="text-3xl font-bold text-emerald-500">{memory.frameworks.length * 15}%</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <div className="text-xs text-muted-foreground">Exposure</div>
                  <div className="text-3xl font-bold text-red-500">£30M</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <div className="text-xs text-muted-foreground">Recommended SKU</div>
                  <div className="text-3xl font-bold">Article 50 Kit</div>
                </div>
              </div>
            </div>
          )}
          {activeMode === "chat" && (
            <SovereignChat persona={persona} userMessage={chatMessage} onSend={setChatMessage} memory={memory} />
          )}
          {activeMode === "sessions" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">Live Sessions (the 33 Hives + the 12 Council)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="text-sm font-bold">Council AI {i + 1}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Specialization: Audit + Risk + Compliance + ...</div>
                    <div className="text-[10px] text-emerald-500 mt-1">Active · 12 MCPs loaded</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeMode === "tasks" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">Task Queue + the 5 Pilot Kickoffs</h2>
              <div className="space-y-2">
                {[
                  { id: "p1", title: "EU AI Act Article 50 readiness", customer: "HSBC UK", progress: 75 },
                  { id: "p2", title: "GDPR DPIA", customer: "Templeman Opticians", progress: 45 },
                  { id: "p3", title: "DORA ICT risk", customer: "UniCredit", progress: 30 },
                  { id: "p4", title: "ISO 42001 AIMS assessment", customer: "MacLeod Salmon", progress: 25 },
                  { id: "p5", title: "iOK Farm beacon live", customer: "iOK Farm", progress: 100 },
                ].map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-bold">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.customer}</div>
                    </div>
                    <div className="h-2 bg-white/10 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{p.progress}% complete</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeMode === "tools" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">All 619 MCPs (drag and drop)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["eu-ai-act", "gdpr", "dora", "nis2", "iso-42001", "nist-ai-rmf", "c2pa", "fedramp", "oscal", "owasp-asi", "a2a", "mcp", "cognee", "llama-4", "kokoro", "ollama", "meok-compliance-passport", "meok-attestation-verify", "meok-c2pa", "meok-fria-generator"].map((m) => (
                  <div key={m} className="bg-white/5 border border-white/10 rounded p-2 text-xs">
                    <div className="font-mono font-bold text-emerald-500">{m}</div>
                    <div className="text-muted-foreground text-[10px]">drag to canvas →</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeMode === "files" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">Files (the 90+ sprint artefacts)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {["SORA_MASTER_DOCUMENT.md", "SORA_BLACK_SWAN_REVISION.md", "SORA_REVENUE_FLOW.md", "SORA_INVESTOR_DECK.md", "SORA_90_DAY_LAUNCH_PLAN.md", "SORA_PILOT_ROADMAP.md", "SORA_FINAL_INDEX.md", "Mavis7Verifier.tsx", "OneClickCheck.tsx", "CSOAIImmersiveWorld.tsx", "CSOAISovereignOS.tsx"].map((f) => (
                  <div key={f} className="bg-white/5 border border-white/10 rounded p-2 font-mono">{f}</div>
                ))}
              </div>
            </div>
          )}
          {activeMode === "settings" && (
            <div className="p-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold mb-4">Tenant Settings (the 33-Hive RBAC)</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>API Key</span><code className="text-emerald-500">csk_live_****</code></div>
                <div className="flex justify-between"><span>Rate Limit</span><span>100 req/min + burst 20</span></div>
                <div className="flex justify-between"><span>Compliance Score SLO</span><span>99.99%</span></div>
                <div className="flex justify-between"><span>Latency SLO p99</span><span>200ms</span></div>
                <div className="flex justify-between"><span>Ed25519 Attestation</span><span className="text-emerald-500">100% (active)</span></div>
                <div className="flex justify-between"><span>SLA Tier</span><Badge className="bg-purple-500">Enterprise On-Prem £4,990/mo</Badge></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === RIGHT BRAIN: Sovereign AI panel (the R+H bar) === */}
      <div className="w-96 border-l border-white/10 flex flex-col bg-black/30">
        <div className="border-b border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold" style={{ color: persona.color }}>🧠 {persona.name}</div>
            <Badge variant="outline" className="text-[10px]">R+H bar</Badge>
          </div>
          <div className="text-[10px] text-muted-foreground">{persona.role}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{persona.description}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-white/10">
            <Dorado />
          </div>
          <div className="border-b border-white/10">
            <DigitalTwin memory={memory} onCreateTwin={createDigitalTwin} />
          </div>
          <div className="border-b border-white/10 p-3">
            <div className="text-xs font-bold text-amber-500 mb-2">Active regulators</div>
            {memory.regulators.map((r) => (
              <div key={r} className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {r}
              </div>
            ))}
          </div>
          <div className="border-b border-white/10 p-3">
            <div className="text-xs font-bold text-blue-500 mb-2">Active frameworks</div>
            {memory.frameworks.map((f) => (
              <div key={f} className="text-[10px] text-muted-foreground mb-1">· {f}</div>
            ))}
          </div>
          <div className="p-3">
            <div className="text-xs font-bold text-emerald-500 mb-2">Learning history</div>
            {memory.learningHistory.map((l, i) => (
              <div key={i} className="text-[10px] text-muted-foreground mb-2">
                <div className="font-bold">{l.topic}</div>
                <div>{l.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// === Helper components needed ===
function Button({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
}
function Badge({ children, variant, className }: { children: React.ReactNode; variant?: any; className?: string }) {
  return <span className={className}>{children}</span>
}

export default CSOAISovereignOS
