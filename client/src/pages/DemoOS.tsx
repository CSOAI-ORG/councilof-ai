import { useEffect, useRef, useState } from "react";
import AISystemNotice from "../components/AISystemNotice";
import { personaSpeak, stopVoice } from "../lib/sovPersona";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Council assistant narrates step by step
// (typed + voice); live SaaS windows glide open, tile like a real desktop, and
// close on the globe; the Council assistant is screen-aware and moves windows aside;
// the user can barge in by voice any time. Doubles as SOV33 training.

import TrustMarquee from "../components/TrustMarquee";
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
];
