// functions/api/_palModel.ts — the model in the path, and the rule that keeps facts out of it.
//
// WHY THIS FILE EXISTS
//
// The estate's answerer had no model at all: /api/chat matched patterns and returned canned
// strings, so "tell me a joke" returned a refusal. That is honest but it is not staff. Tavus's
// insight is that the LLM is a LAYER of a persona, not the persona — and that you bring your
// own LLM through an OpenAI-compatible endpoint.
//
// So this file does two things, in this order, and the order is the design:
//
//   1. FACTS FIRST. A question that the published records answer is answered from the records.
//      The model is not asked. It never gets to paraphrase a number.
//
//   2. THE MODEL FOR CONVERSATION. Only when the records do not answer — the reader wants to
//      chat, wants framing, wants a question clarified — does the model speak. And when it
//      speaks it is handed the facts, if there are any, as a LIVE FACTS block it must use.
//
// THE MODEL PROVIDER — TWO SHAPES, ONE CODE PATH
//
// The estate already had a model route and did not use it: SOV_GATE_URL + SOV_GATE_TOKEN point at
// a private Ollama-shaped gate that /api/chat falls back to. It is shaped Ollama: POST {base}/api/chat
// with {model, messages, options:{temperature, num_predict}}, answering {message:{content}}.
//
// Tavus's shape is OpenAI-compatible: POST {base}/chat/completions with {model, messages, max_tokens}.
// Every hosted provider we can name speaks it.
//
// So this file resolves ONE route with TWO shapes. The provider is named by environment
// variables, so the model can be swapped without a code change:
//
//   PAL_MODEL_URL + PAL_MODEL_TOKEN + PAL_MODEL_ID   -> OpenAI-compatible, preferred
//   SOV_GATE_URL  + SOV_GATE_TOKEN                    -> the estate's existing gate, fallback
//
// The gate's routing id is PRIVATE ("sov6-ethics-v3-light" in _chatGrounded.ts) and is never
// returned to a public client: the gate route reports "council-routing-default", the same
// public id the chat surface already uses.
//
// If no provider is configured, this file does NOT pretend. The caller is told the model is
// unconfigured and the answer is served from the records alone. That is the honest state, and it
// is the same state the rest of the estate uses when a machine is unreachable.

export interface PalModelEnv {
  /** Base URL of an OpenAI-compatible endpoint. No trailing slash needed. */
  PAL_MODEL_URL?: string;
  /** Bearer token for that endpoint. */
  PAL_MODEL_TOKEN?: string;
  /** Model id to request, e.g. "gpt-4o-mini" or "anthropic/claude-sonnet-4.5". */
  PAL_MODEL_ID?: string;
  /** Hard ceiling on the model's reply, in tokens. A staff member is brief. */
  PAL_MODEL_MAX_TOKENS?: string;
  /** The estate's existing private gate. Ollama-shaped. Used when PAL_MODEL_URL is not set. */
  SOV_GATE_URL?: string;
  /** Bearer token for that gate. */
  SOV_GATE_TOKEN?: string;
}

/** What the model is allowed to be told about this exchange. */
export interface PalModelTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export type PalModelResult =
  | { ok: true; content: string; provider: string; model: string }
  | { ok: false; reason: "unconfigured" | "unreachable" | "http_error" | "empty"; detail?: string };

/** A model call that did not produce usable text. */
export type PalModelFailure = Extract<PalModelResult, { ok: false }>;

/**
 * Did the model call fail?
 *
 * A type predicate, not `!result.ok`: this repo compiles with strict:false, where narrowing a
 * discriminated union by a boolean literal does not happen, and the failure's `reason` — the
 * difference between "no model is configured" and "the model is down" — is the one thing the
 * caller must be able to say out loud. A predicate narrows under any setting.
 */
export function isModelFailure(result: PalModelResult): result is PalModelFailure {
  return result.ok === false;
}

/**
 * A resolved model route.
 *
 * `model` is the id to REQUEST. `public_model` is the id a reader may see: for the private gate
 * these differ, and only the public one is ever published.
 */
export interface PalModelRoute {
  kind: "openai" | "ollama";
  /** The URL to POST to, already resolved to the full path. */
  url: string;
  token: string | null;
  model: string;
  /** The id that may be shown to a reader. */
  public_model: string;
}

/** The gate's private routing id, and the public id the estate already publishes for it. */
const GATE_PRIVATE_MODEL = "sov6-ethics-v3-light";
const GATE_PUBLIC_MODEL = "council-routing-default";

/**
 * Resolve the model route for this deployment, or null when there is none.
 *
 * A PAL_MODEL_URL with no PAL_MODEL_ID is a MISCONFIGURATION, not a default: the model id is
 * provider-specific, and guessing one produces a confusing 404 from the provider. So that
 * combination resolves to null and the surface says the model is unconfigured.
 */
