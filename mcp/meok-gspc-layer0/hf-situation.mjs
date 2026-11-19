// SPDX-License-Identifier: MIT
// Optional adapter to the existing private MEOK Gradio Reasoner. No new server/store.
import { createHash } from 'node:crypto';

const PROVIDER = 'Cosmos 3 Edge · ZeroGPU';
const MODEL = 'nvidia/Cosmos3-Edge';
const JSON_LIMIT = 1024 * 1024;
const STREAM_LIMIT = 2 * 1024 * 1024;
const CARD_LIMIT = 3072;
const hash = text => createHash('sha256').update(text).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
class Refusal extends Error { constructor(code) { super(code); this.code = code; } }
const requireThat = (condition, code) => { if (!condition) throw new Refusal(code); };
function cancel(body) { try { Promise.resolve(body?.cancel()).catch(() => {}); } catch {} }

export const HF_SITUATION_TOOL = {
  name: 'meok_reason_situation',
  description: 'Send one authorised text-only situation to the explicitly configured existing private MEOK Cosmos Space. Consumes its ZeroGPU quota and creates temporary session state. Returns model text and a synthetic reaction record, not verified truth, durable memory, execution authority or a training approval. No automatic retry or provider fallback.',
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      goal: { type: 'string', minLength: 1, maxLength: 1200 },
      situation: { type: 'string', minLength: 1, maxLength: 4000 },
      consent_to_send: { type: 'boolean', const: true, description: 'Pass-through consent for the exact supplied inputs; not proof of a human identity, source rights or approval to act.' },
    },
    required: ['goal', 'situation', 'consent_to_send'],
  },
};

function settings(env) {
  requireThat(env.MEOK_HF_ENABLED === '1', 'HF_ROUTE_DISABLED');
  const id = env.MEOK_HF_SPACE_ID;
  requireThat(typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/.test(id), 'HF_CONFIG_INVALID');
  requireThat(/^https:\/\/[a-z0-9][a-z0-9-]*\.hf\.space$/.test(env.MEOK_HF_ORIGIN || ''), 'HF_CONFIG_INVALID');
  for (const key of ['MEOK_HF_SPACE_SHA', 'MEOK_HF_MODEL_SHA']) {
    requireThat(/^[a-f0-9]{40}$/.test(env[key] || ''), 'HF_CONFIG_INVALID');
  }
  const token = env.MEOK_HF_TOKEN;
  requireThat(typeof token === 'string' && token.length >= 8 && token.length <= 8192 && /^[\x21-\x7e]+$/.test(token), 'HF_CONFIG_INVALID');
  const number = (name, fallback, max) => {
    const v = env[name] ?? String(fallback);
    requireThat(typeof v === 'string' && /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= max, 'HF_CONFIG_INVALID');
    return Number(v);
  };
  return { id, origin: env.MEOK_HF_ORIGIN, sha: env.MEOK_HF_SPACE_SHA,
    modelSha: env.MEOK_HF_MODEL_SHA, token, timeout: number('MEOK_HF_TIMEOUT_MS', 60000, 120000),
    callLimit: number('MEOK_HF_CALL_LIMIT', 1, 100) };
}

async function boundedJson(response, signal) {
  requireThat(response.body?.getReader, 'HF_RESPONSE_INVALID');
  const reader = response.body.getReader(); const parts = []; let size = 0;
  const abort = () => cancel({ cancel: () => reader.cancel() });
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      requireThat(!signal.aborted, 'HF_TIMEOUT');
      const { value, done } = await reader.read();
      requireThat(!signal.aborted, 'HF_TIMEOUT');
      if (done) break;
      size += value.byteLength;
      requireThat(size <= JSON_LIMIT, 'HF_RESPONSE_TOO_LARGE'); parts.push(value);
    }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(parts))); }
    catch { throw new Refusal('HF_RESPONSE_INVALID'); }
  } finally { abort(); signal.removeEventListener('abort', abort); }
}

async function completedEvent(response, signal) {
  requireThat(response.body?.getReader, 'HF_RESPONSE_INVALID');
  const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffer = ''; let bytes = 0; let events = 0;
  const abort = () => cancel({ cancel: () => reader.cancel() });
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      requireThat(!signal.aborted, 'HF_TIMEOUT');
      const { value, done } = await reader.read();
      requireThat(!signal.aborted, 'HF_TIMEOUT');
      if (done) { try { decoder.decode(); } catch { throw new Refusal('HF_RESPONSE_INVALID'); } break; }
      bytes += value.byteLength; requireThat(bytes <= STREAM_LIMIT, 'HF_RESPONSE_TOO_LARGE');
      try { buffer += decoder.decode(value, { stream: true }); }
      catch { throw new Refusal('HF_RESPONSE_INVALID'); }
      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, match.index); buffer = buffer.slice(match.index + match[0].length);
        requireThat(++events <= 4096, 'HF_RESPONSE_TOO_LARGE');
        let type = ''; const data = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) type = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (!type && data.length === 0) continue;
        if (type === 'heartbeat' || type === 'generating') continue;
        requireThat(type !== 'error', 'HF_REMOTE_JOB_ERROR');
        requireThat(type === 'complete', 'HF_STREAM_EVENT_UNSUPPORTED');
        try { return { result: JSON.parse(data.join('\n')), bytes }; }
        catch { throw new Refusal('HF_RESPONSE_INVALID'); }
      }
    }
    throw new Refusal('HF_INCOMPLETE_STREAM');
  } finally { abort(); signal.removeEventListener('abort', abort); }
}

