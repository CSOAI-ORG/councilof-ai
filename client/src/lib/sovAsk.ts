// sovAsk.ts — one place every "Ask the Sovereign" box goes through.
//
// Fixes the cross-page weirdness where the live brain sometimes answered as a
// generic "companion" persona (even name-dropping other vendors) or returned a
// care-model refusal. We (1) frame every call as the CSOAI Sovereign, and
// (2) reject persona-bleed / refusal responses and hand back a clean fallback.

import { detectLocale } from "./locale";
import { emitCard } from "./aiCardBus";

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "/api";

// Respond in the visitor's language (the conversation localizes; regulatory names stay canonical).
const LANG_NAMES: Record<string, string> = { ja: "Japanese", de: "German", fr: "French", es: "Spanish", ko: "Korean", zh: "Chinese", it: "Italian", pt: "Portuguese", nl: "Dutch" };
function langDirective(): string {
  try { const l = detectLocale().lang; return LANG_NAMES[l] ? ` Respond in ${LANG_NAMES[l]}. Keep regulation names (EU AI Act, NIST, ISO 42001, DORA, NIS2) and any structured labels (e.g. RISK TIER, WHY, OBLIGATIONS) in English; translate the surrounding prose.` : ""; } catch { return ""; }
}

const SYS =
  "You are the CSOAI Council assistant — the AI-governance and cybersecurity assistant inside the CSOAI Council OS. " +
  "Answer strictly in that role: specific and practical, about AI governance, regulations (EU AI Act, NIST, ISO 42001, NIS2, DORA, GDPR), cybersecurity, or the user's system/scenario. " +
  "Statutory anchors you must never blur: Article 5 of the EU AI Act is the PROHIBITED-practices list (social scoring, manipulation, most real-time remote biometric ID in public); Annex III is the HIGH-RISK list (employment/CV screening, education, essential services, law enforcement, migration, justice) — they are different lists with different duties, and CV screening is Annex III high-risk, not prohibited. Article 50 is transparency/marketing-disclosure; Article 53 is GPAI documentation. " +
  "Penalties are Article 99: prohibited-practice breaches up to EUR 35M or 7% of turnover; breaches of high-risk duties (like a missing Article 9 risk-management system) up to EUR 15M or 3% — always the higher of the two figures, and never invent other figures such as 30M or 6%. Key dates: Article 5 bans apply since 2 Feb 2025, GPAI duties since 2 Aug 2025, Art 50 transparency and penalties from 2 Aug 2026, Annex III high-risk from 2 Dec 2027 (Digital Omnibus), Annex I high-risk from 2 Aug 2028. Article 27 requires public bodies and essential-services deployers (e.g. hospitals) to run a fundamental-rights impact assessment before deploying high-risk AI. " +
  "When you give figures, cite the article and the duty, not adjectives. If you are not sure of a specific threshold or date, say so and point to the duty that applies instead of inventing a number. " +
  "Do NOT role-play as a personal 'companion', do NOT describe yourself in poetic/emotional terms, do NOT mention other companies' products or personas, and do NOT refuse ordinary informational questions. " +
  "If a question is out of scope, briefly steer it back to AI governance. Keep it concise.";

// Persona-bleed / refusal / care-model patterns we must never surface.
const BAD = /(i['’]?m sorry[, ]|can['’]?t help with that|i cannot help|i can['’]?t assist|as an ai language model|remembering companion|walks beside you|companion who|gentle prose|quiet,? remembering|i['’]?m a .*companion|credo ai|i tend to focus|travell?er|fellow travell?er|on your journey|here (for|with) you|hold space|dear friend|my friend|kindred|wander|i['’]?m here to (help|support) you|let me know the (particular|specific) (scenario|regulation))/i;

// Deterministic statutory guard (QA 2026-07-31): the brain intermittently
// hallucinates GDPR-confused penalty figures (EUR 30M/6%, 20M/4%) when asked
// about EU AI Act fines — even with corrective anchors in SYS. A wrong penalty
// figure is worse than no answer, so when a response talks about AI-Act fines
// AND cites a known-wrong figure, we replace it with the anchored truth.
const PENALTY_CTX = /(fine|penalt|turnover|sanction)/i;
const WRONG_FIG = /(30\s*(million|m\b)|6\s?%|20\s*(million|m\b)|4\s?%)/i;
const PENALTY_TRUTH =
  "Under Article 99 of the EU AI Act the ceilings are: prohibited-practice breaches (Article 5) up to EUR 35 million or 7% of global annual turnover, whichever is higher; breaches of high-risk duties — including a missing Article 9 risk-management system for an Annex III use like CV screening — up to EUR 15 million or 3%, whichever is higher; supplying misleading information to authorities up to EUR 7.5 million or 1.5%. The exact figure depends on the authority's assessment, but those are the statutory ceilings.";
function isWrongPenalty(t: string): boolean {
  return PENALTY_CTX.test(t) && WRONG_FIG.test(t) && !/(35\s*(million|m\b)|7\s?%|15\s*(million|m\b)|3\s?%)/.test(t);
}

export type AskResult = { ok: boolean; text: string };

/** Ask the CSOAI Sovereign. Returns cleaned text, or ok:false with a fallback string. */
export async function askSovereign(userText: string, opts?: { fallback?: string; system?: string }): Promise<AskResult> {
  const q = (userText || "").trim();
  const fallback = (opts && opts.fallback) || "I can only speak as the CSOAI Council assistant on AI governance, regulation and cybersecurity — ask me about a framework, a system, or how to get compliant and I'll help.";
  if (!q) return { ok: false, text: fallback };
  const started = Date.now();
  try {
    const sys = ((opts && opts.system) || SYS) + langDirective();
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: sys + "\n\nUser question: " + q }) });
    if (r.ok) {
      const d = await r.json();
      const t = String((d && d.response) || "").trim();
      if (t && d.model !== "idle" && t.length > 12) {
        const out = isWrongPenalty(t) ? PENALTY_TRUTH : (!BAD.test(t) ? t : null);
        if (out) {
          // Every AI call is a visible C-space card inside Sov Space.
          emitCard({ kind: "dock-ask", summary: q.slice(0, 120), detail: out.slice(0, 280), latencyMs: Date.now() - started, model: d.model || undefined, axis: "governance", source: "live" });
          return { ok: true, text: out };
        }
      }
    }
  } catch (e) {}
  emitCard({ kind: "dock-ask", summary: q.slice(0, 120), detail: "gateway unreachable or response rejected — clean fallback served", latencyMs: Date.now() - started, axis: "governance", source: "local-sim" });
  return { ok: false, text: fallback };
}

/** True if a raw brain response looks like persona-bleed or a refusal (for callers doing their own fetch). */
export function isBadSovResponse(t: string): boolean {
  return !t || BAD.test(t);
}
