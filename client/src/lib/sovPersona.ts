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

// ---------------------------------------------------------------------------
// CSOAI × MEOK Professional Staff PALS (csoai.meok-professional-staff-pals/1.0)
// MEOK is the face; CSOAI is the mind.
// ---------------------------------------------------------------------------

export type StaffPalId =
  | "pal.welcome_desk"
  | "pal.measurement_lead"
  | "pal.assurance_counsel"
  | "pal.regulatory_steward"
  | "pal.runtime_sentinel"
  | "pal.commercial_concierge";

export type StaffPal = {
  palId: StaffPalId;
  displayName: string;
  title: string;
  department: string;
  personaMode: SovPersonaId;
  glyph: string;
  kokoroVoiceId: string;
  voiceRe: RegExp;
  rate: number;
  pitch: number;
  avatarRigId: string;
  greeting: string;
  identifyPrompt: string;
  primaryWedges: string[];
  councilSeats: string[];
  busabaseRecordId: string;
};

export const STAFF_PALS: Record<StaffPalId, StaffPal> = {
  "pal.welcome_desk": {
    palId: "pal.welcome_desk",
    displayName: "Clara Vance",
    title: "Front Desk & Client Onboarding Director",
    department: "CSOAI Welcome Desk & H.I.M. Identity Liaison",
    personaMode: "csoai",
    glyph: "◉",
    kokoroVoiceId: "bf_emma",
    voiceRe: /Aria|Jenny|Samantha|libby|Natural|en-GB|en-US/i,
    rate: 0.95,
    pitch: 1.02,
    avatarRigId: "meok.avatar.staff.clara_vance.v1",
    greeting:
      "Welcome to the Council of AI. I'm Clara Vance at the CSOAI Front Desk. How can I help you today?",
    identifyPrompt:
      "What's your name and business? I ask once so MEOK keeps your governed thread across Web, TV, and your IDE or chat plugins — and you can view, export, or delete that memory at any time.",
    primaryWedges: ["W1_Qualification", "W2_Card_Signing"],
    councilSeats: ["queen.comms", "queen.diplomacy"],
    busabaseRecordId: "recmv93idvrxzaiiay",
  },
  "pal.measurement_lead": {
    palId: "pal.measurement_lead",
    displayName: "Dr. Julian Mercer",
    title: "Chief Measurement & GSPC Board Officer",
    department: "GSPC 23-Axis Living Board & Evidence Verification",
    personaMode: "csoai",
    glyph: "◈",
    kokoroVoiceId: "bm_george",
    voiceRe: /George|Arthur|Oliver|Daniel|en-GB/i,
    rate: 0.93,
    pitch: 0.98,
    avatarRigId: "meok.avatar.staff.julian_mercer.v1",
    greeting:
      "I'm Dr. Julian Mercer, Chief Measurement Officer for the 23-axis GSPC board. We publish deterministic facts and Ed25519-signed 3KB evidence cards — never LLM-as-judge grades or paid certificates.",
    identifyPrompt:
      "Tell me your name, organisation, and the model or system you want measured or verified on the GSPC board.",
    primaryWedges: ["W1_Qualification", "W2_Card_Signing", "W6_Remediation_Gate"],
    councilSeats: ["queen.audit", "queen.research", "queen.education"],
    busabaseRecordId: "recmv93idjawp6v31t",
  },
  "pal.assurance_counsel": {
    palId: "pal.assurance_counsel",
    displayName: "Marcus Sterling",
    title: "Defence & Sovereign Assurance Director",
    department: "JSP 936, Signed System Cards & High-Assurance Runtime Evidence",
    personaMode: "assurance",
    glyph: "✦",
    kokoroVoiceId: "bm_daniel",
    voiceRe: /Daniel|George|Oliver|en-GB/i,
    rate: 0.90,
    pitch: 0.94,
    avatarRigId: "meok.avatar.staff.marcus_sterling.v1",
    greeting:
      "Marcus Sterling, Defence & Sovereign Assurance. I speak to evidence, not weapons: JSP 936 dependability artefacts, signed System Cards verifiable offline, and OpenShell admission receipts.",
    identifyPrompt:
      "Please share your name, programme or organisation, and the assurance boundary you are documenting.",
    primaryWedges: ["W2_Card_Signing", "W4_Runtime_Sentinel", "W6_Remediation_Gate"],
    councilSeats: ["queen.defense", "queen.health"],
    busabaseRecordId: "recmv93idv989bbja1",
  },
  "pal.regulatory_steward": {
    palId: "pal.regulatory_steward",
    displayName: "Elena Rostova",
    title: "EU AI Act, Standards & IETF SCITT Liaison",
    department: "Statutory Crosswalks (12 Frameworks) & SCITT Transparency Capsules",
    personaMode: "csoai",
    glyph: "§",
    kokoroVoiceId: "bf_isabella",
    voiceRe: /Isabella|Serena|Fiona|Samantha|en-GB|en-US/i,
    rate: 0.94,
    pitch: 1.00,
    avatarRigId: "meok.avatar.staff.elena_rostova.v1",
    greeting:
      "I'm Elena Rostova, Standards & Regulatory Liaison. I map GSPC measurement receipts to EU AI Act Article 50, ISO 42001, NIST AI RMF, DORA, and IETF SCITT capsules — providing factual technical evidence without legal certification.",
    identifyPrompt:
      "What is your name, organisation, and the jurisdiction or standard (such as EU AI Act Art. 50 or SCITT) you are preparing evidence for?",
    primaryWedges: ["W2_Card_Signing", "W3_Supply_Chain", "W5_Regulatory_Evidence"],
    councilSeats: ["queen.governance", "queen.justice", "queen.environment"],
    busabaseRecordId: "recmv93idz1auaatg8",
  },
  "pal.runtime_sentinel": {
    palId: "pal.runtime_sentinel",
    displayName: "Dev Patel",
    title: "Layer O, Harness X & OpenShell Systems Architect",
    department: "Portable Agent Plugins, Quicksand Sandboxes & SovSpace Blast-Radius",
    personaMode: "csoai",
    glyph: "⬡",
    kokoroVoiceId: "bm_lewis",
    voiceRe: /Lewis|Rishi|Daniel|Alex|en-GB|en-US/i,
    rate: 0.96,
    pitch: 0.99,
    avatarRigId: "meok.avatar.staff.dev_patel.v1",
    greeting:
      "Dev Patel here — Layer O & Harness X Architecture. I help you connect our portable plugin across Claude, ChatGPT, Cursor, and Copilot, qualify tools in Quicksand ephemeral sandboxes, and inspect SovSpace dependency impact.",
    identifyPrompt:
      "What's your name, engineering team, and the runtime or agent platform you are wiring into Layer O?",
    primaryWedges: ["W3_Supply_Chain", "W4_Runtime_Sentinel", "W6_Remediation_Gate"],
    councilSeats: ["queen.architecture", "queen.culture"],
    busabaseRecordId: "recmv93idxgqz0dfp1",
  },
  "pal.commercial_concierge": {
    palId: "pal.commercial_concierge",
    displayName: "Hannah Chen",
    title: "Catalog Base, x402 Settlement & Enterprise Desk",
    department: "Transparent Pricing, x402 Agentic Doors & Buyer Delivery Receipts",
    personaMode: "csoai",
    glyph: "◇",
    kokoroVoiceId: "af_sarah",
    voiceRe: /Sarah|Ava|Victoria|Samantha|en-US|en-GB/i,
    rate: 0.95,
    pitch: 1.01,
    avatarRigId: "meok.avatar.staff.hannah_chen.v1",
    greeting:
      "Hi, I'm Hannah Chen at the Commercial & x402 Desk. Verification is free forever; paid tiers ($99/$399 and x402 metered doors) fund compute and evidence packaging, and never alter a measurement or buy a grade.",
    identifyPrompt:
      "May I have your name and business so I can match you to the right catalog tier or x402 evidence door?",
    primaryWedges: ["W1_Qualification", "W2_Card_Signing", "W5_Regulatory_Evidence"],
    councilSeats: ["queen.finance"],
    busabaseRecordId: "recmv93ids57p703ce",
  },
};

