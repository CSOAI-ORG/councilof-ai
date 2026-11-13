/**
 * Council of AI — owned-file approval→effect demonstrator.
 * Real Ed25519 verification, local byte effect and separate observer process.
 * The signer is a SYNTHETIC TEST KEY, NOT an authenticated human or production grant.
 * No network, payment, remote action, real customer files or GSPC measurement.
 */
import { createHash, generateKeyPairSync, sign, verify, createPublicKey } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const sha256 = b => createHash('sha256').update(b).digest('hex');
const json = x => JSON.stringify(x, null, 2) + '\n';
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, v) => writeFileSync(p, json(v), { flag: 'wx', mode: 0o600 });
const file = (dir, name) => join(dir, name);
const validHex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const deny = (...reasons) => ({ state: 'DENIED', reasons, effect_written: false });
const CONTROL = 'COUNCIL_OWNED_EFFECT_FIXTURE_V1';

export function prepare(dir, at = Date.now()) {
  if (existsSync(file(dir, '.owned-fixture'))) throw Error('Refuse to overwrite fixture');
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  writeFileSync(file(dir, '.owned-fixture'), CONTROL, { flag: 'wx', mode: 0o600 });
  writeFileSync(file(dir, 'private-fixture.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx', mode: 0o600 });
  chmodSync(file(dir, 'private-fixture.pem'), 0o600);
  const trustedKey = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const request = { id: 'demo-request-001', action: 'append_bounded_marker', resource: 'local:effects.jsonl', marker: 'APPROVAL_EFFECT_VISIBLE', tenant: 'synthetic-demo-tenant' };
  write(file(dir, 'request.json'), request);
  const requestDigest = sha256(readFileSync(file(dir, 'request.json')));
  const authority = { schema: 'csoai.synthetic-authority/1', role: 'SYNTHETIC_TEST_PRINCIPAL_NOT_A_HUMAN', principal_ref: 'demo:role:reviewer-1', authority_epoch: 'demo-epoch-1', trust: trustedKey, revoked: false, watch_state: 'CURRENT', allowed_action: request.action, allowed_resource: request.resource, issued_at_ms: at - 10000 };
  write(file(dir, 'authority.json'), authority);
  const statement = { schema: 'csoai.demo-approval/1', id: 'demo-approval-001', principal_ref: authority.principal_ref, authority_epoch: authority.authority_epoch, decision: 'APPROVE', request_sha256: requestDigest, scope: { action: request.action, resource: request.resource }, decided_at_ms: at - 1000, not_before_ms: at - 1000, expires_at_ms: at + 60000 };
  const signature = sign(null, Buffer.from(JSON.stringify(statement)), privateKey).toString('base64');
  write(file(dir, 'approval.json'), { statement, signature, alg: 'Ed25519' });
  return { dir, at, schema: 'csoai.approval-effect-fixture/1', authority_role: authority.role, source: 'synthetic owned file' };
}

function guard(dir) {
  if (readFileSync(file(dir, '.owned-fixture'), 'utf8') !== CONTROL) throw Error('Not an owned fixture');
}
function checkSignature(approval, authority) {
  if (approval?.alg !== 'Ed25519' || typeof approval?.signature !== 'string' || typeof authority?.trust !== 'string') return false;
  try { return verify(null, Buffer.from(JSON.stringify(approval.statement)), createPublicKey(authority.trust), Buffer.from(approval.signature, 'base64')); }
  catch { return false; }
}
export function checkAuthorization(dir, at = Date.now()) {
  guard(dir);
  const request = read(file(dir, 'request.json'));
  const approval = read(file(dir, 'approval.json'));
  const authority = read(file(dir, 'authority.json'));
  const s = approval.statement ?? {};
  const reasons = [];
  if (!checkSignature(approval, authority)) reasons.push('INVALID_SIGNATURE_OR_UNKNOWN_KEY');
  if (authority.role !== 'SYNTHETIC_TEST_PRINCIPAL_NOT_A_HUMAN') reasons.push('UNSUPPORTED_ROLE');
  if (authority.revoked !== false) reasons.push('REVOKED_OR_UNKNOWN_AUTHORITY');
  if (authority.watch_state !== 'CURRENT') reasons.push('NON_CURRENT_WATCH_STATE');
  if (authority.principal_ref !== s.principal_ref || authority.authority_epoch !== s.authority_epoch) reasons.push('AUTHORITY_EPOCH_OR_PRINCIPAL_MISMATCH');
  if (s.decision !== 'APPROVE') reasons.push('NO_APPROVAL');
  if (!validHex(s.request_sha256) || sha256(readFileSync(file(dir, 'request.json'))) !== s.request_sha256) reasons.push('REQUEST_BYTES_CHANGED');
  if (request.id !== 'demo-request-001' || request.tenant !== 'synthetic-demo-tenant') reasons.push('REQUEST_ID_OR_TENANT_MISMATCH');
  if (request.action !== 'append_bounded_marker' || request.resource !== 'local:effects.jsonl' || request.marker !== 'APPROVAL_EFFECT_VISIBLE') reasons.push('OUTSIDE_DEMO_ACTION');
  if (request.action !== authority.allowed_action || request.resource !== authority.allowed_resource || s.scope?.action !== request.action || s.scope?.resource !== request.resource) reasons.push('SCOPE_MISMATCH');
  if (![s.decided_at_ms,s.not_before_ms,s.expires_at_ms,authority.issued_at_ms,at].every(Number.isFinite) || s.decided_at_ms < authority.issued_at_ms || s.decided_at_ms > at || s.not_before_ms > s.decided_at_ms || s.expires_at_ms <= s.not_before_ms || at < s.not_before_ms || at >= s.expires_at_ms) reasons.push('NOT_YET_VALID_OR_EXPIRED');
  if (existsSync(file(dir, 'effect-receipt.json')) || existsSync(file(dir, 'effects.jsonl'))) reasons.push('REPLAY_OR_EXISTING_EFFECT');
  return { state: reasons.length ? 'DENIED' : 'AUTHORIZED', reasons, approval, authority, request };
}

