#!/usr/bin/env node
/** him-attest CLI
 *  run      – build the ceremony pack + human task queue for a subject × framework
 *  decide   – attach one signed human decision to the pack
 *  finalize – verify every human task is decided; emit the manifest (refuses if anything is faked)
 */
import fs from 'node:fs';
import { runCeremony, attachHumanDecision, finalize } from './ceremony.js';
import { ensureKey, signDecision } from './human-key.js';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];
const DIR = new URL('../frameworks/', import.meta.url).pathname;
const packPath = arg('--pack', './ceremony-pack.json');

if (cmd === 'run') {
  const { pack, tasks } = await runCeremony({
    frameworkSlug: arg('--framework', 'eu-ai-act-art50'),
    frameworksDir: DIR.replace(/\/$/, ''),
    subject: arg('--subject', 'example-subject'),
  });
  fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));
  fs.writeFileSync(packPath.replace('.json', '.tasks.json'), JSON.stringify(tasks, null, 2));
  const m = pack.checkpoints.reduce((a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a), {});
  console.log(`pack → ${packPath}  ceremony_sha256=${pack.ceremony_sha256}`);
  console.log('checkpoints:', JSON.stringify(m), '· human tasks:', pack.human_tasks.length);
} else if (cmd === 'decide') {
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const { privateKey, publicKey } = ensureKey(arg('--key', './him-human.key'));
  const decision = arg('--decision', 'SIGNED');
  const note = arg('--note', '');
  const ts = new Date().toISOString();
  const task_id = arg('--task');
  if (!task_id) { console.error('--task required'); process.exit(2); }
  const sig = signDecision(privateKey, { task_id, decision, note, ts });
  attachHumanDecision(pack, { task_id, decision, note, ts, humanKeyPublic: publicKey, signatureB64: sig });
  fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));
  console.log(`decision ${decision} attached → ${task_id}`);
} else if (cmd === 'finalize') {
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const manifest = finalize(pack);
  const out = packPath.replace('.json', '.manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
  console.log(`manifest → ${out}\n${JSON.stringify(manifest.counts)}\n${manifest.doctrine}`);
} else {
  console.log('usage: index.mjs run|decide|finalize [--framework …] [--subject …] [--pack …] [--task …] [--decision SIGNED|FIX_REQUESTED|DEFERRED|ESCALATED] [--note …] [--key …]');
}
