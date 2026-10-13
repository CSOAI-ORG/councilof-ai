#!/usr/bin/env node
/**
 * Release-ceremony rehearsal — fixture-only, no secrets, no network, no production keys.
 *
 * Rehearses the corrected architecture target:
 *   build → verify exact bytes → sign (throwaway key) → publish to local "mirror" dirs →
 *   anonymous readback → record transparency/timestamp STATE (never an implied proof) →
 *   emit a csoai.signed-release-manifest/0.1 instance.
 *
 * Fail-closed rules (tested in release-ceremony-rehearsal.test.mjs):
 *   - signer unavailable        → ceremony aborts, NO manifest is written;
 *   - all mirror readbacks fail → ceremony aborts, NO release is claimed;
 *   - transparency unavailable  → ceremony continues with state UNCHECKABLE —
 *                                 a proof is never claimed from an unavailable service.
 */
import { createHash, generateKeyPairSync, sign as edSign, verify as edVerify } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const canonical = (o) => JSON.stringify(sortKeys(o));
const sortKeys = (o) => Array.isArray(o) ? o.map(sortKeys)
  : (o && typeof o === 'object'
      ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]))
      : o);

export class CeremonyError extends Error {}

/**
 * @param {object} deps injected dependencies (fixtures only)
 * @param {string} deps.workDir   scratch dir holding the "release" files
 * @param {string[]} deps.mirrorDirs  local dirs standing in for public mirrors
 * @param {object|null} deps.signer   {keyId, did, authority, sign(bytes)->hex} or null to simulate unavailable
 * @param {object} deps.timestamp     {stamp(bytes)->{state,ref}}; may throw to simulate unavailable
 */
export function rehearse({ workDir, mirrorDirs, signer, timestamp }) {
  const files = readdirSync(workDir).filter((f) => f.endsWith('.bin')).sort()
    .map((f) => {
      const bytes = readFileSync(join(workDir, f));
      return { path: f, bytes: bytes.length, sha256: sha256(bytes) };
    });
  if (files.length === 0) throw new CeremonyError('no release bytes in workDir');

  const manifest = {
    schema: 'csoai.signed-release-manifest/0.1',
    release_id: `rehearsal-${Date.now()}`,
    created_at: new Date().toISOString(),
    supersedes: null,
    source: { repo: 'fixture-local', commit: '0'.repeat(40), branch: null, dirty_files: 0 },
    files,
    signer: {
      did: signer?.did ?? null, key_id: signer?.keyId ?? null,
      alg: 'Ed25519', authority: signer?.authority ?? null, sig: null, rotation_ref: null,
    },
    proof_state: { rekor: 'NOT_ATTEMPTED', ots: 'NOT_ATTEMPTED', rekor_ref: null, ots_ref: null,
                   binding_note: 'rehearsal: no transparency binding attempted' },
    mirrors: [], readbacks: [],
    correction: { state: 'CURRENT', note: null },
  };

  // 1. signer presence gate — fail closed BEFORE any publish: no signer, nothing happens
  if (!signer) throw new CeremonyError('SIGNER_UNAVAILABLE: ceremony aborts; no manifest written');

  // 2. publish to mirrors + anonymous readback (exact bytes)
  for (const dir of mirrorDirs) {
    let state = 'UNREACHABLE';
    try {
      mkdirSync(dir, { recursive: true });
      for (const f of files) writeFileSync(join(dir, f.path), readFileSync(join(workDir, f.path)));
      state = 'PUSHED';
    } catch { /* recorded below */ }
    manifest.mirrors.push({ locator: dir, kind: 'release-archive', state });
  }
  for (const dir of mirrorDirs) {
    try {
      const ok = files.every((f) => existsSync(join(dir, f.path)) && sha256(readFileSync(join(dir, f.path))) === f.sha256);
      manifest.readbacks.push({
        locator: dir, retrieved_at: new Date().toISOString(),
        served_sha256: ok ? sha256(Buffer.from(canonical(files))) : null,
        matches_release_bytes: ok, state: ok ? 'VALID' : 'INVALID',
      });
    } catch {
      manifest.readbacks.push({ locator: dir, retrieved_at: new Date().toISOString(),
                                served_sha256: null, matches_release_bytes: null, state: 'UNCHECKABLE' });
    }
  }
  if (!manifest.readbacks.some((r) => r.state === 'VALID')) {
    throw new CeremonyError('NO_VALID_READBACK: release not proven in public; ceremony aborts');
  }

  // 3. transparency/timestamp — fail closed on the CLAIM, not the ceremony
  try {
    const t = timestamp.stamp(Buffer.from(canonical(files)));
    manifest.proof_state.ots = t.state;
    manifest.proof_state.ots_ref = t.ref ?? null;
    manifest.proof_state.binding_note = t.binding_note ?? manifest.proof_state.binding_note;
  } catch {
    manifest.proof_state.ots = 'UNCHECKABLE';
    manifest.proof_state.binding_note = 'timestamp service unavailable in rehearsal; state UNCHECKABLE, no proof claimed';
  }

  // 4. sign the FINAL manifest — the signature binds mirrors, readbacks and proof states,
  //    not an early skeleton. A signing failure here still aborts with nothing claimed.
  try {
    manifest.signer.sig = signer.sign(Buffer.from(canonical({ ...manifest, signer: { ...manifest.signer, sig: null } })));
  } catch {
    throw new CeremonyError('SIGNING_FAILED: ceremony aborts; no manifest emitted');
  }

  return manifest;
}

/** Throwaway Ed25519 fixture signer. Never a production key. */
export function fixtureSigner() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    did: 'did:web:fixture.invalid#rehearsal-1', keyId: 'throwaway-rehearsal-key',
    authority: 'fixture-only rehearsal; no estate authority',
    publicKey,
    sign: (bytes) => edSign(null, bytes, privateKey).toString('hex'),
    verify: (bytes, hex) => edVerify(null, bytes, publicKey, Buffer.from(hex, 'hex')),
  };
}
