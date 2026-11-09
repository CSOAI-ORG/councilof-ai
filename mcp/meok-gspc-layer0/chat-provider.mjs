// SPDX-License-Identifier: Apache-2.0
// Transport adapter for the existing MEOK bridge, not a router, executor or store.
import { createHash } from 'node:crypto';

const PROMPT_LIMIT = 64_000;
const RESPONSE_LIMIT = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 90_000;
const DEFAULT_TOKENS = 1024;
const MAX_TOKENS = 4096;

class ChatFailure extends Error {
  constructor(code, extra = {}) {
    super(code);
    this.code = code;
    this.extra = extra;
  }
}

function configFailure(field) {
  throw new ChatFailure('CHAT_CONFIG_INVALID', { config_field: field });
}

function integerSetting(env, name, fallback, maximum) {
  const value = env[name];
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) configFailure(name);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) configFailure(name);
  return number;
}

function isLoopback(hostname) {
  return hostname === 'localhost' || hostname === '[::1]' || /^127\.\d+\.\d+\.\d+$/.test(hostname);
}

function endpointFor(base, backend, field) {
  if (typeof base !== 'string' || !base || /[\s\u0000-\u0020\u007f?#]/u.test(base)) configFailure(field);
  let url;
  try { url = new URL(base); } catch { configFailure(field); }
  if (url.username || url.password || url.search || url.hash || !url.hostname) configFailure(field);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') configFailure(field);
  // Legacy H.I.M. may be on an explicitly configured LAN coordinator. Cosmos
  // sends its optional bearer only over HTTPS or to a loopback service.
  if (backend === 'cosmos' && url.protocol === 'http:' && !isLoopback(url.hostname)) configFailure(field);
  const path = url.pathname.replace(/\/+$/, '');
  if (backend === 'cosmos' && /\/chat\/completions$/.test(path)) configFailure(field);
  url.pathname = backend === 'cosmos' && /\/v1$/.test(path)
    ? `${path}/chat/completions`
    : `${path}/v1/chat/completions`;
  return url.href;
}

function configuration(env) {
  const backend = env.MEOK_CHAT_BACKEND === undefined || env.MEOK_CHAT_BACKEND === ''
    ? 'him' : env.MEOK_CHAT_BACKEND;
  if (backend !== 'him' && backend !== 'cosmos') configFailure('MEOK_CHAT_BACKEND');
  const timeoutMs = integerSetting(env, 'MEOK_CHAT_TIMEOUT_MS', DEFAULT_TIMEOUT, MAX_TIMEOUT);
  if (backend === 'him') {
    return {
      backend, prefix: 'HIM', timeoutMs, maxTokens: null,
      endpoint: endpointFor(env.HIM_URL || 'http://127.0.0.1:8787', backend, 'HIM_URL'),
      model: 'meok-canonical-v1', apiKey: null,
    };
  }
  const maxTokens = integerSetting(env, 'MEOK_CHAT_MAX_TOKENS', DEFAULT_TOKENS, MAX_TOKENS);
  const endpoint = endpointFor(env.MEOK_CHAT_BASE_URL, backend, 'MEOK_CHAT_BASE_URL');
  const model = env.MEOK_CHAT_MODEL;
  if (typeof model !== 'string' || !model.trim() || model !== model.trim()
      || /[\u0000-\u001f\u007f]/u.test(model) || Buffer.byteLength(model, 'utf8') > 256) {
    configFailure('MEOK_CHAT_MODEL');
  }
  const apiKey = env.MEOK_CHAT_API_KEY || null;
  if (apiKey !== null && (typeof apiKey !== 'string' || /[\s\u0000-\u0020\u007f]/u.test(apiKey)
      || Buffer.byteLength(apiKey, 'utf8') > 8192)) configFailure('MEOK_CHAT_API_KEY');
  return { backend, prefix: 'COSMOS', endpoint, model, apiKey, timeoutMs, maxTokens };
}

// Cancellation is best effort and must not extend the request's deadline.
function cancelBody(body) {
  try { Promise.resolve(body?.cancel()).catch(() => {}); } catch { /* already locked/closed */ }
}

async function readBoundedBody(response, signal, prefix) {
  const declaredLength = response.headers?.get?.('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > RESPONSE_LIMIT) {
    cancelBody(response.body);
    throw new ChatFailure(`${prefix}_RESPONSE_TOO_LARGE`);
  }
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new ChatFailure(`${prefix}_RESPONSE_INVALID`);
  }
  const reader = response.body.getReader();
  const cancelReader = () => {
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* already closed */ }
  };
  signal.addEventListener('abort', cancelReader, { once: true });
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      if (signal.aborted) throw new ChatFailure(`${prefix}_TIMEOUT`);
      const { done, value } = await reader.read();
      if (signal.aborted) throw new ChatFailure(`${prefix}_TIMEOUT`);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new ChatFailure(`${prefix}_RESPONSE_INVALID`);
      size += value.byteLength;
      if (size > RESPONSE_LIMIT) {
        cancelReader();
        throw new ChatFailure(`${prefix}_RESPONSE_TOO_LARGE`);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks, size);
    let data;
    try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch {
      // The original H.I.M. bridge surfaced response.json() failures through its
      // request catch. Preserve that public error code for coordinator clients.
      throw new ChatFailure(prefix === 'HIM' ? 'HIM_REQUEST_FAILED' : `${prefix}_RESPONSE_INVALID`);
    }
    return { data, size, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch (error) {
    cancelReader();
    throw error;
  } finally {
    signal.removeEventListener('abort', cancelReader);
    try { reader.releaseLock(); } catch { /* a cancellation may still be pending */ }
  }
}

/**
 * One bounded OpenAI-compatible request through the existing bridge.
 *
 * Default: HIM_URL, fixed meok-canonical-v1 and the existing mode field.
 * Opt-in: MEOK_CHAT_BACKEND=cosmos, MEOK_CHAT_BASE_URL (root or /v1),
 * MEOK_CHAT_MODEL, optional MEOK_CHAT_API_KEY. Cosmos-only settings are ignored
 * entirely by the him backend. Optional shared timeout: MEOK_CHAT_TIMEOUT_MS
 * (1..90000, default 30000). Cosmos-only MEOK_CHAT_MAX_TOKENS is 1..4096,
 * default 1024. H.I.M. retains its original model/messages/mode-only envelope.
 *
 * Cosmos ANSWER_RECEIVED means nonempty model text was received, not that a task
 * was completed. H.I.M. returns exactly its legacy {answer, provenance} envelope
 * and permits a deliberate empty string. Provenance remains provider-reported.
 * This adapter neither executes tools nor admits memory or training examples.
 */
export async function submitChat(args, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  let config;
  let timeout;
  let attempted = false;
  let controller;
  try {
    config = configuration(env);
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw new ChatFailure('CHAT_PROMPT_INVALID');
    }
    const prompt = args.prompt || args.text || '';
    if (typeof prompt !== 'string' || !prompt.trim()) throw new ChatFailure('CHAT_PROMPT_INVALID');
    const promptBytes = Buffer.byteLength(prompt, 'utf8');
    if (promptBytes > PROMPT_LIMIT) throw new ChatFailure('CHAT_PROMPT_TOO_LARGE');
    const body = {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
    };
    if (config.backend === 'him') {
      const mode = args.mode || 'auto';
      if (typeof mode !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(mode)) {
        throw new ChatFailure('CHAT_MODE_INVALID');
      }
      body.mode = mode;
    } else {
      body.stream = false;
      body.max_tokens = config.maxTokens;
    }
    if (typeof fetchImpl !== 'function') configFailure('fetchImpl');
    const bodyText = JSON.stringify(body);
    const headers = { 'content-type': 'application/json', accept: 'application/json' };
    if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
    controller = new AbortController();
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new ChatFailure(`${config.prefix}_TIMEOUT`));
      }, config.timeoutMs);
    });
    const operation = (async () => {
      attempted = true;
      const response = await fetchImpl(config.endpoint, {
        method: 'POST', headers, body: bodyText,
        redirect: 'manual', signal: controller.signal,
      });
      if (controller.signal.aborted) {
        cancelBody(response?.body);
        throw new ChatFailure(`${config.prefix}_TIMEOUT`);
      }
      if (!response || !Number.isInteger(response.status)) throw new ChatFailure(`${config.prefix}_RESPONSE_INVALID`);
      if (response.redirected || (response.status >= 300 && response.status < 400)) {
        cancelBody(response.body);
        throw new ChatFailure(`${config.prefix}_REDIRECT_REFUSED`, { http_status: response.status });
      }
      if (response.status < 200 || response.status >= 300) {
        cancelBody(response.body);
        throw new ChatFailure(`${config.prefix}_HTTP_ERROR`, { http_status: response.status });
      }
      const { data, size, sha256 } = await readBoundedBody(response, controller.signal, config.prefix);
      if (!data || typeof data !== 'object' || Array.isArray(data)
          || (config.backend === 'him' ? Boolean(data.error) : data.error != null)) {
        throw new ChatFailure(`${config.prefix}_RESPONSE_INVALID`);
      }
      const choice = Array.isArray(data.choices) ? data.choices[0] : undefined;
      const message = choice?.message;
      if ((Array.isArray(message?.tool_calls) && message.tool_calls.length > 0)
          || message?.function_call != null || choice?.finish_reason === 'tool_calls'
          || choice?.finish_reason === 'function_call') {
        throw new ChatFailure(`${config.prefix}_TOOL_CALLS_UNSUPPORTED`);
      }
      if (message?.tool_calls != null && !Array.isArray(message.tool_calls)) {
        throw new ChatFailure(`${config.prefix}_RESPONSE_INVALID`);
      }
      const answer = message?.content;
      if (typeof answer !== 'string' || (config.backend === 'cosmos' && !answer.trim())) {
        throw new ChatFailure(`${config.prefix}_RESPONSE_INVALID`);
      }
      if (config.backend === 'him') {
        return { answer, provenance: data.meok_provenance ?? null };
      }
      return {
        state: 'ANSWER_RECEIVED',
        answer,
        provenance: data.meok_provenance ?? null,
        observation: {
          backend: config.backend,
          configured_model: config.model,
          http_status: response.status,
          prompt_bytes: promptBytes,
          response_bytes: size,
          request_sha256: createHash('sha256').update(bodyText).digest('hex'),
          response_sha256: sha256,
          max_tokens: config.maxTokens,
          timeout_ms: config.timeoutMs,
        },
        provider_reported: {
          model: typeof data.model === 'string' ? data.model : null,
          finish_reason: typeof choice.finish_reason === 'string' ? choice.finish_reason : null,
        },
        limits: {
          provenance_verified: false,
          model_identity_verified: false,
          task_outcome_verified: false,
          tool_execution: false,
          memory_admission: false,
          model_training: false,
        },
      };
    })();
    return await Promise.race([operation, deadline]);
  } catch (error) {
    const code = error instanceof ChatFailure ? error.code
      : controller?.signal.aborted ? `${config?.prefix || 'CHAT'}_TIMEOUT`
        : `${config?.prefix || 'CHAT'}_REQUEST_FAILED`;
    return {
      state: 'UNCHECKABLE',
      reason: code,
      ...(error instanceof ChatFailure ? error.extra : {}),
      request_attempted: attempted,
    };
  } finally {
    clearTimeout(timeout);
  }
}
