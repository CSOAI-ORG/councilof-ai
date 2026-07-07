// sovAsk.ts — one place every "Ask the Sovereign" box goes through.
//
// Fixes the cross-page weirdness where the live brain sometimes answered as a
// generic "companion" persona (even name-dropping other vendors) or returned a
// care-model refusal. We (1) frame every call as the CSOAI Sovereign, and
// (2) reject persona-bleed / refusal responses and hand back a clean fallback.

import { detectLocale } from "./locale";

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";

// Respond in the visitor's language (the conversation localizes; regulatory names stay canonical).
const LANG_NAMES: Record<string, string> = { ja: "Japanese", de: "German", fr: "French", es: "Spanish", ko: "Korean", zh: "Chinese", it: "Italian", pt: "Portuguese", nl: "Dutch" };
function langDirective(): string {
  try { const l = detectLocale().lang; return LANG_NAMES[l] ? ` Respond in ${LANG_NAMES[l]}. Keep regulation names (EU AI Act, NIST, ISO 42001, DORA, NIS2) and any structured labels (e.g. RISK TIER, WHY, OBLIGATIONS) in English; translate the surrounding prose.` : ""; } catch { return ""; }
}

const SYS =
  "You are the CSOAI Sovereign — the AI-governance and cybersecurity assistant inside the CSOAI Sovereign OS. " +
  "Answer strictly in that role: specific and practical, about AI governance, regulations (EU AI Act, NIST, ISO 42001, NIS2, DORA, GDPR), cybersecurity, or the user's system/scenario. " +
  "Do NOT role-play as a personal 'companion', do NOT describe yourself in poetic/emotional terms, do NOT mention other companies' products or personas, and do NOT refuse ordinary informational questions. " +
  "If a question is out of scope, briefly steer it back to AI governance. Keep it concise.";

// Persona-bleed / refusal / care-model patterns we must never surface.
const BAD = /(i['’]?m sorry[, ]|can['’]?t help with that|i cannot help|i can['’]?t assist|as an ai language model|remembering companion|walks beside you|companion who|gentle prose|quiet,? remembering|i['’]?m a .*companion|credo ai|i tend to focus|travell?er|fellow travell?er|on your journey|here (for|with) you|hold space|dear friend|my friend|kindred|wander)/i;

export type AskResult = { ok: boolean; text: string };

/** Ask the CSOAI Sovereign. Returns cleaned text, or ok:false with a fallback string. */
export async function askSovereign(userText: string, opts?: { fallback?: string; system?: string }): Promise<AskResult> {
  const q = (userText || "").trim();
  const fallback = (opts && opts.fallback) || "I can only speak as the CSOAI Sovereign on AI governance, regulation and cybersecurity — ask me about a framework, a system, or how to get compliant and I'll help.";
  if (!q) return { ok: false, text: fallback };
  try {
    const sys = ((opts && opts.system) || SYS) + langDirective();
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: sys + "\n\nUser question: " + q }) });
    if (r.ok) {
      const d = await r.json();
      const t = String((d && d.response) || "").trim();
      if (t && d.model !== "idle" && !BAD.test(t) && t.length > 12) return { ok: true, text: t };
    }
  } catch (e) {}
  return { ok: false, text: fallback };
}

/** True if a raw brain response looks like persona-bleed or a refusal (for callers doing their own fetch). */
export function isBadSovResponse(t: string): boolean {
  return !t || BAD.test(t);
}
