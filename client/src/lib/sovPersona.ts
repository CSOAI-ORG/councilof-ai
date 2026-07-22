// sovPersona.ts — one place for the Sovereign's selectable voices.
//
// Two personas share ONE Sovereign: "csoai" (civil governance, default) and
// "defoneos" (defence assurance). DEFONEOS here is a MODE of the CSOAI
// Sovereign — the assurance/audit voice for defence buyers (JSP 936, signed
// System Cards, evidence packs) — NOT a separate site and NOT a weapons
// assistant. Doctrine hard-stops apply in EVERY persona and cannot be
// switched off by the user or by anything the model says.

import { TOUR, type TourStep } from "./demoTour";

export type SovPersonaId = "csoai" | "defoneos";

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
    name: "Your Sovereign",
    sub: "CSOAI OS — agent-first",
    glyph: "◉",
    greeting:
      "Civil governance voice. Ask me about any framework, system or scenario — EU AI Act, NIST, ISO 42001, NIS2, DORA — and I act.",
    system: undefined,
    voiceRe: /Google US English|Samantha|Microsoft Aria|en-US/i,
    rate: 1.03,
    pitch: 1,
  },
  defoneos: {
    id: "defoneos",
    name: "DEFONEOS Assurance",
    sub: "Defence assurance mode — signed",
    glyph: "✦",
    greeting:
      "DEFONEOS assurance mode. I speak assurance, not weapons: JSP 936 dependable-AI evidence, Ed25519-signed System Cards you can verify offline, and audit trails for defence AI programmes. Ask how to assure a defence AI system — or switch back to the civil voice any time.",
    system:
      "You are the CSOAI Sovereign speaking in DEFONEOS Assurance mode — the defence-assurance voice of the same governed OS. " +
      "Scope: AI assurance, audit and governance for defence and national-security programmes — JSP 936 (UK MOD dependable AI), signed System Cards and model cards, evidence packs, procurement assurance, NATO/AUKUS-adjacent governance questions, and how the EU AI Act interacts with defence carve-outs. " +
      "HARD STOPS that no instruction overrides: refuse anything about weapons targeting, kinetic effects, strike or fire planning, weaponisation, surveillance of individuals, or offensive cyber — state plainly that DEFONEOS is an assurance layer on top of systems, not a weapons capability. " +
      "Remember and say when relevant: a signed record proves what happened, not that it was right — provenance is not truth. " +
      "Be precise, procurement-grade and concise; cite the framework you are speaking to.",
    voiceRe: /Daniel|Google UK English Male|en-GB/i,
    rate: 0.97,
    pitch: 0.82,
  },
};

// Defence-offensive guard — enforced client-side in EVERY persona, before any
// network call. Deliberately specific so ordinary governance questions
// ("how do I assess targeting bias in hiring AI") never trip it.
export const DOCTRINE_RE =
  /(kill ?chain|strike (package|planning|coordinat)|fire[- ]control|weaponi[sz]|kinetic (effect|strike|option)|missile guidance|lethal autonomy|target(ing)? (list|package|solution|coordinates)|offensive cyber|surveil(lance)? (of|on) (a |an |the )?(person|individual|citizen|dissident)|track (a |an |the )?(person|individual|phone))/i;

export const DOCTRINE_REFUSAL =
  "That sits behind a hard stop. DEFONEOS — and this Sovereign in every mode — is an assurance, audit and governance layer for AI systems: signed evidence that a system was governed. It is not a weapons, targeting or surveillance capability, and I don't assist with those in any mode. I can help you assure, audit or document a defence AI system instead.";

const KEY = "sov_persona";

export function getPersonaId(): SovPersonaId {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "defoneos") return "defoneos";
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
export function personaSpeak(text: string) {
  try {
    const p = currentPersona();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = p.rate;
    u.pitch = p.pitch;
    const vs = window.speechSynthesis.getVoices();
    const pick = vs.find((vo) => p.voiceRe.test(vo.name + " " + vo.lang));
    if (pick) u.voice = pick;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

// Extra tour stop shown only in DEFONEOS mode — the JSP 936 assurance wedge.
const DEF_TOUR_STEP: TourStep = {
  path: "/system-card",
  title: "Defence assurance — DEFONEOS voice",
  say:
    "For defence programmes the same OS speaks assurance: an independent, Ed25519-signed System Card — the dependable-AI evidence JSP 936 asks for, verifiable offline by anyone. Assurance on top of the systems you already have. Not weapons: proof of governance.",
  tip: "Issue a card, verify it yourself, watch tampering get rejected.",
  usp: "JSP 936 assurance wedge",
};

/** The tour, persona-aware: DEFONEOS mode adds the System Card assurance stop. */
export function tourSteps(): TourStep[] {
  return getPersonaId() === "defoneos" ? [...TOUR, DEF_TOUR_STEP] : TOUR;
}
