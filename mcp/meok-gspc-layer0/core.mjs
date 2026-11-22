import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const limits = [
  'Caller-reported command telemetry, not independently observed execution or task correctness.',
  'No Council measurement admission, signing, board write or human decision is performed.',
  'HTTP acceptance does not prove durable storage; no local fallback or automatic retry is attempted.',
];

export function prepareWorkStep(args, now = new Date().toISOString()) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new TypeError('Arguments must be an object.');
  for (const key of ['platform', 'task_summary']) {
    if (typeof args[key] !== 'string' || !args[key].trim()) throw new TypeError(`${key} must be a non-empty string.`);
  }
  if (args.axis !== undefined && (typeof args.axis !== 'string' || !args.axis.trim())) throw new TypeError('axis must be a non-empty string when supplied.');
  const supplied = Object.hasOwn(args, 'exit_code');
  if (supplied && !Number.isSafeInteger(args.exit_code)) throw new TypeError('exit_code must be a safe integer when supplied.');
  return {
    // Existing receiver envelope retained for compatibility; this is not a canonical
    // evidence-event or a measurement card. The timestamp is producer preparation time.
    schema: 'csoai.workstream-live-step/1.0',
    recorded_at: now,
    platform: args.platform,
    axis: args.axis ?? null,
    task_summary: args.task_summary,
    exit_code: supplied ? args.exit_code : null,
    verdict: supplied ? (args.exit_code === 0 ? 'PASS' : 'FAIL') : 'UNCHECKABLE',
    verdict_scope: 'CALLER_REPORTED_COMMAND_EXIT_ONLY',
    task_correctness: 'NOT_ASSESSED',
    axis_validation: 'NOT_PERFORMED',
    measurement_state: 'UNMEASURED',
    signed: false,
    signature: null,
    governance_invariant: 'Measurement, not certification',
  };
}

export async function submitWorkStep(args, {
  endpoint = '',
  fetchImpl = fetch,
  now = new Date().toISOString(),
  timeoutMs = 5000,
} = {}) {
  const entry = prepareWorkStep(args, now); // Reject invalid input before any request.
  const reply = (state, reason, httpStatus = null) => ({
    entry,
    recording: { state, reason, http_status: httpStatus, persistence: 'UNVERIFIED', local_fallback: false },
    limitations: limits,
  });
  try {
    const response = await fetchImpl(new URL(`${endpoint.replace(/\/+$/, '')}/api/workstream-telemetry`), {
      method: 'POST',
      redirect: 'error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.body?.cancel().catch(() => {});
    if (!response.ok) return reply('UNCONFIRMED', 'HTTP_ERROR', response.status);
    // Even a JSON body saying "saved" is not a qualified durable-write contract.
    // Do not let arbitrary receiver fields overwrite the caller outcome or admission state.
    return reply('HTTP_ACCEPTED', 'DURABLE_STORAGE_NOT_VERIFIED', response.status);
  } catch {
    // A timeout may follow a successful server write. Do not assert "not stored" or retry.
    // Avoid returning a transport exception that might contain credential-bearing URLs.
    return reply('UNCONFIRMED', 'TRANSPORT_ERROR');
  }
}

const snapshotLimits = [
  'A local JSON snapshot does not establish current workers, completed jobs, benchmark execution or measurement admission.',
  'The source epoch is declared by the artifact; file modification time is not a measurement timestamp.',
  'Artifact signatures and scientific claims are not verified by this reader.',
];

export function readCapabilitySnapshot(directory, filename, fields) {
  const source = { file: filename, declared_as_of: null, bytes_sha256: null, file_modified_at: null };
  const unavailable = reason => ({ state: 'UNCHECKABLE', reason, source, data: null, limitations: snapshotLimits });
  let fd;
  try {
    // Named pipes must not block the stdio process before fstat can reject them.
    if (!Number.isInteger(fs.constants.O_NONBLOCK) || !Number.isInteger(fs.constants.O_NOFOLLOW)) return unavailable('SNAPSHOT_OPEN_NOT_SUPPORTED');
    fd = fs.openSync(path.join(directory, filename), fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | fs.constants.O_NOFOLLOW);
    const before = fs.fstatSync(fd);
    if (!before.isFile()) return unavailable('ARTIFACT_NOT_REGULAR_FILE');
    if (before.size > 4 * 1024 * 1024) return unavailable('ARTIFACT_TOO_LARGE');
    // A file can grow after the initial stat. Read no more than the limit plus
    // one sentinel byte, rather than allocating/reading until an unbounded EOF.
    const cap = 4 * 1024 * 1024;
    const buffer = Buffer.alloc(cap + 1);
    let length = 0;
    while (length <= cap) {
      const count = fs.readSync(fd, buffer, length, cap + 1 - length, length);
      if (count === 0) break;
      length += count;
    }
    if (length > cap) return unavailable('ARTIFACT_TOO_LARGE');
    const bytes = buffer.subarray(0, length);
    const after = fs.fstatSync(fd);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || length !== before.size) return unavailable('ARTIFACT_CHANGED_DURING_READ');
    const parsed = JSON.parse(bytes.toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return unavailable('ARTIFACT_OBJECT_REQUIRED');
    const data = {};
    for (const [output, input] of Object.entries(fields)) data[output] = parsed[input] ?? null;
    // Missing projection fields are unavailable evidence, not an empty successful snapshot.
    if (Object.values(data).every(value => value === null)) return unavailable('ARTIFACT_FIELDS_MISSING');
    const declaredTime = parsed.as_of ?? parsed.observed_at ?? parsed.recorded_at;
    source.declared_as_of = typeof declaredTime === 'string' ? declaredTime : null;
    source.bytes_sha256 = createHash('sha256').update(bytes).digest('hex');
    source.file_modified_at = after.mtime.toISOString();
    return { state: 'STATIC_OBSERVED', source, data, limitations: snapshotLimits };
  } catch (error) {
    return unavailable(error?.code === 'ENOENT' ? 'ARTIFACT_NOT_FOUND' : error instanceof SyntaxError ? 'ARTIFACT_INVALID_JSON' : 'ARTIFACT_UNREADABLE');
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}
