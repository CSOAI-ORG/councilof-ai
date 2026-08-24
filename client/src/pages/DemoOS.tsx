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