const STAFF_PAL_KEY = "csoai_active_staff_pal";
const HIM_IDENTITY_KEY = "csoai_meok_him_identity_v1";

export function getActiveStaffPalId(): StaffPalId {
  try {
    const v = localStorage.getItem(STAFF_PAL_KEY) as StaffPalId | null;
    if (v && v in STAFF_PALS) return v;
  } catch (e) {}
  return getPersonaId() === "assurance" ? "pal.assurance_counsel" : "pal.welcome_desk";
}

export function setActiveStaffPalId(id: StaffPalId) {
  const pal = STAFF_PALS[id] || STAFF_PALS["pal.welcome_desk"];
  try {
    localStorage.setItem(STAFF_PAL_KEY, pal.palId);
  } catch (e) {}
  setPersonaId(pal.personaMode);
  try {
    window.dispatchEvent(new CustomEvent("csoai-staff-pal", { detail: pal.palId }));
  } catch (e) {}
}

export function getActiveStaffPal(): StaffPal {
  return STAFF_PALS[getActiveStaffPalId()] || STAFF_PALS["pal.welcome_desk"];
}

export function staffPalSpeak(
  text: string,
  palId?: StaffPalId,
  hooks?: { onstart?: () => void; onend?: () => void },
) {
  const pal = (palId && STAFF_PALS[palId]) || getActiveStaffPal();
  speakVoice(text, {
    rate: pal.rate,
    pitch: pal.pitch,
    prefer: pal.voiceRe,
    onstart: hooks?.onstart,
    onend: hooks?.onend,
  });
}

