/**
 * ceremony.js — H.I.M. human-in-the-loop attestation ceremony engine.
 *
 * The honesty core (the thing "others don't do"):
 *   MACHINE-EVIDENCED = a signed card/capsule exists (we cite the shas).
 *   HUMAN-REQUIRED    = only a human can attest it — routed to the review queue, never guessed.
 *   UNMEASURED        = declared, published, never silently failed or passed.
 * The engine never fabricates: an absent measurement is UNMEASURED, and the pack
 * refuses certification language by construction.
 */
import crypto from 'node:crypto';

const COUNCIL = 'https://councilof.ai';
const FORBIDDEN = /\b(certif|accredit|conformity (assessment|opinion)|approved complian)\w*/i;

const stable = (o) => JSON.stringify(o, Object.keys(o).sort ? undefined : undefined);
function canonicalize(o) {
  if (Array.isArray(o)) return o.map(canonicalize);
  if (o && typeof o === 'object') {
    return Object.keys(o).sort().reduce((m, k) => ((m[k] = canonicalize(o[k])), m), {});
  }
  return o;
}
export const sha256 = (o) => crypto.createHash('sha256').update(JSON.stringify(canonicalize(o))).digest('hex');

export async function fetchBundle(fetchImpl, obligation, subjectFilter) {
  const r = await fetchImpl(`${COUNCIL}/api/evidence-bundle?obligation=${encodeURIComponent(obligation)}&preview=true`);
  if (!r.ok) return { state: 'UNREACHABLE', cards: [], relevant: 0 };
  const j = await r.json();
  let cards = j.cards || [];
  if (subjectFilter) {
    const re = new RegExp(subjectFilter, 'i');
    cards = cards.filter(c => re.test(c.subject || ''));
  }
  return { state: j.state || 'UNKNOWN', cards, relevant: j.relevant_signed_cards ?? cards.length };
}

async function fetchBoard(fetchImpl) {
  const r = await fetchImpl(`${COUNCIL}/api/gspc`);
  if (!r.ok) return null;
  const j = await r.json();
  const axes = {};
  for (const a of j.axes || []) axes[a.axis] = a;
  return axes;
}

export async function runCeremony({ frameworkSlug, frameworksDir, subject, fetchImpl = fetch, now = new Date().toISOString() }) {
  const fw = JSON.parse(await fsRead(`${frameworksDir}/${frameworkSlug}.json`));
  const checkpoints = [];
  const tasks = [];
  const cache = new Map();

  for (const cp of fw.checkpoints) {
    if (cp.mode === 'machine') {
      const ev = cp.evidence || {};
      let hit = null;
      if (ev.kind === 'bundle') {
        const key = ev.obligation + '|' + (ev.subjectFilter || '');
        if (!cache.has(key)) cache.set(key, await fetchBundle(fetchImpl, ev.obligation, ev.subjectFilter));
        hit = cache.get(key);
      } else if (ev.kind === 'board') {
        const axes = cache.get('board') || (cache.set('board', await fetchBoard(fetchImpl)), cache.get('board'));
        const found = (ev.axes || []).filter(a => axes?.[a]?.status === 'MEASURED');
        hit = found.length ? { state: 'MEASURED', cards: found.map(a => ({ subject: `axis:${a}`, sha256: `board:${a}`, as_of: axes[a].as_of?.fetched_at })) } : { state: 'UNMEASURED', cards: [] };
      }
      if (hit && (hit.cards?.length || hit.relevant > 0)) {
        checkpoints.push({ id: cp.id, requirement: cp.requirement, status: 'MACHINE-EVIDENCED',
          evidence: hit.cards.slice(0, 5).map(c => ({ subject: c.subject, sha256: c.sha256, as_of: c.as_of || null })),
          evidence_count: hit.cards.length || hit.relevant });
      } else {
        checkpoints.push({ id: cp.id, requirement: cp.requirement, status: 'UNMEASURED',
          reason: 'no signed evidence found — declared, never fabricated; run the census/measure first' });
      }
    } else {
      // HUMAN-REQUIRED — routed to the review queue, always
      const task = { task_id: `${frameworkSlug}:${cp.id}`, checkpoint: cp.id, requirement: cp.requirement,
        guidance: cp.guidance || null, decision: 'PENDING' };
      checkpoints.push({ id: cp.id, requirement: cp.requirement, status: 'HUMAN-REQUIRED', task_id: task.task_id });
      tasks.push(task);
    }
  }

  const pack = {
    schema: 'csoai.him-attestation-pack/0.1',
    subject, framework: { slug: fw.slug, title: fw.title },
    doctrine: fw.doctrine,
    statement: 'Human-in-the-loop attestation of evidence. Machine checkpoints carry signed measurement evidence; human checkpoints carry named human decisions. This is not conformity certification and grants no regulatory status.',
    as_of: now,
    segments: fw.segments,
    checkpoints,
    human_tasks: tasks.map(t => t.task_id),
  };
  pack.ceremony_sha256 = sha256(pack);
  return { pack, tasks };
}

async function fsRead(p) { const fs = await import('node:fs'); return fs.readFileSync(p, 'utf8'); }

/** Attach a signed human decision to the pack; verifies the signature. */
export function attachHumanDecision(pack, { task_id, decision, note, humanKeyPublic, signatureB64, ts }) {
  if (!['SIGNED', 'FIX_REQUESTED', 'DEFERRED', 'ESCALATED'].includes(decision)) throw new Error('bad decision');
  if (FORBIDDEN.test(note || '')) throw new Error('attestation language rejected: certification words are forbidden');
  const rec = { task_id, decision, note: note || '', human_key_id: sha256(humanKeyPublic).slice(0, 16), ts };
  const ok = crypto.verify(null, Buffer.from(JSON.stringify({ task_id, decision, note: rec.note, ts })), humanKeyPublic, Buffer.from(signatureB64, 'base64'));
  if (!ok) throw new Error('human signature invalid');
  pack.human_decisions = pack.human_decisions || [];
  pack.human_decisions.push(rec);
  pack.ceremony_sha256 = sha256(pack);
  return rec;
}

/** Finalize: every human task must have a decision; no forbidden words anywhere; manifest out. */
export function finalize(pack) {
  const pending = (pack.human_tasks || []).filter(id => !(pack.human_decisions || []).some(d => d.task_id === id));
  if (pending.length) throw new Error(`human-in-the-loop incomplete: ${pending.length} pending → ${pending[0]} (refusing to finalize — we do not fake it)`);
  const text = JSON.stringify(canonicalize(pack));
  if (FORBIDDEN.test(text)) throw new Error('pack contains forbidden certification language');
  const machine = pack.checkpoints.filter(c => c.status === 'MACHINE-EVIDENCED').length;
  const unmeasured = pack.checkpoints.filter(c => c.status === 'UNMEASURED').length;
  const human = pack.checkpoints.filter(c => c.status === 'HUMAN-REQUIRED').length;
  return {
    schema: 'csoai.him-attestation-manifest/0.1',
    ceremony_sha256: pack.ceremony_sha256,
    subject: pack.subject, framework: pack.framework, as_of: pack.as_of,
    counts: { machine_evidenced: machine, human_signed: human, unmeasured_declared: unmeasured },
    statement: pack.statement,
    verify: 'https://councilof.ai/gspc-verify',
    doctrine: 'measurement, never certification · human-in-the-loop · nothing fabricated',
  };
}
