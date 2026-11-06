/**
 * policy.js — CSOAI x402 policy engine (fail-closed)
 * Doctrine: measurement, not certification · UNMEASURED = fail-closed, never buy ·
 * every decision cites its basis. Nothing here trusts the server: terms are re-checked locally.
 */
import fs from 'node:fs';

export function loadPolicy(p) {
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return assertShape(raw);
}

export function assertShape(p) {
  if (!p.allowlist?.payTo?.length) throw new Error('policy: allowlist.payTo required');
  if (!p.allowlist.resourcePrefixes?.length) throw new Error('policy: allowlist.resourcePrefixes required');
  if (!p.caps?.perCallAtomic) throw new Error('policy: caps.perCallAtomic required');
  for (const a of p.allowlist.payTo) if (!/^0x[0-9a-fA-F]{40}$/.test(a)) throw new Error('policy: bad payTo ' + a);
  return p;
}

export function checkPayTo(policy, payTo) {
  return policy.allowlist.payTo.some(a => a.toLowerCase() === String(payTo).toLowerCase())
    ? null : `payTo ${payTo} not in allowlist`;
}

export function checkResource(policy, url) {
  return policy.allowlist.resourcePrefixes.some(pre => String(url).startsWith(pre))
    ? null : `resource ${url} outside allowed prefixes`;
}

export function checkSubject(policy, subject) {
  if (!policy.allowlist.subjects) return null;
  if (policy.allowlist.subjects.includes('*')) return null;
  return policy.allowlist.subjects.includes(subject) ? null : `subject ${subject} not allowlisted`;
}

export function checkAssetNetwork(policy, acc) {
  const net = acc.network, asset = String(acc.asset || '').toLowerCase();
  if (policy.allowlist.networks && !policy.allowlist.networks.includes(net)) return `network ${net} not allowed`;
  if (policy.allowlist.assets && !policy.allowlist.assets.map(a => String(a).toLowerCase()).includes(asset)) return `asset ${asset} not allowed`;
  return null;
}

export function checkPerCall(policy, amountAtomic) {
  return BigInt(amountAtomic) <= BigInt(policy.caps.perCallAtomic)
    ? null : `amount ${amountAtomic} exceeds per-call cap ${policy.caps.perCallAtomic}`;
}

/** Day spend from the decision ledger (same local midnight, UTC). */
export function daySpent(ledgerPath, now = new Date()) {
  if (!fs.existsSync(ledgerPath)) return 0n;
  const today = now.toISOString().slice(0, 10);
  let sum = 0n;
  for (const line of fs.readFileSync(ledgerPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (r.decision === 'BOUGHT' && String(r.ts).slice(0, 10) === today) sum += BigInt(r.amount_atomic || 0);
    } catch { /* tolerate partial lines */ }
  }
  return sum;
}

export function checkPerDay(policy, amountAtomic, ledgerPath) {
  const spent = daySpent(ledgerPath);
  const cap = BigInt(policy.caps.perDayAtomic || '0');
  if (cap === 0n) return null; // no daily cap configured
  return spent + BigInt(amountAtomic) <= cap
    ? null : `day cap: spent ${spent} + ${amountAtomic} > ${cap}`;
}

/** Run every check; returns list of refusal reasons (empty = allowed). */
export function evaluate(policy, { url, subject, accepts, ledgerPath }) {
  const acc = accepts?.[0];
  const reasons = [];
  if (!acc) return ['challenge had no accepts[]'];
  for (const c of [checkResource(policy, url), checkSubject(policy, subject), checkPayTo(policy, acc.payTo),
    checkAssetNetwork(policy, acc), checkPerCall(policy, acc.amount),
    checkPerDay(policy, acc.amount, ledgerPath)]) if (c) reasons.push(c);
  return reasons;
}
