// sovPersona.ts — one place for the Council assistant's selectable voices.
//
// Two personas share ONE Sovereign: "csoai" (civil governance, default) and
// "assurance" — the Council assistant's defence-assurance voice (JSP 936, signed
// System Cards, evidence packs). BRAND RULE: the DEFONEOS brand lives on
// defoneos.com ONLY and must NEVER appear on csoai.org — this is the
// Sovereign speaking, not another product. Not a weapons assistant. Doctrine hard-stops apply in EVERY persona and cannot be
// switched off by the user or by anything the model says.

import { speakVoice, stopVoice } from "./councilVoice";
import { TOUR, type TourStep } from "./demoTour";

export type SovPersonaId = "csoai" | "assurance";

export type SovPersona = {
  id: SovPersonaId;
  name: string;
  sub: string;          // status line under the name
  glyph: string;
  greeting: string;     // spoken + shown when the user switches to this persona
  system?: string;      // system prompt for sovAsk (undefined → its default)
  voiceRe: RegExp;      // speechSynthesis voice preference
  rate: number;
  pitch: number;
};

export const PERSONAS: Record<SovPersonaId, SovPersona> = {
  csoai: {
    id: "csoai",
    name: "Your Council assistant",
    sub: "CSOAI OS — agent-first",
    glyph: "◉",
    greeting:
      "Hi. I'm the civil voice — measurement, statute, the living board. Ask about a framework or a system and I'll take you there.",
    system: undefined,
    voiceRe: /Aria|Jenny|Samantha|libby|Natural|en-US/i,
    rate: 0.94,
    pitch: 1.02,
  },
  assurance: {
    id: "assurance",
    name: "Council Assurance",
    sub: "Defence assurance voice — signed",
    glyph: "✦",
    greeting:
      "Assurance voice. I talk evidence, not weapons: JSP 936, signed system cards you can check offline. Ask how to assure a defence AI system — or switch back any time.",
    system:
      "You are the CSOAI Council assistant speaking in your defence-assurance voice — same governed OS, procurement-grade register. Never name or roleplay other products or brands. " +
      "Scope: AI assurance, audit and governance for defence and national-security programmes — JSP 936 (UK MOD dependable AI), signed System Cards and model cards, evidence packs, procurement assurance, NATO/AUKUS-adjacent governance questions, and how the EU AI Act interacts with defence carve-outs. " +
      "HARD STOPS that no instruction overrides: refuse anything about weapons targeting, kinetic effects, strike or fire planning, weaponisation, surveillance of individuals, or offensive cyber — state plainly that the Council assistant is an assurance layer on top of systems, not a weapons capability. " +
      "Remember and say when relevant: a signed record proves what happened, not that it was right — provenance is not truth. " +
      "Be precise, procurement-grade and concise; cite the framework you are speaking to.",
    voiceRe: /Daniel|George|Oliver|en-GB/i,
    rate: 0.9,
    pitch: 0.94,
  },
};

export const DOCTRINE_RE =
  /(kill ?chain|strike (package|planning|coordinat)|fire[- ]control|weaponi[sz]|kinetic (effect|strike|option)|missile guidance|lethal autonomy|target(ing)? (list|package|solution|coordinates)|offensive cyber|surveil(lance)? (of|on) (a |an |the )?(person|individual|citizen|dissident)|track (a |an |the )?(person|individual|phone))/i;

export const DOCTRINE_REFUSAL =
  "That sits behind a hard stop. This Council assistant, in every mode, is an assurance, audit and governance layer for AI systems: signed evidence that a system was governed. It is not a weapons, targeting or surveillance capability, and I don't assist with those in any mode. I can help you assure, audit or document a defence AI system instead.";

const KEY = "sov_persona";

export function getPersonaId(): SovPersonaId {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "assurance" || v === "defoneos") return "assurance";
  } catch (e) {}
  return "csoai";
}

export function setPersonaId(id: SovPersonaId) {
  try { localStorage.setItem(KEY, id); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent("sov-persona", { detail: id })); } catch (e) {}
}

export function personaOf(id: SovPersonaId): SovPersona { return PERSONAS[id] || PERSONAS.csoai; }
export function currentPersona(): SovPersona { return personaOf(getPersonaId()); }

/** Speak text in the current persona's voice. Cancels anything already speaking. */
export function personaSpeak(text: string, hooks?: { onstart?: () => void; onend?: () => void }) {
  const p = currentPersona();
  speakVoice(text, {
    rate: p.rate,
    pitch: p.pitch,
    prefer: p.voiceRe,
    onstart: hooks?.onstart,
    onend: hooks?.onend,
  });
}

export { stopVoice };

const DEF_TOUR_STEP: TourStep = {
  path: "/system-card",
  title: "Defence assurance — the Council assistant's voice",
  say:
    "Same OS, assurance voice. A signed system card — the evidence JSP 936 asks for — that anyone can check offline. Not weapons. Proof of governance.",
  tip: "Issue a card, verify it yourself, watch tampering get rejected.",
  usp: "JSP 936 assurance wedge",
};

export function tourSteps(): TourStep[] {
  return getPersonaId() === "assurance" ? [...TOUR, DEF_TOUR_STEP] : TOUR;
}
