#!/usr/bin/env node
/** Sync the Cloudflare Pages production KV bindings to the ones wrangler.jsonc declares.
 *
 * WHY THIS EXISTS (28 Oct 2026). PR #3528 added HITL_KV to wrangler.jsonc — the single
 * source of truth for this project's bindings — but never bound it in the Cloudflare Pages
 * project. The read-only preflight (scripts/review/pages-release-target.mjs) compares the
 * project's production KV bindings against the declared set and refuses to deploy on a
 * mismatch. That refusal is CORRECT and it stayed in place: every deploy on master failed
 * from 07:13Z on 28 Oct 2026 until the drift was closed. The drift had to be closed on the
 * PRODUCTION side, because the binding is the whole point of the change — /api/hitl keeps a
 * raised challenge and the receipt that answers it only while HITL_KV is bound.
 *
 * The other direction — deleting HITL_KV from wrangler.jsonc — would have restored the
 * deploy by quietly reverting the change, which is the wrong trade: the preflight exists to
 * stop a deploy that would ship a tree whose declared bindings the project does not carry.
 *
 * WHAT IT REFUSES TO DO. It never writes a secret value, never creates a KV namespace,
 * never touches the preview configuration, and never removes a binding the repository does
 * not declare. A production binding the repository does not declare is a FINDING for a
 * human, not something this script silently deletes. It also refuses to apply when a
 * declared namespace id does not exist on this account, because that id is then either a
 * typo or a namespace from a different account, and binding it would either fail or point
 * the production store at somebody else's data.
 *
 * Read-only by default. --apply is the only thing that writes, and the write is a single
 * PATCH of the production deployment config with kv_namespaces replaced and every other
 * field carried through unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const object = v => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null);
const sha = b => createHash('sha256').update(b).digest('hex');
const finiteHex = v => typeof v === 'string' && /^[a-f0-9]{32}$/i.test(v);
const BINDING_NAME = /^[A-Z][A-Z0-9_]*$/;

/**
 * The namespaces wrangler.jsonc declares, in declaration order.
 *
 * Every entry is kept, including one whose binding name or id is malformed. Dropping it
 * here would be a silent removal: the write REPLACES the production kv_namespaces map with
 * the declared one, so an entry dropped by this function is a binding deleted from
 * production. A malformed entry has to be NAMED and refused, not dropped.
 */
export function declaredNamespaces(candidate) {
  const list = Array.isArray(candidate?.kv_namespaces) ? candidate.kv_namespaces : [];
  const out = [];
  const seen = new Set();
  for (const entry of list) {
    const e = object(entry);
    const name = e?.binding;
    if (typeof name !== 'string' || name === '' || seen.has(name)) continue;
    seen.add(name);
    out.push({binding: name, id: e?.id});
  }
  return out;
}

/** The production KV bindings the Cloudflare Pages project actually carries. */
export function remoteNamespaces(project) {
  const production = object(object(project?.deployment_configs)?.production);
  const remote = object(production?.kv_namespaces);
  const out = {};
  for (const [name, value] of Object.entries(remote)) {
    out[name] = object(value)?.namespace_id ?? null;
  }
  return out;
}

/**
 * Compare declared, remote and what this account actually owns.
 * Returns what is wrong and whether it may be applied automatically.
 */
export function planBindings({declared, remote, accountNamespaceIds}) {
  const missing = [];       // declared, absent from production
  const mismatched = [];    // declared, present, but pointing at a different namespace
  const unknownIds = [];    // declared, but the id cannot be confirmed on this account
  const extra = [];         // present in production, not declared — a human's decision
  // An account namespace list that could not be read is UNKNOWN, not an empty list of
  // known ids. Treating "unknown" as "every id is fine" would let a typo straight
  // through into production, which is the one thing this script exists to prevent.
  const accountIds = Array.isArray(accountNamespaceIds) ? new Set(accountNamespaceIds) : null;

  for (const {binding, id} of declared) {
    if (typeof binding !== 'string' || !BINDING_NAME.test(binding)) {
      unknownIds.push({binding, id: id ?? null, reason: 'binding name is not a valid Pages binding name'});
      continue;
    }
    if (!finiteHex(id)) { unknownIds.push({binding, id, reason: 'declared id is not a 32-hex namespace id'}); continue; }
    if (!accountIds) {
      unknownIds.push({binding, id, reason: "the account's KV namespace list could not be read, so this id cannot be confirmed"});
      continue;
    }
    if (!accountIds.has(id)) {
      unknownIds.push({binding, id, reason: 'no KV namespace with this id exists on this account'});
      continue;
    }
    if (!(binding in remote)) missing.push({binding, id});
    else if (remote[binding] !== id) mismatched.push({binding, declared_id: id, remote_id: remote[binding]});
  }
  for (const name of Object.keys(remote)) {
    if (!declared.some(d => d.binding === name)) extra.push({binding: name, remote_id: remote[name]});
  }
  const applyable = missing.length + mismatched.length > 0 && unknownIds.length === 0 && extra.length === 0;
  return {
    declared, remote, missing, mismatched, unknownIds, extra,
    in_sync: missing.length === 0 && mismatched.length === 0 && unknownIds.length === 0 && extra.length === 0,
    applyable,
    refusals: [
      ...unknownIds.map(u => `declared namespace ${u.binding} (${u.id}) — ${u.reason}`),
      ...extra.map(e => `production carries ${e.binding}, which wrangler.jsonc does not declare — a human decides, this script never deletes`),
    ],
  };
}

/** The kv_namespaces map Cloudflare expects: {BINDING: {namespace_id}} */
export function desiredKvMap(declared) {
  const out = {};
  for (const {binding, id} of declared) out[binding] = {namespace_id: id};
  return out;
}