export function resolveModelRoute(env: PalModelEnv): PalModelRoute | null {
  const palBase = (env.PAL_MODEL_URL || "").trim();
  const palModel = (env.PAL_MODEL_ID || "").trim();
  if (palBase) {
    if (!palModel) return null;
    return {
      kind: "openai",
      url: `${palBase.replace(/\/+$/, "")}/chat/completions`,
      token: (env.PAL_MODEL_TOKEN || "").trim() || null,
      model: palModel,
      public_model: palModel,
    };
  }

  const gateBase = (env.SOV_GATE_URL || "").trim();
  if (gateBase) {
    const requested = (env.PAL_MODEL_ID || "").trim();
    return {
      kind: "ollama",
      url: `${gateBase.replace(/\/+$/, "")}/api/chat`,
      token: (env.SOV_GATE_TOKEN || "").trim() || null,
      // The gate's routing id is private. A caller may name its own model; otherwise the gate
      // routes as it routes and the reader is told the public id.
      model: requested || GATE_PRIVATE_MODEL,
      public_model: requested || GATE_PUBLIC_MODEL,
    };
  }

  return null;
}

/**
 * Is a model configured for this deployment?
 *
 * A deployment with no model is NOT broken — the estate's answers come from the records. But it
 * is a smaller product, and the surface should say so rather than pretend otherwise.
 */
export function modelConfigured(env: PalModelEnv): boolean {
  return resolveModelRoute(env) !== null;
}

/**
 * Ask the model to speak.
 *
 * Deliberately narrow: it takes a system instruction and a user message and returns text. It
 * has no tools, no loop and no ability to act. A PAL that could act through a model would be a
 * much larger surface than this estate can currently prove; the tools stay behind the
 * deterministic path where they belong.
 */
export async function askModel(
  env: PalModelEnv,
  args: { system: string; user: string; temperature?: number },
): Promise<PalModelResult> {
  const route = resolveModelRoute(env);
  if (!route) {
    return {
      ok: false,
      reason: "unconfigured",
      detail: (env.PAL_MODEL_URL || "").trim()
        ? "PAL_MODEL_URL is set but PAL_MODEL_ID is not, so no model can be named."
        : "Neither PAL_MODEL_URL nor SOV_GATE_URL is configured for this deployment.",
    };
  }

  const maxTokens = Number(env.PAL_MODEL_MAX_TOKENS || 256) || 256;
  const temperature = args.temperature ?? 0.6;
  const messages: PalModelTurn[] = [
    { role: "system", content: args.system },
    { role: "user", content: args.user },
  ];

  const body =
    route.kind === "openai"
      ? { model: route.model, messages, stream: false, max_tokens: maxTokens, temperature }
      : {
          model: route.model,
          messages,
          stream: false,
          options: { temperature, num_predict: maxTokens },
        };

  let res: Response;
  try {
    res = await fetch(route.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(route.token ? { authorization: `Bearer ${route.token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch (e: unknown) {
    return { ok: false, reason: "unreachable", detail: e instanceof Error ? e.message : String(e) };
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      detail += " " + (await res.text()).slice(0, 200);
    } catch {
      /* body unreadable; the status is the finding */
    }
    return { ok: false, reason: "http_error", detail };
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: unknown) {
    return { ok: false, reason: "empty", detail: e instanceof Error ? e.message : String(e) };
  }

  // OpenAI-compatible shape, with the Ollama shape as a fallback: both are used in the wild and
  // the difference is one field. Some providers return the content as an array of parts.
  const raw: unknown =
    data?.choices?.[0]?.message?.content ?? data?.message?.content ?? data?.response ?? "";
  const content = Array.isArray(raw)
    ? raw.map((part: any) => (typeof part === "string" ? part : part?.text ?? "")).join("")
    : raw;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) return { ok: false, reason: "empty", detail: "no content field" };

  return { ok: true, content: text, provider: route.url, model: route.public_model };
}

/**
 * The system instruction for a PAL.
 *
 * Assembled from the PAL's own scope and guardrails, so a provisioned PAL's rules travel with
 * it instead of living in one place in the code. The LIVE FACTS block is appended by the caller
 * when there are facts, because the model must use them rather than remember something.
 */
export function palSystemPrompt(args: {
  name: string;
  one_line: string;
  instructions: string;
  can: string[];
  cannot: string[];
  objectives: Array<{ goal: string }>;
  guardrails: Array<{ rule: string; because: string }>;
  /** Published facts the records produced for this question, if any. */
  facts?: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`You are ${args.name}, a staff member of the Council of AI.`);
  lines.push(args.one_line);
  lines.push("");
  lines.push(args.instructions);
  lines.push("");
  lines.push("You can help with:");
  for (const c of args.can) lines.push(`- ${c}`);
  lines.push("");
  lines.push("You must not:");
  for (const c of args.cannot) lines.push(`- ${c}`);
  lines.push("");
  lines.push("Your objectives:");
  for (const o of args.objectives) lines.push(`- ${o.goal}`);
  lines.push("");
  lines.push("Standing rules:");
  for (const g of args.guardrails) lines.push(`- ${g.rule} (${g.because})`);
  lines.push("");
  lines.push(
    "Style: calm, direct, short sentences. British English. No exclamation marks, no emoji, no filler. " +
      "If you do not know something, say so in one clause and move on. When you state a number, say where it came from.",
  );
  if (args.facts && args.facts.trim()) {
    lines.push("");
    lines.push("LIVE FACTS — these come from published Council of AI records and are authoritative:");
    lines.push(args.facts.trim());
    lines.push(
      "Answer FROM these facts. Replying 'I do not know' when facts are supplied is an error, not modesty. " +
        "Do not add a number that is not in these facts. If the facts do not answer the question, say which record would.",
    );
  }
  return lines.join("\n");
}
