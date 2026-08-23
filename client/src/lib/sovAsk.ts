// sovAsk.ts — one place every "Ask the Sovereign" box goes through.
//
// Calls POST /api/chat with the standard JSON contract. The server answers from
// published measurement (grounded lane) or the live specialist when SOV_GATE_URL
// is wired. Persona-bleed filtering applies only to live model output.

import { detectLocale } from "./locale";
import { emitCard } from "./aiCardBus";

const _kb = (import.meta as any).env?.VITE_KNOWLEDGE_BASE as string | undefined;
const CHAT_URL = _kb ? `${_kb.replace(/\/$/, "")}/chat` : "/api/chat";

const LANG_NAMES: Record<string, string> = {
  ja: "Japanese",
  de: "German",
  fr: "French",
  es: "Spanish",
  ko: "Korean",
  zh: "Chinese",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
};

function langDirective(): string {
  try {
    const l = detectLocale().lang;
    return LANG_NAMES[l]
      ? ` Respond in ${LANG_NAMES[l]}. Keep regulation names in English.`
      : "";
  } catch {
    return "";
  }
}

const BAD =
  /(i['’]?m sorry[, ]|can['’]?t help with that|i cannot help|i can['’]?t assist|as an ai language model|remembering companion|walks beside you|companion who|gentle prose|quiet,? remembering|i['’]?m a .*companion|credo ai|i tend to focus|travell?er|fellow travell?er|on your journey|here (for|with) you|hold space|dear friend|my friend|kindred|wander|i['’]?m here to (help|support) you|let me know the (particular|specific) (scenario|regulation))/i;

const PENALTY_CTX = /(fine|penalt|turnover|sanction)/i;
const WRONG_FIG = /(30\s*(million|m\b)|6\s?%|20\s*(million|m\b)|4\s?%)/i;
const PENALTY_TRUTH =
  "Under Article 99 of the EU AI Act the ceilings are: prohibited-practice breaches (Article 5) up to EUR 35 million or 7% of global annual turnover, whichever is higher; breaches of high-risk duties up to EUR 15 million or 3%; supplying misleading information to authorities up to EUR 7.5 million or 1.5%.";

function isWrongPenalty(t: string): boolean {
  return PENALTY_CTX.test(t) && WRONG_FIG.test(t) && !/(35\s*(million|m\b)|7\s?%|15\s*(million|m\b)|3\s?%)/.test(t);
}

export type AskResult = { ok: boolean; text: string; state?: string };

/** Ask via POST /api/chat — grounded measurement or live specialist when wired. */
export async function askSovereign(
  userText: string,
  opts?: { fallback?: string; system?: string },
): Promise<AskResult> {
  const q = (userText || "").trim();
  const fallback =
    opts?.fallback ||
    "I could not read an answer from /api/chat. Try a named GSPC axis, Article 5 prohibition check, or open Council OS for AG-UI streaming.";
  if (!q) return { ok: false, text: fallback };

  const started = Date.now();
  const messages: { role: string; content: string }[] = [];

  if (opts?.system) {
    messages.push({
      role: "user",
      content: `[Context for this governance question${langDirective()}]: ${opts.system}\n\nQuestion: ${q}`,
    });
  } else {
    messages.push({ role: "user", content: q + langDirective() });
  }

  try {
    const r = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (r.ok) {
      const d = await r.json();
      const t = String(d?.answer ?? d?.reply ?? "").trim();
      const state = String(d?.state ?? "");
      if (t.length > 12) {
        if (state === "live") {
          const out = isWrongPenalty(t) ? PENALTY_TRUTH : !BAD.test(t) ? t : null;
          if (out) {
            emitCard({
              kind: "dock-ask",
              summary: q.slice(0, 120),
              detail: out.slice(0, 280),
              latencyMs: Date.now() - started,
              model: d.model || undefined,
              axis: "governance",
              source: "live",
            });
            return { ok: true, text: out, state };
          }
        } else {
          emitCard({
            kind: "dock-ask",
            summary: q.slice(0, 120),
            detail: t.slice(0, 280),
            latencyMs: Date.now() - started,
            model: d.model || undefined,
            axis: "governance",
            source: state === "grounded" ? "grounded" : "local-sim",
          });
          return { ok: state !== "ungrounded", text: t, state };
        }
      }
    }
  } catch {
    /* fall through */
  }

  emitCard({
    kind: "dock-ask",
    summary: q.slice(0, 120),
    detail: "gateway unreachable — clean fallback served",
    latencyMs: Date.now() - started,
    axis: "governance",
    source: "local-sim",
  });
  return { ok: false, text: fallback };
}

export function isBadSovResponse(t: string): boolean {
  return !t || BAD.test(t);
}