export async function readProject({accountId, token, fetcher = fetch}) {
  if (!finiteHex(accountId) || typeof token !== 'string' || token.length < 12) throw Error('CF_PROJECT_READ_CREDENTIALS_REQUIRED');
  const endpoint = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/pages/projects/councilof-ai';
  const response = await fetcher(endpoint, {method: 'GET', headers: {authorization: 'Bearer ' + token, accept: 'application/json'}, redirect: 'error', signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('CF_PROJECT_READ_HTTP_' + response.status);
  const raw = Buffer.from(await response.arrayBuffer());
  let doc;
  try { doc = JSON.parse(raw); } catch { throw Error('CF_PROJECT_READ_NOT_JSON'); }
  if (doc?.success !== true || !object(doc.result)) throw Error('CF_PROJECT_READ_UNCONFIRMED');
  return {project: doc.result, responseSha256: sha(raw)};
}

/** Every KV namespace id on this account. Used to prove a declared id really exists here. */
export async function readAccountNamespaceIds({accountId, token, fetcher = fetch}) {
  if (!finiteHex(accountId) || typeof token !== 'string' || token.length < 12) throw Error('CF_NAMESPACE_READ_CREDENTIALS_REQUIRED');
  const endpoint = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/storage/kv/namespaces';
  const response = await fetcher(endpoint, {method: 'GET', headers: {authorization: 'Bearer ' + token, accept: 'application/json'}, redirect: 'error', signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('CF_NAMESPACE_READ_HTTP_' + response.status);
  const doc = JSON.parse(await response.text());
  if (doc?.success !== true || !Array.isArray(doc.result)) throw Error('CF_NAMESPACE_READ_UNCONFIRMED');
  return doc.result.map(n => n?.id).filter(finiteHex);
}

/**
 * Replace the production deployment config's kv_namespaces with the declared set and carry
 * every other field of that config through unchanged. One PATCH; no other endpoint is
 * touched; no secret is written.
 */
export async function applyProductionBindings({accountId, token, project, declared, fetcher = fetch}) {
  const endpoint = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/pages/projects/councilof-ai';
  const configs = object(project?.deployment_configs) ?? {};
  const production = {...(object(configs.production) ?? {})};
  production.kv_namespaces = desiredKvMap(declared);
  const body = {deployment_configs: {...configs, production}};
  const response = await fetcher(endpoint, {
    method: 'PATCH',
    headers: {authorization: 'Bearer ' + token, accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  const raw = await response.text();
  let doc;
  try { doc = JSON.parse(raw); } catch { throw Error('CF_BINDING_PATCH_NOT_JSON_HTTP_' + response.status); }
  if (!response.ok || doc?.success !== true) {
    throw Error('CF_BINDING_PATCH_FAILED_HTTP_' + response.status + '_' + JSON.stringify(doc?.errors ?? []).slice(0, 300));
  }
  return {patched: true, responseSha256: sha(raw), remote_after: remoteNamespaces(doc.result)};
}

async function main() {
  const args = process.argv.slice(2);
  const value = k => {const i = args.indexOf(k); return i < 0 ? null : args[i + 1];};
  const configPath = path.resolve(value('--config') ?? 'wrangler.jsonc');
  const apply = args.includes('--apply');
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  const ts = await import('typescript');
  const parsed = ts.readConfigFile(configPath, ts.sys.readFile);
  if (parsed.error) throw Error('CANDIDATE_CONFIG_PARSE_FAILED');
  const declared = declaredNamespaces(parsed.config);

  const {project, responseSha256} = await readProject({accountId, token});
  const accountNamespaceIds = await readAccountNamespaceIds({accountId, token});
  const plan = planBindings({declared, remote: remoteNamespaces(project), accountNamespaceIds});

  const result = {
    schema: 'csoai.pages-bindings-sync/1',
    observed_at: new Date().toISOString(),
    project: 'councilof-ai',
    mode: apply ? 'APPLY' : 'REPORT',
    declared: declared.map(d => ({binding: d.binding, id: d.id})),
    remote: plan.remote,
    account_namespace_ids: accountNamespaceIds,
    account_namespace_count: accountNamespaceIds.length,
    missing: plan.missing,
    mismatched: plan.mismatched,
    unknown_ids: plan.unknownIds,
    extra: plan.extra,
    in_sync: plan.in_sync,
    applyable: plan.applyable,
    refusals: plan.refusals,
    candidate_config_sha256: sha(fs.readFileSync(configPath)),
    project_response_sha256: responseSha256,
    secrets_written: 0,
    namespaces_created: 0,
    bindings_removed: 0,
  };

  if (apply) {
    if (plan.in_sync) {
      result.action = 'ALREADY_IN_SYNC';
    } else if (!plan.applyable) {
      result.action = 'REFUSED';
      result.action_reason = plan.refusals.join('; ') || 'the difference is not an additive reconciliation';
    } else {
      const applied = await applyProductionBindings({accountId, token, project, declared});
      result.action = 'APPLIED';
      result.remote_after = applied.remote_after;
      result.patch_response_sha256 = applied.responseSha256;
      result.bindings_added = [...plan.missing, ...plan.mismatched].map(m => m.binding);
    }
  } else {
    result.action = 'REPORTED_ONLY';
  }

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.action === 'REFUSED' ? 2 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(JSON.stringify({
      schema: 'csoai.pages-bindings-sync/1',
      state: 'UNCHECKABLE',
      reason: /^CF_|^CANDIDATE_/.test(error.message) ? error.message : 'UNEXPECTED_READ_FAILURE',
      secrets_written: 0,
      namespaces_created: 0,
      bindings_removed: 0,
    }));
    process.exitCode = 2;
  });
}