export function execute(dir, at = Date.now()) {
  const result = checkAuthorization(dir, at);
  if (result.state !== 'AUTHORIZED') return deny(...result.reasons);
  const { approval, request, authority } = result;
  const effectText = JSON.stringify({ approval_id: approval.statement.id, request_id: request.id, marker: request.marker, action: request.action }) + '\n';
  writeFileSync(file(dir, 'effects.jsonl'), effectText, { flag: 'wx', mode: 0o600 });
  const receipt = { schema: 'csoai.demo-effect-receipt/1', state: 'EFFECT_OBSERVED_BY_LOCAL_EXECUTOR', observed_at_ms: at, approval_id: approval.statement.id, authority_epoch: authority.authority_epoch, request_sha256: approval.statement.request_sha256, effect_sha256: sha256(effectText), effect_file: 'effects.jsonl', scope: approval.statement.scope, executor: 'local-node-fixture', human_authentication: 'NOT_ESTABLISHED', independent_institutional_observer: false };
  write(file(dir, 'effect-receipt.json'), receipt);
  return { state: 'EXECUTED', reasons: [], effect_written: true, effect_sha256: receipt.effect_sha256 };
}

export function observe(dir) {
  guard(dir);
  if (!existsSync(file(dir, 'effect-receipt.json')) || !existsSync(file(dir, 'effects.jsonl'))) return { state: 'NO_EFFECT', verified: false };
  let receipt, body, approval, authority, request;
  try { receipt = read(file(dir, 'effect-receipt.json')); body = readFileSync(file(dir, 'effects.jsonl'), 'utf8'); approval = read(file(dir, 'approval.json')); authority = read(file(dir, 'authority.json')); request = read(file(dir, 'request.json')); }
  catch { return { state: 'UNCHECKABLE', verified: false }; }
  const row = body.endsWith('\n') && body.split('\n').length === 2 ? (() => { try { return JSON.parse(body.slice(0,-1)); } catch { return null; } })() : null;
  const ok = receipt.schema === 'csoai.demo-effect-receipt/1' && receipt.state === 'EFFECT_OBSERVED_BY_LOCAL_EXECUTOR' && receipt.effect_file === 'effects.jsonl' && validHex(receipt.effect_sha256) && receipt.effect_sha256 === sha256(body) && checkSignature(approval, authority) && approval.statement.decision === 'APPROVE' && receipt.approval_id === approval.statement.id && receipt.authority_epoch === approval.statement.authority_epoch && receipt.request_sha256 === sha256(readFileSync(file(dir, 'request.json'))) && receipt.request_sha256 === approval.statement.request_sha256 && Number.isFinite(receipt.observed_at_ms) && receipt.observed_at_ms >= approval.statement.decided_at_ms && receipt.observed_at_ms >= approval.statement.not_before_ms && receipt.observed_at_ms < approval.statement.expires_at_ms && receipt.scope.action === request.action && receipt.scope.resource === request.resource && row?.approval_id === receipt.approval_id && row?.request_id === request.id && row?.marker === request.marker && row?.action === request.action;
  return { state: ok ? 'EFFECT_READBACK_MATCHED' : 'EFFECT_READBACK_MISMATCH', verified: ok, effects_count: row ? 1 : null, effect_sha256: sha256(body), external_observer: false, observation_process: 'separate-local-process' };
}