function qualifyMeta(meta, config) {
  requireThat(object(meta) && meta.id === config.id && meta.private === true && meta.host === config.origin, 'HF_SPACE_IDENTITY_MISMATCH');
  requireThat(meta.sha === config.sha && meta.runtime?.sha === config.sha, 'HF_SPACE_REVISION_MISMATCH');
  requireThat(meta.runtime?.stage === 'RUNNING', 'HF_SPACE_NOT_RUNNING');
  requireThat(meta.runtime?.hardware?.current === 'zero-a10g' && meta.runtime?.hardware?.requested === 'zero-a10g', 'HF_HARDWARE_MISMATCH');
}

function qualifyResult(data, config) {
  // The pinned Blocks app has five outputs. Its first is gr.State, emitted as
  // null in raw SSE; gradio_client hides that slot. Never expose session state.
  // This exact wire profile is separate from a Python client's four-value view.
  requireThat(Array.isArray(data) && data.length === 5 && data[0] === null,
    'HF_RESULT_WIRE_SHAPE_INVALID');
  const [, answer, events, card, review] = data;
  requireThat(typeof answer === 'string' && answer.trim() && Buffer.byteLength(answer) <= 48000, 'HF_RESULT_CONTRACT_INVALID');
  requireThat(Array.isArray(events) && events.length <= 100 && events.every(object), 'HF_RESULT_CONTRACT_INVALID');
  const modelEvents = events.filter(e => e.stage === 'MODEL_RESPONSE_RECEIVED');
  requireThat(modelEvents.length === 1 && modelEvents[0].provider === PROVIDER && modelEvents[0].revision === config.modelSha, 'HF_MODEL_REPORT_MISMATCH');
  requireThat(object(card) && card.schema === 'csoai.3kb-reaction-card/0.1', 'HF_RESULT_CONTRACT_INVALID');
  const cardText = JSON.stringify(card);
  requireThat(Buffer.byteLength(cardText) <= CARD_LIMIT, 'HF_CARD_TOO_LARGE');
  requireThat(card.reaction?.claim_state === 'SYNTHETIC_HYPOTHESES_ONLY'
    && card.evolve?.may_train_production === false && card.evolve?.may_promote_claim === false
    && card.evolve?.may_mutate_constitution === false, 'HF_RESULT_AUTHORITY_MISMATCH');
  for (const field of ['execute_external_effect', 'settle_payment', 'sign_or_anchor', 'self_measure', 'self_promote']) {
    requireThat(card.authority?.[field] === false, 'HF_RESULT_AUTHORITY_MISMATCH');
  }
  requireThat(events.filter(e => e.stage === 'EVOLVE_REVIEW').length === 1
    && events.find(e => e.stage === 'EVOLVE_REVIEW').decision === 'HOLD', 'HF_RESULT_AUTHORITY_MISMATCH');
  requireThat(object(review), 'HF_RESULT_CONTRACT_INVALID');
  return { answer, card, cardText, modelEvent: modelEvents[0] };
}

