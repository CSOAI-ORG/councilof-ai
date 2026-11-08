// Text-only provider adapters. No tool executor, signing, payment or case authority.
export const PROVIDERS = Object.freeze({
  ollama: { label: "Ollama · local models", local: true, base: "http://127.0.0.1:11434", permission: "http://127.0.0.1/*", format: "ollama", key: false },
  "meok-cloud": { label: "MEOK cloud overlay", local: false, base: "https://nicholastempleman-meok-sov6-abstraction-overlay.hf.space", permission: "https://nicholastempleman-meok-sov6-abstraction-overlay.hf.space/*", format: "openai", key: false, fixedModel: "default" },
  nvidia: { label: "NVIDIA · hosted text models", local: false, base: "https://integrate.api.nvidia.com", permission: "https://integrate.api.nvidia.com/*", format: "openai", key: true },
  openai: { label: "OpenAI", local: false, base: "https://api.openai.com", permission: "https://api.openai.com/*", format: "openai", key: true },
  groq: { label: "Groq", local: false, base: "https://api.groq.com/openai", permission: "https://api.groq.com/*", format: "openai", key: true },
  anthropic: { label: "Anthropic", local: false, base: "https://api.anthropic.com", permission: "https://api.anthropic.com/*", format: "anthropic", key: true },
  huggingface: { label: "Hugging Face · explicit provider route", local: false, base: "https://router.huggingface.co", permission: "https://router.huggingface.co/*", format: "openai", key: true },
});
export const SITES = Object.freeze(["https://councilof.ai", "https://meok.ai"]);
const MAX_BYTES = 2 * 1024 * 1024, MAX_TEXT = 32768;
export const MODEL_FLOOR = "You are MEOK, a professional human interaction interface. Help the person develop their goal with concrete reasoning, useful connections and practical next steps. State uncertainty. Be considerate and preserve the person's ability to decide. You generate text; you have no authority to execute tools, approve decisions, sign evidence, spend money or claim that computer work happened. Model output is not a GSPC measurement or a human approval. Use provided context carefully and do not invent memory or completed actions.";
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
export function selection(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
    Object.keys(raw).some(key => !["provider", "model", "offline", "includeContext", "transport"].includes(key))) throw Error("Invalid AI selection.");
  const provider = typeof raw.provider === "string" && own(PROVIDERS, raw.provider) ? raw.provider : null;
  if (!provider || typeof raw.offline !== "boolean" || typeof raw.model !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9_.:/@+-]{0,199}$/.test(raw.model)) throw Error("Choose a supported provider and a model.");
  if (raw.offline && provider !== "ollama") throw Error("Offline AI permits installed local models only.");
  if (provider === "huggingface" && (raw.model.indexOf("/") < 1 || raw.model.lastIndexOf(":") <= raw.model.indexOf("/") || /:(auto|fastest|cheapest|preferred)$/.test(raw.model))) throw Error("Choose an explicit Hugging Face model:provider route.");
  if (provider === "meok-cloud" && raw.model !== "default") throw Error("The MEOK cloud connection serves its own overlay model.");
  if (raw.transport !== undefined && !["extension", "web"].includes(raw.transport)) throw Error("Invalid AI connection.");
  if (raw.transport === "web" && provider !== "meok-cloud") throw Error("This provider requires the installed AI connection.");
  return { provider, model: raw.model, offline: raw.offline, includeContext: raw.includeContext === true, transport: raw.transport ?? "extension" };
}
export function messagesFor(question, history = [], includeContext = false) {
  if (typeof question !== "string" || !question.trim() || question.length > 8000) throw Error("Enter a question of up to 8000 characters.");
  if (!Array.isArray(history) || history.length > 12) throw Error("Conversation context is too large.");
  const context = includeContext ? history.map(value => {
    if (!value || !["user", "assistant"].includes(value.role) || typeof value.content !== "string" || value.content.length > 8000) throw Error("Invalid conversation context.");
    return { role: value.role, content: value.content };
  }) : [];
  if (context.reduce((sum, row) => sum + row.content.length, question.length) > 16000) throw Error("Reduce the conversation context before sending.");
  return [{ role: "system", content: MODEL_FLOOR }, ...context, { role: "user", content: question.trim() }];
}
function parseFrame(text) { try { return JSON.parse(text); } catch { throw Error("The provider returned an invalid stream frame."); } }
function modelName(value) { return typeof value === "string" && value.length > 0 && value.length <= 200 ? value : null; }
async function jsonBody(response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw Error("Provider response is too large.");
  if(!response.body?.getReader)throw Error("Provider JSON response has no readable body.");
  const reader=response.body.getReader(),decoder=new TextDecoder("utf-8",{fatal:true});
  let text="",bytes=0;
  try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>MAX_BYTES)throw Error("Provider response is too large.");text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}
  finally{try{await reader.cancel();}catch{}reader.releaseLock();}
  try { return JSON.parse(text); } catch { throw Error("The provider returned invalid JSON."); }
}
export function createAIExecutor({ fetchImpl = fetch, getKey = async () => null, canFetch = async () => true, isOffline = () => false } = {}) {
  async function request(provider, suffix, { signal, method = "GET", body, offline = false, secret = false } = {}) {
    const config = own(PROVIDERS, provider) ? PROVIDERS[provider] : null;
    if (!config) throw Error("Unsupported provider.");
    if ((offline || isOffline()) && !config.local) throw Error("Offline AI blocks cloud requests.");
    if (!await canFetch(config.permission)) throw Error("Connect this provider in the extension's AI workspace first.");
    const headers = { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) };
    if (secret) {
      const key = await getKey(provider);
      if (typeof key !== "string" || !key || /[\r\n]/.test(key)) throw Error("Connect your provider account in the extension's AI workspace.");
      if (config.format === "anthropic") { headers["x-api-key"] = key; headers["anthropic-version"] = "2023-06-01"; }
      else headers.authorization = "Bearer " + key;
    }
    if ((offline || isOffline()) && !config.local) throw Error("Offline AI blocks cloud requests.");
    const response = await fetchImpl(config.base + suffix, {
      method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal,
      credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw Error("The selected provider returned HTTP " + response.status + ". No other provider was tried.");
    return response;
  }
  async function models(provider, { signal } = {}) {
    const config = PROVIDERS[provider];
    if (!config) throw Error("Unsupported provider.");
    if (config.fixedModel) return [{ id: config.fixedModel, label: "MEOK cloud overlay" }];
    const response = await request(provider, config.local ? "/api/tags" : "/v1/models", { signal, offline: config.local, secret: config.key });
    const raw = await jsonBody(response);
    const rows = config.local ? raw.models : raw.data;
    if (!Array.isArray(rows) || rows.length > 10000) throw Error("The provider's model catalogue is invalid.");
    return rows.map(row => ({
      id: modelName(config.local ? row.name ?? row.model : row.id), size: config.local ? Number(row.size) : null,
      label: modelName(config.local ? row.name ?? row.model : row.id),
    })).filter(row => row.id && (!config.local || row.size > 1024 * 1024)).slice(0,500);
  }
  async function chat({ choice, question, history = [], maxTokens = 384, signal, onDelta = () => {} }) {
    const chosen = selection(choice), config = PROVIDERS[chosen.provider];
    const messages = messagesFor(question, history, chosen.includeContext);
    const requested = Number(maxTokens);
    const limit = Number.isSafeInteger(requested) && requested > 0 ? Math.min(512, requested) : 384;
    if ((chosen.offline || isOffline()) && !config.local) throw Error("Offline AI blocks cloud requests.");
    if (config.local) {
      const installed = await models("ollama", { signal });
      if (!installed.some(row => row.id === chosen.model)) throw Error("The selected local model is not installed. No download or cloud fallback was attempted.");
      const details = await jsonBody(await request("ollama", "/api/show", { method: "POST", offline: true, signal, body: { model: chosen.model, verbose: false } }));
      if (details.remote_host || details.remote_model || chosen.model.endsWith(":cloud") ||
        details.details?.format !== "gguf" || !Array.isArray(details.tensors) || !details.tensors.length ||
        (Array.isArray(details.capabilities) && !details.capabilities.includes("completion"))) {
        throw Error("Choose an installed local GGUF chat model. Cloud-linked and embedding models cannot be used for offline AI.");
      }
    }
    let payload, suffix;
    if (config.local) {
      suffix = "/api/chat"; payload = { model: chosen.model, messages, stream: true, think: false,
        options: { num_predict: limit, temperature: 0 }, keep_alive: "2m" };
    } else if (config.format === "anthropic") {
      suffix = "/v1/messages"; payload = { model: chosen.model, system: MODEL_FLOOR, messages: messages.slice(1), max_tokens: limit, stream: true };
    } else {
      suffix = "/v1/chat/completions"; payload = { messages, stream: true,
        ...(chosen.provider === "meok-cloud" ? {} : { model: chosen.model }),
        ...(chosen.provider === "openai" ? { max_completion_tokens: limit } : { max_tokens: limit }) };
    }
    const response = await request(chosen.provider, suffix, { method: "POST", body: payload, signal, offline: chosen.offline, secret: config.key });
    const mime = response.headers.get("content-type") || "";
    let content = "", reportedModel = null, finished = false;
    function accept(data) {
      if (!data || typeof data !== "object") throw Error("Invalid provider response.");
      if (data.error || data.type === "error") throw Error("The selected provider reported an error. No fallback was attempted.");
      let delta = "";
      if (config.local) { if (data.message?.tool_calls?.length) throw Error("This connection cannot execute tool calls."); delta = data.message?.content ?? ""; reportedModel = modelName(data.model) ?? reportedModel; finished ||= data.done === true; }
      else if (config.format === "anthropic") {
        reportedModel = modelName(data.message?.model) ?? modelName(data.model) ?? reportedModel;
        if (data.type === "content_block_delta" && data.delta?.type === "text_delta") delta = data.delta.text;
        if (data.type === "content_block_start" && data.content_block?.type === "tool_use" || data.content?.some?.(block=>block.type === "tool_use")) throw Error("This is a text-only connection. No tool request was executed.");
        if (data.type === "message_stop") finished = true;
        if (Array.isArray(data.content)) delta = data.content.filter(block => block.type === "text").map(block => block.text).join("");
      } else {
        reportedModel = modelName(data.model) ?? reportedModel;
        const first = data.choices?.[0];
        if (first?.delta?.tool_calls?.length || first?.message?.tool_calls?.length) throw Error("This is a text-only connection. No tool request was executed.");
        delta = first?.delta?.content ?? first?.message?.content ?? "";
        finished ||= first?.finish_reason !== undefined && first.finish_reason !== null;
      }
      if (typeof delta !== "string") throw Error("The provider returned invalid text.");
      if (content.length + delta.length > MAX_TEXT) throw Error("Provider text exceeded its limit.");
      content += delta;
      // Only visible answer text leaves this adapter. Reasoning fields are not forwarded.
      onDelta(delta);
    }
    if (mime.includes("application/json") && !mime.includes("ndjson")) {
      const data = await jsonBody(response); accept(data); finished = true;
    } else {
      if (!response.body?.getReader || (!mime.includes("event-stream") && !mime.includes("ndjson"))) throw Error("The provider did not return a supported answer stream.");
      const reader = response.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
      let buffer = "", bytes = 0;
      try {
        for (;;) {
          if (signal?.aborted) throw Error("Reading stopped. Provider cancellation is unconfirmed.");
          const next = await reader.read();
          if (next.done) break;
          bytes += next.value.byteLength;
          if (bytes > MAX_BYTES) throw Error("Provider stream exceeded its limit.");
          buffer += decoder.decode(next.value, { stream: true });
          let cut;
          while ((cut = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0,cut).replace(/\r$/, ""); buffer = buffer.slice(cut+1);
            if (!line.trim()) continue;
            if (mime.includes("event-stream")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (data === "[DONE]") { finished = true; continue; }
              accept(parseFrame(data));
            } else accept(parseFrame(line));
          }
          if (buffer.length > 256 * 1024) throw Error("Provider stream frame exceeded its limit.");
        }
        buffer += decoder.decode();
        if (buffer.trim()) {
          if (mime.includes("ndjson")) accept(parseFrame(buffer));
          else if (buffer.trim().startsWith("data:")) {
            const data = buffer.trim().slice(5).trim();
            if (data === "[DONE]") finished = true; else accept(parseFrame(data));
          }
        }
      } finally { try { await reader.cancel(); } catch {} reader.releaseLock(); }
    }
    if (!finished || !content.trim() || !reportedModel) throw Error("The provider did not publish a complete answer and model identity.");
    if (config.local && reportedModel.replace(/:latest$/, "") !== chosen.model.replace(/:latest$/, "")) throw Error("The local runtime answered with a different model.");
    return { content, provider: chosen.provider, requestedModel: chosen.model, reportedModel,
      modelLabel: chosen.provider === "meok-cloud" ? "MEOK cloud overlay" : reportedModel,
      local: config.local, offline: chosen.offline, endpoint: config.base + suffix, signed: false, measured: false };
  }
  return { models, chat };
}
