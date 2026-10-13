/** Read-only public Ask transport. No model, confirmation, payment, UI action or store. */
const PUBLIC_ASK_URL = 'https://councilof.ai/api/agui/run';
const MAX_SSE_BYTES = 512 * 1024, MAX_TRANSCRIPT_BYTES = 768 * 1024, MAX_EVENTS = 2048, MAX_QUESTION = 1000;
const TRANSCRIPT_SCHEMA = 'csoai.public-ask-transcript/1';
const TRANSCRIPT_SCOPE = 'Saved public Ask stream; byte consistency only. No trusted authorship/time, fresh measurement, model inference, persisted customer case, payment or delivery acceptance.';
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
const text = value => typeof value === 'string' ? value : null;
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[\u0000-\u0020\u007f]/.test(value);
function questionText(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_QUESTION) throw new Error('Enter a public-source question of 1–1000 characters.');
  return value.trim();
}
function timestamp(value) {
  if (typeof value !== 'string' || value.endsWith('-00:00')) throw new Error('A full known-offset receipt time is required.');
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!m) throw new Error('A full known-offset receipt time is required.');
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number), leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (mo < 1 || mo > 12 || d < 1 || d > days[mo - 1] || h > 23 || mi > 59 || s > 59 || (m[7] !== 'Z' && (+m[8] > 23 || +m[9] > 59)) || !Number.isFinite(Date.parse(value))) throw new Error('The receipt time is invalid.');
  return value;
}
function parseSse(buffer) {
  if (typeof buffer !== 'string') throw new Error('SSE text is required.');
  const events = []; let rest = buffer.replace(/\r\n/g, '\n'), cut;
  while ((cut = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, cut); rest = rest.slice(cut + 2); let event = null; const data = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!data.length) continue;
    let parsed; try { parsed = record(JSON.parse(data.join('\n'))); } catch { throw new Error('The public Ask stream contains malformed JSON.'); }
    if (!parsed || typeof parsed.type !== 'string' || (event !== null && event !== parsed.type)) throw new Error('The public Ask stream contains an invalid event.');
    events.push({ event, data: parsed });
    if (events.length > MAX_EVENTS) throw new Error('The public Ask stream has too many events.');
  }
  return { events, rest };
}
function newPublicRun(question) { return { question: questionText(question), threadId: null, runId: null, status: 'streaming', tools: [], text: '', confirm: null, consentRequired: null, result: null, error: null }; }
/** Tool cards and text follow aguiTalk's read-only projection; raw events remain the source. */
function reducePublicRun(run, ev) {
  switch (ev.type) {
    case 'RUN_STARTED': return { ...run, threadId: ev.threadId, runId: ev.runId };
    case 'TOOL_CALL_START': {
      if (!identifier(ev.toolCallId) || !text(ev.toolCallName)) throw new Error('A tool start has no actual identity.');
      if (run.tools.some(card => card.id === ev.toolCallId)) return run;
      return { ...run, tools: [...run.tools, { id: ev.toolCallId, name: ev.toolCallName, argsText: '', status: 'running' }] };
    }
    case 'TOOL_CALL_ARGS': return { ...run, tools: run.tools.map(card => card.id === ev.toolCallId ? { ...card, argsText: card.argsText + (text(ev.delta) ?? '') } : card) };
    case 'TOOL_CALL_RESULT': {
      if (!identifier(ev.toolCallId)) throw new Error('A tool result has no actual identity.');
      let body; try { body = record(JSON.parse(text(ev.content) ?? '')); } catch { throw new Error('A tool result is malformed.'); }
      if (!body) throw new Error('A tool result is malformed.');
      const citation = record(body.citation), previous = run.tools.find(card => card.id === ev.toolCallId);
      const card = { id: ev.toolCallId, name: text(body.tool) ?? previous?.name ?? 'tool', argsText: record(body.args) ? JSON.stringify(body.args) : previous?.argsText ?? '', status: 'done', label: text(body.label), summary: text(body.summary), citation: citation ? { tool: text(citation.tool), record_id: text(citation.record_id), url: text(citation.url) } : null, output: body.output };
      return { ...run, tools: previous ? run.tools.map(value => value.id === card.id ? card : value) : [...run.tools, card] };
    }
    case 'TEXT_MESSAGE_CONTENT': return { ...run, text: run.text + (text(ev.delta) ?? '') };
    case 'CUSTOM':
      if (ev.name === 'confirm_required') return { ...run, confirm: record(ev.value) ?? {}, status: 'held' };
      if (ev.name === 'consent_required') return { ...run, consentRequired: record(ev.value) ?? {}, status: 'held' };
      return run;
    case 'RUN_FINISHED': {
      const result = record(ev.result);
      return { ...run, result, status: run.confirm || run.consentRequired || result?.awaiting_confirmation === true ? 'held' : 'done' };
    }
    case 'RUN_ERROR': return { ...run, status: 'error', error: text(ev.message) ?? 'The public Ask run failed.' };
    default: return run; // STATE/A2UI/frontend events are retained, never executed.
  }
}
function decodeRun(question, bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.byteLength > MAX_SSE_BYTES) throw new Error('The public Ask stream is empty or exceeds 512 KiB.');
  let decoded; try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('The public Ask stream is not valid UTF-8.'); }
  const parsed = parseSse(decoded);
  if (parsed.rest.trim() || !parsed.events.length) throw new Error('The public Ask stream ended incompletely.');
  let run = newPublicRun(question), started = false, terminal = false;
  for (const { data: ev } of parsed.events) {
    if (!Number.isSafeInteger(ev.timestamp) || ev.timestamp < 0) throw new Error('An Ask event has no valid recorded timestamp.');
    if (terminal) throw new Error('An Ask event follows the terminal event.');
    if (!started) {
      if (ev.type !== 'RUN_STARTED' || !identifier(ev.threadId) || !identifier(ev.runId)) throw new Error('The Ask stream has no actual starting identity.');
      started = true;
    } else if (ev.type === 'RUN_STARTED') throw new Error('The Ask stream contains a duplicate start.');
    if (ev.type === 'RUN_FINISHED') {
      if (ev.threadId !== run.threadId || ev.runId !== run.runId) throw new Error('The Ask run identities differ.');
      if (!record(ev.result) || run.tools.some(card => card.status !== 'done')) throw new Error('The Ask stream has an incomplete terminal result.');
      terminal = true;
    } else if (ev.type === 'RUN_ERROR') terminal = true;
    run = reducePublicRun(run, ev);
  }
  if (!terminal) throw new Error('The Ask stream has no terminal result.');
  return { run, events: parsed.events };
}
function base64(bytes) { let value = ''; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function unbase64(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_SSE_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('The saved stream has invalid base64.');
  const decoded = atob(value), bytes = Uint8Array.from(decoded, x => x.charCodeAt(0));
  if (base64(bytes) !== value) throw new Error('The saved stream has noncanonical base64.');
  return bytes;
}
async function digest(bytes, cryptoImpl) {
  if (!cryptoImpl?.subtle) throw new Error('This browser cannot check the stream digest.');
  return [...new Uint8Array(await cryptoImpl.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function makePublicTranscript(question, raw, receivedAt, cryptoImpl = globalThis.crypto) {
  const claimedQuestion = questionText(question), bytes = Uint8Array.from(raw), parsed = decodeRun(claimedQuestion, bytes);
  return { schema: TRANSCRIPT_SCHEMA, question: claimedQuestion, source: { url: PUBLIC_ASK_URL, method: 'POST', received_at_utc: timestamp(receivedAt), http_status: 200, content_type: 'text/event-stream', bytes: bytes.byteLength, sha256: await digest(bytes, cryptoImpl), raw_base64: base64(bytes) }, receipt: { unsigned: true, scope: TRANSCRIPT_SCOPE }, ...parsed };
}
function serializePublicTranscript(value) {
  const result = JSON.stringify({ schema: value.schema, question: value.question, source: value.source, receipt: value.receipt }, null, 2);
  if (new TextEncoder().encode(result).byteLength > MAX_TRANSCRIPT_BYTES) throw new Error('The saved transcript exceeds 768 KiB.');
  return result;
}
async function reopenPublicTranscript(fileText, cryptoImpl = globalThis.crypto, currentTime = new Date().toISOString()) {
  if (typeof fileText !== 'string' || new TextEncoder().encode(fileText).byteLength > MAX_TRANSCRIPT_BYTES) throw new Error('Choose a public Ask transcript smaller than 768 KiB.');
  let value; try { value = record(JSON.parse(fileText)); } catch { throw new Error('The saved transcript is not JSON.'); }
  const source = record(value?.source), receipt = record(value?.receipt);
  if (value?.schema !== TRANSCRIPT_SCHEMA || source?.url !== PUBLIC_ASK_URL || source?.method !== 'POST' || source?.http_status !== 200 || source?.content_type !== 'text/event-stream' || receipt?.unsigned !== true || receipt.scope !== TRANSCRIPT_SCOPE) throw new Error('This is not a supported unsigned public Ask transcript.');
  timestamp(source.received_at_utc); timestamp(currentTime);
  if (Date.parse(source.received_at_utc) > Date.parse(currentTime)) throw new Error('The saved claimed receipt time is in the future.');
  const bytes = unbase64(source.raw_base64);
  if (!Number.isSafeInteger(source.bytes) || source.bytes !== bytes.byteLength || !/^[0-9a-f]{64}$/.test(source.sha256 ?? '') || await digest(bytes, cryptoImpl) !== source.sha256) throw new Error('The saved stream byte count or digest does not match.');
  return makePublicTranscript(value.question, bytes, source.received_at_utc, cryptoImpl);
}
function abortError() { return new DOMException('The public Ask request was aborted.', 'AbortError'); }
function abortable(promise, signal) {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const stop = () => reject(abortError()); signal.addEventListener('abort', stop, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener('abort', stop));
  });
}
async function readRaw(response, signal) {
  const length = response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_SSE_BYTES)) throw new Error('The public Ask stream exceeds its byte limit.');
  if (!response.body?.getReader) {
    const bytes = new Uint8Array(await abortable(response.arrayBuffer(), signal));
    if (bytes.byteLength > MAX_SSE_BYTES) throw new Error('The public Ask stream exceeds its byte limit.');
    return bytes;
  }
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await abortable(reader.read(), signal); if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('The public Ask stream has invalid bytes.');
      size += value.byteLength;
      if (size > MAX_SSE_BYTES) throw new Error('The public Ask stream exceeds its byte limit.');
      chunks.push(Uint8Array.from(value));
    }
  } catch (error) { Promise.resolve(reader.cancel()).catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; } return bytes;
}
async function streamPublicAsk({ question, fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto, signal: parentSignal, now = () => new Date().toISOString(), timeoutMs = 15000 }) {
  const claimedQuestion = questionText(question);
  if (typeof fetchImpl !== 'function' || !cryptoImpl?.subtle) throw new Error('This browser cannot safely read and retain Ask streams.');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 15000) throw new Error('The Ask deadline is invalid.');
  const controller = new AbortController(), signal = controller.signal; let timedOut = false;
  const stop = () => controller.abort(); if (parentSignal?.aborted) stop(); else parentSignal?.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    if (signal.aborted) throw abortError();
    const response = await abortable(fetchImpl(PUBLIC_ASK_URL, { method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer', signal, headers: { 'content-type': 'application/json', accept: 'text/event-stream' }, body: JSON.stringify({ messages: [{ id: 'm1', role: 'user', content: claimedQuestion }] }) }), signal);
    if (response.status !== 200 || response.redirected || response.url !== PUBLIC_ASK_URL || !/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('The public Ask endpoint returned an unexpected response.');
    const raw = await readRaw(response, signal);
    return await abortable(makePublicTranscript(claimedQuestion, raw, now(), cryptoImpl), signal);
  } catch (error) { if (timedOut) throw new Error('The public Ask request timed out. You can retry.'); throw error; }
  finally { clearTimeout(timer); parentSignal?.removeEventListener('abort', stop); }
}
function createPublicAskController({ onState = () => {}, ...options } = {}) {
  let sequence = 0, controller = null, busy = false;
  function cancel() { sequence++; controller?.abort(); controller = null; busy = false; onState({ state: 'cancelled' }); }
  async function ask(question) {
    if (busy) return null;
    try { questionText(question); } catch (error) { onState({ state: 'error', message: error.message }); return null; }
    const ticket = ++sequence, requestController = new AbortController(); controller = requestController; busy = true; onState({ state: 'loading' });
    try {
      const transcript = await streamPublicAsk({ ...options, question, signal: requestController.signal });
      if (ticket !== sequence) return null;
      const state = transcript.run.status === 'done' ? 'ready' : transcript.run.status === 'held' ? 'held' : 'error';
      onState({ state, transcript, message: transcript.run.error }); return transcript;
    } catch (error) { if (ticket === sequence) onState({ state: 'error', message: error.name === 'AbortError' ? 'The public Ask request was cancelled.' : error.message }); return null; }
    finally { if (ticket === sequence) { busy = false; controller = null; } }
  }
  return { ask, cancel, isBusy: () => busy };
}
export { PUBLIC_ASK_URL, MAX_SSE_BYTES, MAX_TRANSCRIPT_BYTES, parseSse, newPublicRun, reducePublicRun, streamPublicAsk, makePublicTranscript, reopenPublicTranscript, serializePublicTranscript, createPublicAskController };
