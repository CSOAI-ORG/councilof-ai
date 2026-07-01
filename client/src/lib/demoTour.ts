// demoTour - the Sovereign's guided, self-driving walkthrough of the whole OS.
// The Sovereign narrates each surface and auto-runs its live feature so the user
// watches CSOAI govern real AI - EU AI Act and every other framework - in real time.

export type TourStep = { path: string; title: string; say: string; demo?: string; tip?: string };

export const TOUR: TourStep[] = [
  { path: "/", title: "Welcome - I'm your Sovereign", say: "Hey - let me just show you around. I'll walk you through it live, on screen: how CSOAI governs any AI, the EU AI Act and every other framework. Ready? Here we go." },
  { path: "/graph", title: "The Governance Graph", say: "Name any company, place or AI system and I map the jurisdiction and every framework that applies. Watch - a hospital in Texas.", demo: "a hospital in Texas", tip: "Type any place or system - I map the law." },
  { path: "/try", title: "The live Council", say: "Describe an AI system and five agents deliberate, then seal a signed verdict. Watch - screening job applicants with AI.", demo: "We use AI to screen job applicants", tip: "Ask a compliance question - the Council rules on it." },
  { path: "/sov-space", title: "Sov Space - simulate governance", say: "Run a real-world governance experiment. I simulate it and seal a verdict with a Layer 0 ledger hash. Watch - a fintech credit model in the EU.", demo: "A fintech in the EU deploying an AI credit-scoring model that approves consumer loans automatically", tip: "Type any scenario and hit Run experiment." },
  { path: "/world", title: "Regulations mapped on the real world", say: "Every rule lives where it's made - the EU AI Act in Brussels, NIST near Washington. Ask me about any place and I fly the globe there. Watch - a hospital AI in Germany.", demo: "what governs a hospital AI in Germany?", tip: "Ask about any country - the globe flies to it." },
  { path: "/watchdog-map", title: "The Global AI Watchdog", say: "This is our public watchdog - humans, AI agents, humanoids and systems all report incidents here, and the world heat-maps by problem layer. Click any hub and I pull the live signals.", tip: "Report a signal, or click a hub for my live regional read." },
  { path: "/status", title: "Total transparency", say: "The Sovereign brain and every Layer 0 protocol, checked live. An AI-governance company should be the most transparent system you run." },
  { path: "/pricing", title: "Own your AI. Own your data.", say: "Start free, scale when you need. That's the tour - I'm always here, bottom-right. Ask me anything, anytime, on any page." },
];

const A = "sov_tour_active", S = "sov_tour_step", SEEN = "sov_tour_seen";

export function startTour() { try { localStorage.setItem(A, "1"); localStorage.setItem(S, "0"); localStorage.setItem(SEEN, "1"); } catch (e) {} }
export function endTour() { try { localStorage.removeItem(A); localStorage.removeItem(S); } catch (e) {} }
export function tourActive(): boolean { try { return localStorage.getItem(A) === "1"; } catch (e) { return false; } }
export function tourStep(): number { try { return parseInt(localStorage.getItem(S) || "0", 10) || 0; } catch (e) { return 0; } }
export function setTourStep(n: number) { try { localStorage.setItem(S, String(n)); } catch (e) {} }
export function tourSeen(): boolean { try { return localStorage.getItem(SEEN) === "1"; } catch (e) { return false; } }
export function markSeen() { try { localStorage.setItem(SEEN, "1"); } catch (e) {} }
