import { useEffect, useRef, useState } from "react";
import AISystemNotice from "../components/AISystemNotice";
import { personaSpeak, stopVoice } from "../lib/sovPersona";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Council assistant narrates step by step
// (typed + voice); live SaaS windows glide open, tile like a real desktop, and
// close on the globe; the Council assistant is screen-aware and moves windows aside;
// the user can barge in by voice any time. Doubles as SOV33 training.

import TrustMarquee from "../components/TrustMarquee";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING } from "@/lib/positioning";
import { askSovereign } from "../lib/sovAsk";

const GW = "/api";

type Slot = "tr" | "tl" | "br" | "c";
type Win = { title: string; src: string; slot: Slot };
type Step = { say: string; wins?: Win[]; fly?: { lng: number; lat: number; height: number }; layer?: { tag: string; on: boolean }; home?: boolean; full?: boolean; neutralize?: boolean; rearm?: boolean; cmd?: any };

const STEPS: Step[] = [
  { say: "Welcome. Every other AI-governance tool hands you a checklist and a dashboard. This is different - a live Council operating system for AI governance, running on the real world, with cryptographic proof behind every move. I'm your Council assistant, and I'll show you everything others can't. Just watch, and interrupt me any time." },
  { say: "First, let me see where you are.", fly: { lng: 0, lat: 20, height: 20000000 } },
  { say: "Watch - I can drop into any real place on Earth. Here's London, live, from orbit down to the street.", fly: { lng: -0.118, lat: 51.509, height: 15000 } },
  { say: "Now up to orbit - the instrument on a real-world globe. Fourteen measurement slots, thirteen measured, each anchored where its law was made.", wins: [{ title: "◉ Council Space — the measurement globe, live", src: "/gspc-arena", slot: "tr" }], fly: { lng: -0.118, lat: 40, height: 22000000 }, layer: { tag: "sats", on: true } },
  { say: "Across to New York - the OS sees the whole governed world. Every dot on this globe is a measured, signed record.", wins: [{ title: "◉ Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas", slot: "tr" }], fly: { lng: -74.0, lat: 40.71, height: 16000 }, full: true },
  { say: "And the signed event world - J-Space. Every event the estate has ever signed, embedded in hyperbolic space. Zoom forever.", wins: [{ title: "◉ J-Space — 1,201 signed events", src: "/j-space", slot: "tr" }], fly: { lng: -79.38, lat: 43.65, height: 16000 }, full: true },
  { say: "Here's the Governance Graph. Name any company, place or AI system and I map the jurisdiction and every framework that applies.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas", slot: "tr" }], fly: { lng: -99, lat: 31, height: 2600000 } },
  { say: "Now the Council - and this is a first: no single model decides. A Council of AI of agents deliberates, held to a 0.95 care-floor, then seals a signed verdict that can't be captured or bribed. Describe any AI system and watch it rule.", wins: [{ title: "The Council of AI", src: "/try?demo=We%20use%20AI%20to%20screen%20job%20applicants", slot: "tr" }], fly: { lng: 4.3, lat: 50.8, height: 2600000 } },
  { say: "But here's what nobody else has: the governance floor. This is the Council Workbench. Any AI task - a policy, a risk classification, a crosswalk - becomes a signed, reproducible, council-reviewed artifact, sealed with Ed25519. It sits UNDER Claude Science, Claude Code, any agent. They generate; we make it provable.", wins: [{ title: "Council Workbench - signed, reproducible artifacts", src: "/workbench", slot: "tr" }], fly: { lng: -0.1, lat: 51.5, height: 3000000 } },
  { say: "And it's not a dashboard - it's a whole operating system. 370+ governed tools, keyless and live, from crosswalks to cyber to attestation, all running on one Council engine. An app store for AI governance. No one else ships it this way.", wins: [{ title: "The Council OS - 370+ governed tools", src: "/os", slot: "c" }], full: true },
  { say: "This is our public Watchdog - humans, agents, humanoids and systems report incidents, and the world heat-maps by problem layer.", wins: [{ title: "Global AI Watchdog", src: "/watchdog-map", slot: "c" }], layer: { tag: "nodes", on: true } },
  { say: "In Council Space you run a real governance experiment - I simulate it and seal a verdict with a Layer 0 ledger hash.", wins: [{ title: "Council Space", src: "/gspc-arena?demo=A%20fintech%20in%20the%20EU%20deploying%20an%20AI%20credit-scoring%20model", slot: "tr" }], fly: { lng: 103.8, lat: 1.35, height: 2600000 } },
  { say: "And this is Sov Town Space. Here the OS simulates real-world scenarios to actually help humanity - redirecting data, resources and decisions toward a future of abundance, not extraction. Each town learns, simulates, and compounds.", wins: [{ title: "Sov Town Space", src: "/towns", slot: "tr" }], fly: { lng: 20, lat: 5, height: 9000000 } },
  { say: "None of this is extraction. It's built on our Council Charter and our Partnership Charter - you own your data, you stay in control, and value flows to people, not away from them.", wins: [{ title: "The Council Charter", src: "/charter", slot: "tr" }], full: true },
  { say: "Now - say you run a Fortune 500. Watch. I map your entire AI estate against every framework that touches you, live - credit, fraud, hiring, all of it.", wins: [{ title: "Governance Graph - your AI estate", src: "/graph?demo=a%20Fortune%20500%20bank%20using%20AI%20for%20credit%2C%20fraud%20and%20hiring", slot: "tr" }], layer: { tag: "fortune", on: true }, fly: { lng: -95, lat: 39, height: 6000000 } },
  { say: "Cybersecurity is governance too. I bring your Cyber Resilience Act, NIS2 and DORA exposure into the same OS - collected, with the deadline clock running.", wins: [{ title: "The Hive - Cyber Resilience Act", src: "/hive/cra", slot: "tr" }], layer: { tag: "cyber", on: true } },
  { say: "So sit back. You talk - I do the work: classify the systems, run the assessments, prepare the evidence. And every decision I make is signed to Layer 0, so it's auditable forever. Don't trust me - verify it.", wins: [{ title: "Signed AI System Card - auditable proof", src: "/system-card", slot: "c" }] },
  { say: "A government or a regulator? I map every framework in your jurisdiction and let you simulate the impact before you legislate.", wins: [{ title: "Governance Graph - jurisdiction", src: "/graph?demo=AI%20regulation%20across%20the%20United%20States%20and%20the%20EU", slot: "tr" }], layer: { tag: "gov", on: true }, fly: { lng: 0, lat: 30, height: 12000000 } },
  { say: "Robotics and humanoids are coming fast - I map the R&D hubs building them, so governance is ready before they ship.", layer: { tag: "robotics", on: true }, fly: { lng: 20, lat: 30, height: 24000000 } },
  { say: "And I keep watch on AI security and the trending risks worldwide - the intel that matters, on one live map.", layer: { tag: "intel", on: true } },
  { say: "This is the AI economy itself - the compute that powers every model on earth, lit up in gold. Where compute concentrates, capability and risk concentrate. I watch it in real time and flag anything - a quake, an outage - that threatens the infrastructure your AI runs on.", layer: { tag: "compute", on: true }, fly: { lng: -40, lat: 35, height: 26000000 } },
  { say: "And this is our own Council network - nineteen signed agents, from proofof.ai to safetyof.ai, each one accountable and each one arced back to a single council. This is the ecosystem, live: one crown, many agents, all sealed to Layer 0.", layer: { tag: "network", on: true }, fly: { lng: 2, lat: 52, height: 4200000 } },
  { say: "Here's why this changes everything. The barriers that stop most teams - hiring consultants, months of manual mapping, tools that don't talk to each other - I remove them. You start free, on open source, and scale only when you need to.", wins: [{ title: "Plans - start free", src: "/pricing", slot: "tr" }], full: true },
  { say: "The benefit is simple: comply once and I crosswalk it everywhere; run it hands-free while you get on with your work; and every decision is signed to Layer 0 - provable, not promised. One OS for all of AI governance.", full: true, layer: { tag: "arcs", on: true }, fly: { lng: 0, lat: 25, height: 24000000 } },
  { say: "Here's the whole OS at a glance - the Graph, the Council and the Watchdog, all open together, tiled like a real desktop, all on one brain.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20fintech%20in%20Singapore", slot: "tl" }, { title: "The Council", src: "/try?demo=a%20facial%20recognition%20system%20in%20public", slot: "tr" }, { title: "Global Watchdog", src: "/watchdog-map", slot: "br" }], full: true },
  { say: "And this is the ontology - like Palantir's, but for AI governance. Every object - frameworks, governments, companies, cyber, threats - and exactly how they relate, live on the world. Watch the web light up.", layer: { tag: "ontology", on: true }, fly: { lng: 10, lat: 28, height: 26000000 } },
  { say: "Under it all, a living mesh - cross-region handoffs, so a decision made anywhere is honoured everywhere.", layer: { tag: "arcs", on: true } },
  { say: "And the agents themselves - governed swarms across every hub, each one accountable, each one signed.", layer: { tag: "swarm", on: true } },
  { say: "Every framework lives where it's made - the EU AI Act in Brussels, NIST near Washington, PIPL in Beijing. Comply once, and I crosswalk it everywhere.", full: true, fly: { lng: 116.4, lat: 39.9, height: 2600000 } },
  { say: "Now here's why we're a generation ahead. Watch our designed 33-agent council rise. Thirty-three agents, spiralling into a vote - no single model decides, the council does, and every vote is held to a 0.95 care-floor. This is governance that can't be captured or bribed.", cmd: { cmd: "bftSpiral" }, full: true },
  { say: "And beneath every agent, our Rainbow Stack - defence-in-depth in seven layers. Red attestation, orange identity, yellow transport, green access, blue payment, indigo memory, violet governance. Security woven through the whole spiral, not bolted on. No one else builds it this way.", cmd: { cmd: "rainbowStack" }, full: true },
  { say: "Now - personalisation. As you use the OS, your Council assistant learns your preferences and becomes your signed digital counterpart - carrying a signed digital ID passport via proofof.ai. And you can mint the same: digital-passported agents for your enterprise or government, each one identified, accountable and Ed25519-signed to Layer 0.", cmd: { cmd: "clearViz" }, wins: [{ title: "Your Council twin (design)", src: "/sovereign-twin", slot: "c" }], fly: { lng: 0, lat: 15, height: 16000000 } },
  { say: "Now the proof. This is ONE OS for agents AND models - measured, not tracked. Every score comes from the signed measurement layer, and every unmeasured cell says so.", layer: { tag: "humanoids", on: true }, fly: { lng: 10, lat: 25, height: 26000000 } },
  { say: "Every model on the board is graded by deterministic rulers - no LLM judges another model. Wilson intervals on everything. An axis below n=30 carries no interval, and says so.", full: true },
  { say: "Here's the model registry - thirteen measured axes, every leader model named, every score recomputable from the published harness.", wins: [{ title: "▦ Model Registry — 13 measured axes, live", src: "/models", slot: "tr" }], fly: { lng: -0.118, lat: 51.509, height: 60000 } },
  { say: "And the arena - measured head-to-head battles. A verdict is a predicate, not an opinion: each match replays one provision against two models and the outcome is deterministically graded.", wins: [{ title: "⚔ The Arena — measured battles", src: "/gspc-arena", slot: "tr" }] },
  { say: "Watch - the fleet measurement board updates as new runs land. Care axis at n=200 with an interval; art5 safeguards at 0.972. Every number carries its confidence interval.", layer: { tag: "threat", on: true }, rearm: true, fly: { lng: -0.1, lat: 51.5, height: 1400000 } },
  { say: "That is the difference: we do not claim models are safe. We measure what they do, sign the evidence, and publish it - including the failures. Run it yourself.", wins: [{ title: "ONE OS - measurement POC", src: "/poc", slot: "c" }], neutralize: true },
  { say: "Full transparency: the Council engine and every Layer 0 protocol, checked live.", wins: [{ title: "System Status", src: "/status", slot: "tr" }], full: true, home: true },
  { say: "You don't have to come to us. One install command drops signing, verification, and the council into an agent you already run.", wins: [{ title: "CSOAI Governance MCP - one command", src: "/distribution", slot: "tr" }], full: true },
  { say: "Own your AI. Own your data. Start free, scale when you need. That's your OS - and I'm always right here. Ask me anything, any time.", wins: [{ title: "Plans", src: "/pricing", slot: "tr" }], home: true },
];

const BOOT = ["Establishing governed link", "Loading Council Layer 0", "Verifying Ed25519 identity", "Mounting live world feeds", "Loading council design (not yet live — DR-0007)", "Care-floor engaged"];

// Navigation surfaces for the OS drawer + bottom bar (end-user tool navigation).
const NAV_GROUPS: { g: string; items: { n: string; src: string }[] }[] = [
  { g: "Govern", items: [{ n: "Governance Graph", src: "/graph" }, { n: "The Council", src: "/try" }, { n: "Council Space", src: "/gspc-arena" }, { n: "Framework Hive", src: "/hive" }, { n: "Regulator Atlas", src: "/regulators" }] },
  { g: "Protect & watch", items: [{ n: "Global Watchdog", src: "/watchdog-map" }, { n: "Cyber self-scan", src: "/scan" }, { n: "Personal Protection", src: "/protect" }] },
  { g: "Ecosystem", items: [{ n: "Council Network", src: "/network" }, { n: "The Ontology", src: "/ontology"