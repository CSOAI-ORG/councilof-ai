// demoTour - the Council assistant's guided, self-driving walkthrough of the whole OS.
// Each step states whether the linked surface is measured, a catalogue, or a demo.
// Navigation must never promote a routed page into a live backend capability.

export type TourStep = { path: string; title: string; say: string; demo?: string; tip?: string; usp?: string };

export const TOUR: TourStep[] = [
  {
    path: "/",
    title: "I'm your Council assistant - not a checklist",
    usp: "A measurement-led interface, with status visible",
    say: "A short walk through the public board, signed cards, verification, catalogues and design demos. I will distinguish what is measured from what is only proposed.",
  },
  {
    path: "/dashboard?tab=home",
    title: "The Council OS — signed measurement tools",
    usp: "One shell for measured records, catalogues and prototypes",
    say: "This is the consolidated shell. Tiles open public records, tools, catalogues or design demos; a tile does not by itself prove a callable backend or live Council capability.",
    tip: "Open a tile and read its evidence state before relying on it.",
  },
  {
    path: "/dashboard?tab=home",
    title: "Explore candidate framework mappings",
    usp: "Crosswalk research without an automatic legal verdict",
    say: "Name a place or system and the interface can suggest catalogued frameworks and crosswalks. It does not determine legal applicability or replace jurisdiction-specific review.",
    demo: "a hospital in Texas",
    tip: "Type a place or system to explore candidate sources.",
  },
  {
    path: "/try",
    title: "The designed council rules",
    usp: "A local classification demo plus a proposed review design",
    say: "Describe a system to run the local rules demo. It does not convene a live Council, execute independent models, or seal a signed verdict.",
    demo: "We use AI to screen job applicants",
    tip: "Use the output as a prompt for scoped human review, not a compliance ruling.",
  },
  {
    path: "/workbench",
    title: "Council Workbench - the governance floor",
    usp: "A workbench prototype with explicit seal state",
    say: "The workbench demonstrates an artifact workflow. Only an artifact carrying a verifiable signature is signed; fallback browser hashes are not Council review or Ed25519 proof.",
    demo: "Draft an EU AI Act risk classification for an autonomous credit model",
    tip: "Inspect the result's seal kind and provenance before relying on it.",
  },
  {
    path: "/gspc-arena",
    title: "Govern by simulation",
    usp: "Explore scenario and arena concepts before deployment",
    say: "The arena visualizes a scenario workflow. It is not a validated real-world simulation and does not automatically create a GSPC measurement, signed verdict, or ledger anchor.",
    demo: "A fintech in the EU deploying an AI credit-scoring model that approves consumer loans automatically",
    tip: "Type any scenario and hit Run experiment.",
  },
  {
    path: "/world",
    title: "A world-view research canvas",
    usp: "A visual index of catalogued governance sources",
    say: "The map can navigate catalogued jurisdictions and sources. It is not complete world coverage, and each feed must report its own reachable, partial, or offline state.",
    demo: "what governs a hospital AI in Germany?",
    tip: "Ask about any country - the globe flies to it.",
  },
  {
    path: "/watchdog-map",
    title: "The Global AI Watchdog",
    usp: "Public, cryptographic accountability",
    say: "This route demonstrates public incident intake and a map view. It does not claim that every signal is verified, cryptographically logged, or available as a live regional feed.",
    tip: "Treat submitted signals as reports awaiting evidence and review.",
  },
  {
    path: "/status",
    title: "Service status",
    usp: "Reachability and evidence state, without flattening them",
    say: "The status page reports the checks it actually performs. A reachable route does not prove that every protocol, integration, worker, or Council capability is operational.",
  },
  {
    path: "/pricing",
    title: "Inspect the available interfaces",
    usp: "Public verification plus catalogued integration paths",
    say: "That's the walk. I'm bottom-right on every page. Ask about a measurement or a statute and I'll take you there.",
    tip: "Verify the exact MCP tool and endpoint status before installation.",
  },
  {
    path: "/govbench",
    title: "Measured, not modelled",
    usp: "Deterministic instruments — never an LLM judging an LLM",
    say: "This is a measurement surface. Use the current board and linked artifacts for exact counts, methods and states; do not infer that every displayed or catalogued item is signed.",
    tip: "Follow each number to its named evidence artifact.",
  },
  {
    path: "/refutation-ledger",
    title: "We publish our failures",
    usp: "Trust through falsifiability — not adjectives",
    say: "This ledger records public corrections and retractions. Each entry stands only on the evidence it links; an entry is not signed merely because it appears on this page.",
    tip: "Check the cited artifact and limitation for each correction.",
  },
  {
    path: "/drift-audit",
    title: "Regulations move. Check the latest observation.",
    usp: "Versioned observations rather than a timeless claim",
    say: "The drift surface shows available snapshots and deltas. It does not promise complete daily coverage, same-morning detection, or a signature unless the specific record proves those states.",
    tip: "Check source, observation time, digest and limitations.",
  },
  {
    path: "/training",
    title: "Practice and training concepts",
    usp: "Human-in-the-loop learning, without a certification claim",
    say: "The training route contains practice material and proposed update loops. It is not an accredited certification, does not automatically update every learner when law changes, and does not itself establish compliance.",
    tip: "Practice outcomes remain separate from admitted GSPC measurements.",
  },
  {
    path: "/pricing",
    title: "The flywheel",
    usp: "Free to learn, enterprise to prove",
    say: "Last stop: review the published product and price states. User activity does not automatically generate admitted measurements, and payment availability must be verified at checkout.",
    tip: "Choose only an offer whose scope, evidence and purchase state are explicit.",
  },
];

const A = "sov_tour_active", S = "sov_tour_step", SEEN = "sov_tour_seen";

// Topic lenses — a surface (e.g. CesiumPortalCard) can start the tour at the
// step its visitor actually cares about instead of always at the beginning.
// Values are indexes into TOUR: 1=/os, 3=/try, 7=/watchdog-map.
export const TOUR_TOPICS: Record<string, number> = {
  os: 1,          // the Council OS tool floor
  measurement: 3, // the designed council rules on a real scenario
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