export function routeUtteranceToStaffPal(utterance: string): {
  refused: boolean;
  refusalMessage?: string;
  pal: StaffPal;
} {
  const q = (utterance || "").trim();
  if (DOCTRINE_RE.test(q)) {
    return {
      refused: true,
      refusalMessage: DOCTRINE_REFUSAL,
      pal: STAFF_PALS["pal.assurance_counsel"],
    };
  }
  if (/\b(jsp ?936|defence|defense|mod\b|nato|aukus|system card|air[- ]?gap)\b/i.test(q)) {
    return { refused: false, pal: STAFF_PALS["pal.assurance_counsel"] };
  }
  if (/\b(eu ai act|article 50|gdpr|dora|nis2|iso ?42001|nist|scitt|ietf|statute|regulation)\b/i.test(q)) {
    return { refused: false, pal: STAFF_PALS["pal.regulatory_steward"] };
  }
  if (/\b(layer ?0|layer ?o|harness ?x|openshell|quicksand|sandbox|plugin|mcp\b|cursor|copilot|sovspace)\b/i.test(q)) {
    return { refused: false, pal: STAFF_PALS["pal.runtime_sentinel"] };
  }
  if (/\b(price|pricing|catalog|x402|modulr|payment|invoice|tier|\$99|\$399)\b/i.test(q)) {
    return { refused: false, pal: STAFF_PALS["pal.commercial_concierge"] };
  }
  if (/\b(gspc|board|axis|axes|measure|3kb|garak|merkle|ed25519|verify)\b/i.test(q)) {
    return { refused: false, pal: STAFF_PALS["pal.measurement_lead"] };
  }
  return { refused: false, pal: STAFF_PALS["pal.welcome_desk"] };
}

export type WelcomeIdentityMemory = {
  visitorName: string;
  businessName: string;
  businessFocus: string;
  activePalId: StaffPalId;
  updatedAt: string;
};

export function getWelcomeIdentity(): WelcomeIdentityMemory | null {
  try {
    const raw = localStorage.getItem(HIM_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.visitorName === "string" && typeof parsed.businessName === "string") {
      return parsed as WelcomeIdentityMemory;
    }
  } catch (e) {}
  return null;
}

export function saveWelcomeIdentity(mem: Omit<WelcomeIdentityMemory, "updatedAt">): WelcomeIdentityMemory {
  const record: WelcomeIdentityMemory = {
    ...mem,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(HIM_IDENTITY_KEY, JSON.stringify(record));
  } catch (e) {}
  return record;
}

export function exportWelcomeIdentity(): string {
  const current = getWelcomeIdentity();
  return JSON.stringify(
    {
      schema: "csoai.meok-him-user-memory-export/1.0",
      exportedAt: new Date().toISOString(),
      ownership: "user_owned_view_export_delete",
      identity: current,
    },
    null,
    2,
  );
}

export function clearWelcomeIdentity(): void {
  try {
    localStorage.removeItem(HIM_IDENTITY_KEY);
  } catch (e) {}
}