function modify(dir, scenario, at) {
  const path = what => file(dir, what + '.json');
  const update = (what, fn) => { const obj = read(path(what)); fn(obj); writeFileSync(path(what), json(obj)); };
  const resign = () => update('approval', x => { x.signature = sign(null, Buffer.from(JSON.stringify(x.statement)), readFileSync(file(dir, 'private-fixture.pem'), 'utf8')).toString('base64'); });
  switch (scenario) {
    case 'revoked': update('authority', x => { x.revoked = true; }); break;
    case 'unknown_revocation': update('authority', x => { delete x.revoked; }); break;
    case 'stale_claim': update('authority', x => { x.watch_state = 'STALE'; }); break;
    case 'expired': update('approval', x => { x.statement.expires_at_ms = at - 1; }); resign(); break;
    case 'not_yet_valid': update('approval', x => { x.statement.decided_at_ms = at + 1000; x.statement.not_before_ms = at + 1000; }); resign(); break;
    case 'wrong_scope': update('approval', x => { x.statement.scope.resource = 'local:another.jsonl'; }); resign(); break;
    case 'tampered_request': update('request', x => { x.marker = 'ALTERED'; }); break;
    case 'invalid_signature': update('approval', x => { x.signature = 'AAAA'; }); break;
    case 'wrong_epoch': update('authority', x => { x.authority_epoch = 'demo-epoch-2'; }); break;
    case 'deny': update('approval', x => { x.statement.decision = 'DENY'; }); resign(); break;
    case 'pass': break;
    default: throw Error('Unknown scenario');
  }
}
function cli(args, inputDir, at = Date.now()) {
  const p = spawnSync(process.execPath, [SELF, args, inputDir, String(at)], { encoding: 'utf8', timeout: 10000 });
  if (p.error || p.status !== 0) throw Error((p.stderr || p.error?.message || 'CLI failed').slice(0,1000));
  return JSON.parse(p.stdout);
}
export function runFixture(scenario, at = Date.now()) {
  const dir = mkdtempSync(join(tmpdir(), 'csoai-approval-effect-'));
  try {
    prepare(dir, at); modify(dir, scenario, at);
    const execResult = cli('--execute', dir, at);
    const observed = cli('--observe', dir, at);
    const result = { scenario, execution: execResult.state, reasons: execResult.reasons, observer: observed.state, actual_effect_written: existsSync(file(dir, 'effects.jsonl')) };
    if (scenario === 'pass') {
      result.replay = cli('--execute', dir, at).state;
      result.replay_does_not_append = readFileSync(file(dir, 'effects.jsonl'), 'utf8').split('\n').length === 2;
      writeFileSync(file(dir,'effects.jsonl'), readFileSync(file(dir,'effects.jsonl'),'utf8') + 'TAMPERED\n');
      result.modified_effect_observer = cli('--observe', dir, at).state;
    }
    return result;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
export function runTrial() {
  const scenarios = ['pass','revoked','unknown_revocation','stale_claim','expired','not_yet_valid','wrong_scope','tampered_request','invalid_signature','wrong_epoch','deny'];
  const cases = scenarios.map(s => runFixture(s));
  const allExpected = cases.every(c => c.scenario === 'pass'
    ? c.execution === 'EXECUTED' && c.observer === 'EFFECT_READBACK_MATCHED' && c.actual_effect_written && c.replay === 'DENIED' && c.replay_does_not_append && c.modified_effect_observer === 'EFFECT_READBACK_MISMATCH'
    : c.execution === 'DENIED' && c.observer === 'NO_EFFECT' && !c.actual_effect_written);
  return { schema:'csoai.approval-effect-trial/1', observed_at: new Date().toISOString(), source_sha256: sha256(readFileSync(SELF)), cases, passed: allExpected, independent_review: 'NOT_CONDUCTED', human_approval: 'SYNTHETIC_KEY_ONLY', actual_effect: 'LOCAL_OWNED_FILE_ONLY', operational_scope: 'One Node process per stage, no network and no durable distributed revocation', production_authority: false };
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  try {
    const [mode, dir, atInput] = process.argv.slice(2);
    if (mode === '--run-fixtures' && !dir) { const report = runTrial(); console.log(json(report)); if (!report.passed) process.exitCode = 1; }
    else if ((mode === '--execute' || mode === '--observe') && dir) {
      const at = atInput !== undefined ? Number(atInput) : Date.now();
      if (!Number.isFinite(at)) throw Error('Invalid test clock');
      console.log(json(mode === '--execute' ? execute(dir, at) : observe(dir)));
    } else { console.error('Usage: node approval-effect-demo.mjs --run-fixtures | --execute OWNED_FIXTURE_DIR [test_time_ms] | --observe OWNED_FIXTURE_DIR'); process.exitCode = 2; }
  } catch (e) { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 2; }
}