/** Per-runner call count is a session safeguard, not a durable spending ledger. */
export function createHfSituationRunner() {
  let busy = false; let submissions = 0;
  return async function reasonSituation(args, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
    let attempted = false; let eventId = null; let controller; let timer; let acquired = false;
    try {
      const config = settings(env);
      requireThat(object(args) && Object.keys(args).every(k => ['goal','situation','consent_to_send'].includes(k)), 'HF_ARGUMENTS_INVALID');
      requireThat(args.consent_to_send === true, 'HF_INPUT_CONSENT_REQUIRED');
      for (const [field, limit] of [['goal',1200], ['situation',4000]]) {
        requireThat(typeof args[field] === 'string' && args[field].trim() && args[field].length <= limit && Buffer.byteLength(args[field]) <= limit * 4, 'HF_ARGUMENTS_INVALID');
      }
      requireThat(!busy, 'HF_ROUTE_BUSY');
      requireThat(submissions < config.callLimit, 'HF_SESSION_CALL_LIMIT');
      busy = acquired = true;
      controller = new AbortController();
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); reject(new Refusal('HF_TIMEOUT'));
      }, config.timeout); });
      const operation = async () => {
        const request = async (url, method = 'GET', body, media = 'json') => {
          requireThat(!controller.signal.aborted, 'HF_TIMEOUT');
          const res = await fetchImpl(url, { method, redirect: 'manual', signal: controller.signal,
            headers: { authorization: `Bearer ${config.token}`, accept: media === 'sse' ? 'text/event-stream' : 'application/json',
              ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body } : {}) });
          if (controller.signal.aborted) { cancel(res?.body); throw new Refusal('HF_TIMEOUT'); }
          if (res.redirected || res.status >= 300 && res.status < 400) { cancel(res.body); throw new Refusal('HF_REDIRECT_REFUSED'); }
          if (res.status !== 200) { cancel(res.body); throw new Refusal(res.status === 429 ? 'HF_QUOTA_OR_RATE_LIMIT' : 'HF_HTTP_ERROR'); }
          const ct = res.headers.get('content-type') || '';
          const validMedia = media === 'sse' ? /^text\/event-stream(?:\s*;|\s*$)/i.test(ct)
            : /^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|\s*$)/i.test(ct)
              || media === 'source-json' && /^text\/plain(?:\s*;|\s*$)/i.test(ct);
          if (!validMedia) {
            cancel(res.body); throw new Refusal('HF_CONTENT_TYPE_INVALID');
          }
          return media === 'sse' ? completedEvent(res, controller.signal) : boundedJson(res, controller.signal);
        };
        const metaUrl = `https://huggingface.co/api/spaces/${config.id}`;
        qualifyMeta(await request(metaUrl), config);
        const lock = await request(`https://huggingface.co/spaces/${config.id}/raw/${config.sha}/model_lock.json`, 'GET', undefined, 'source-json');
        requireThat(object(lock) && lock.model_id === MODEL && lock.revision === config.modelSha
          && lock.model_role === 'REASONER_ONLY' && lock.hardware === 'zero-a10g'
          && lock.automatic_paid_upgrade === false && Number.isSafeInteger(lock.max_new_tokens)
          && lock.max_new_tokens >= 1 && lock.max_new_tokens <= 192
          && Number.isSafeInteger(lock.gpu_seconds_per_request)
          && lock.gpu_seconds_per_request >= 1 && lock.gpu_seconds_per_request <= 45, 'HF_MODEL_LOCK_MISMATCH');
        const body = JSON.stringify({ goal: args.goal, situation: args.situation, image: null, provider: PROVIDER, consent: true });
        requireThat(!controller.signal.aborted, 'HF_TIMEOUT');
        submissions++; attempted = true;
        const accepted = await request(`${config.origin}/gradio_api/call/v2/reason`, 'POST', body);
        requireThat(object(accepted) && /^[a-zA-Z0-9_-]{1,128}$/.test(accepted.event_id || ''), 'HF_EVENT_ID_INVALID');
        eventId = accepted.event_id;
        const completed = await request(`${config.origin}/gradio_api/call/reason/${eventId}`, 'GET', undefined, 'sse');
        const qualified = qualifyResult(completed.result, config);
        qualifyMeta(await request(metaUrl), config);
        return {
          state: 'ANSWER_RECEIVED', answer: qualified.answer,
          reaction_card: qualified.card,
          observation: { source_sha: config.sha, model_revision_reported: config.modelSha,
            model: MODEL, event_id: eventId, input_sha256: hash(body), answer_sha256: hash(qualified.answer),
            card_json_sha256: hash(qualified.cardText), card_bytes: Buffer.byteLength(qualified.cardText),
            pre_post_metadata_matched: true, inference_submissions_this_session: submissions },
          limits: { output_truth_verified: false, loaded_model_identity_attested: false,
            card_content_id_verified: false, data_classification_verified: false, human_identity_verified: false,
            tool_execution: false, payment: false, model_training: false, durable_memory_admission: false,
            gspc_measurement: false, multi_turn_session: false, synthetic_branches_are_independent_agents: false },
        };
      };
      return await Promise.race([operation(), deadline]);
    } catch (error) {
      return { state: 'UNCHECKABLE', reason: error instanceof Refusal ? error.code : controller?.signal.aborted ? 'HF_TIMEOUT' : 'HF_REQUEST_FAILED',
        request_attempted: attempted, job_accepted: eventId !== null,
        ...(eventId ? { event_id: eventId } : {}),
        execution_state: attempted ? 'MAY_HAVE_RUN' : 'NOT_ATTEMPTED', automatic_retry: false };
    } finally { clearTimeout(timer); if (acquired) busy = false; }
  };
}

export const reasonHfSituation = createHfSituationRunner();
