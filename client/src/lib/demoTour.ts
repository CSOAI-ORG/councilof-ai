// demoTour - the Sovereign's guided, self-driving walkthrough of the whole OS.
// Every step leads with a CSOAI USP - what we do that no compliance-SaaS does -
// then auto-runs the live feature so the user watches it happen, not hears about it.

export type TourStep = { path: string; title: string; say: string; demo?: string; tip?: string; usp?: string };

export const TOUR: TourStep[] = [
  {
    path: "/",
    title: "I'm your Sovereign - not a checklist",
    usp: "A live governance brain, not compliance software",
    say: "Quick tour. Everyone else hands you a compliance checklist and a dashboard. CSOAI is different: I'm a sovereign governance brain - 370+ governed tools, a 33-agent council, and cryptographic proof behind every answer. Let me show you, live.",
  },
  {
    path: "/os",
    title: "The Sovereign OS - 370+ governed tools",
    usp: "An operating system for AI governance, not a dashboard",
    say: "This is the OS. Every capability - crosswalks, risk, cyber, attestation - is a live tool running on the Sovereign brain, keyless and on-demand. Nobody else ships governance as a working operating system. Open any tile and it just runs.",
    tip: "Click any tool - it opens live in a window.",
  },
  {
    path: "/graph",
    title: "Map any AI to every law",
    usp: "One system, every framework, cross-walked",
    say: "Name any company, place or AI system and I map the jurisdiction and every framework that applies - EU AI Act, NIST, ISO 42001, TC260, NIS2, DORA - all crosswalked to one control set. Watch: a hospital in Texas.",
    demo: "a hospital in Texas",
    tip: "Type any place or system - I map the law.",
  },
  {
    path: "/try",
    title: "A 33-agent Byzantine council rules",
    usp: "Fault-tolerant consensus, not one model's opinion",
    say: "Describe an AI system and a Byzantine fault-tolerant council deliberates - 33 agents, a care-floor of 0.95 - then seals a signed verdict. Not one AI guessing: a council that can't be captured by any single node. Watch: screening job applicants with AI.",
    demo: "We use AI to screen job applicants",
    tip: "Ask a compliance question - the Council rules on it.",
  },
  {
    path: "/workbench",
    title: "SOV3 Workbench - the governance floor",
    usp: "Signed, reproducible artifacts under any AI agent",
    say: "This is the part that changes everything. Any AI task - a policy, a risk assessment, a crosswalk - becomes a signed, reproducible, council-reviewed artifact, sealed with Ed25519. This is the governance floor that sits UNDER Claude Science, Claude Code, any agent. They generate; we make it provable.",
    demo: "Draft an EU AI Act risk classification for an autonomous credit model",
    tip: "Pick a skill - it produces a sealed, verifiable artifact.",
  },
  {
    path: "/sov-space",
    title: "Govern by simulation",
    usp: "Test governance before you deploy - like code",
    say: "Run a real-world governance experiment before it's real. I simulate it and seal the verdict with a Layer 0 ledger hash you can verify offline. Governance you can test, not just tick. Watch: a fintech credit model in the EU.",
    demo: "A fintech in the EU deploying an AI credit-scoring model that approves consumer loans automatically",
    tip: "Type any scenario and hit Run experiment.",
  },
  {
    path: "/world",
    title: "The whole regulated world, live",
    usp: "A living planetary map of AI governance",
    say: "Every rule lives where it's made - the EU AI Act in Brussels, NIST near Washington - layered with live data: satellites, cyber, energy, the industries converting to AI. Ask about any place and I fly there. Watch: a hospital AI in Germany.",
    demo: "what governs a hospital AI in Germany?",
    tip: "Ask about any country - the globe flies to it.",
  },
  {
    path: "/watchdog-map",
    title: "The Global AI Watchdog",
    usp: "Public, cryptographic accountability",
    say: "Humans, AI agents, humanoids and systems all report incidents here, and the world heat-maps by problem layer - every signal cryptographically logged. Public accountability nobody can quietly edit. Click any hub and I pull the live signals.",
    tip: "Report a signal, or click a hub for my live regional read.",
  },
  {
    path: "/status",
    title: "Total transparency",
    usp: "The most transparent system you run",
    say: "The Sovereign brain and every Layer 0 protocol, checked live in front of you. An AI-governance company should be the most transparent system you run - so we show you everything, always.",
  },
  {
    path: "/pricing",
    title: "Own your AI. Plug governance into anything.",
    usp: "Governance as infrastructure - one command",
    say: "Start free, scale when you need. And one command - npx csoai-governance-mcp - drops this whole governance layer into any agent you already run. Own your AI, own your data, prove all of it. That's the tour - I'm always bottom-right. Ask me anything, any page.",
    tip: "Copy the MCP command - governance in one line.",
  },
];

const A = "sov_tour_active", S = "sov_tour_step", SEEN = "sov_tour_seen";

// Topic lenses — a surface (e.g. CesiumPortalCard) can start the tour at the
// step its visitor actually cares about instead of always at the beginning.
// Values are indexes into TOUR: 1=/os, 3=/try, 7=/watchdog-map.
export const TOUR_TOPICS: Record<string, number> = {
  os: 1,          // the Sovereign OS tool floor
  measurement: 3, // the 33-agent Byzantine council rules on a real scenario
  regulator: 7,   // public, cryptographic accountability
};

export function tourStartStep(topic?: string): number {
  const i = topic ? TOUR_TOPICS[topic] : undefined;
  return i != null && i >= 0 && i < TOUR.length ? i : 0;
}

export function startTour(topic?: string) { try { localStorage.setItem(A, "1"); localStorage.setItem(S, String(tourStartStep(topic))); localStorage.setItem(SEEN, "1"); } catch (e) {} }
export function endTour() { try { localStorage.removeItem(A); localStorage.removeItem(S); } catch (e) {} }
export function tourActive(): boolean { try { return localStorage.getItem(A) === "1"; } catch (e) { return false; } }
export function tourStep(): number { try { return parseInt(localStorage.getItem(S) || "0", 10) || 0; } catch (e) { return 0; } }
export function setTourStep(n: number) { try { localStorage.setItem(S, String(n)); } catch (e) {} }
export function tourSeen(): boolean { try { return localStorage.getItem(SEEN) === "1"; } catch (e) { return false; } }
export function markSeen() { try { localStorage.setItem(SEEN, "1"); } catch (e) {} }
