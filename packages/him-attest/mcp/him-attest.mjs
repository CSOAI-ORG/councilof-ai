#!/usr/bin/env node
/** him-attest MCP stdio tool — human-in-the-loop ceremonies for any MCP host.
 * Tools: him_attest_run, him_attest_queue, him_attest_decide.
 * Humans decide via this tool + their key (keystone in prod). The engine refuses
 * to finalize while any human task is pending — it never fakes completion.
 */
import fs from 'node:fs';
import { runCeremony, attachHumanDecision, finalize } from '../src/ceremony.js';
import { ensureKey, signDecision } from '../src/human-key.js';

const DIR = new URL('../frameworks/', import.meta.url).pathname;
const TOOLS = [
  { name: 'him_attest_run', description: 'Build a human-in-the-loop attestation ceremony pack (machine evidence + human task queue) for subject × framework', inputSchema: { type: 'object', properties: { subject: { type: 'string' }, framework: { type: 'string', enum: ['eu-ai-act-art50', 'eu-ai-act-art53', 'dora-art28-30', 'cra', 'iso-42001-lite', 'nist-ai-rmf-lite'] } }, required: ['subject', 'framework'] } },
  { name: 'him_attest_queue', description: 'List pending human tasks in a ceremony pack', inputSchema: { type: 'object', properties: { pack: { type: 'string' } }, required: ['pack'] } },
  { name: 'him_attest_decide', description: 'Attach a signed human decision (SIGNED|FIX_REQUESTED|DEFERRED|ESCALATED). The human is the signer; the tool never invents decisions.', inputSchema: { type: 'object', properties: { pack: { type: 'string' }, task: { type: 'string' }, decision: { type: 'string' }, note: { type: 'string' }, key: { type: 'string' } }, required: ['pack', 'task', 'decision'] } },
];

function reply(id, result) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n'); }
function err(id, m) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message: m } }) + '\n'); }

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) handle(JSON.parse(l)); } });

async function handle({ id, method, params }) {
  try {
    if (method === 'initialize') return reply(id, { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'csoai-him-attest', version: '0.1.0' } });
    if (method === 'tools/list') return reply(id, { tools: TOOLS });
    if (method === 'tools/call') {
      const a = params?.arguments || {};
      if (params.name === 'him_attest_run') {
        const { pack, tasks } = await runCeremony({ frameworkSlug: a.framework, frameworksDir: DIR.replace(/\/$/, ''), subject: a.subject });
        const out = `./${a.subject}.${a.framework}.pack.json`;
        fs.writeFileSync(out, JSON.stringify(pack, null, 2));
        return reply(id, { content: [{ type: 'text', text: `pack=${out} ceremony_sha256=${pack.ceremony_sha256} human_tasks=${pack.human_tasks.length} ${JSON.stringify(tasks.map(t => t.task_id))}` }] });
      }
      if (params.name === 'him_attest_queue') {
        const pack = JSON.parse(fs.readFileSync(a.pack, 'utf8'));
        const done = new Set((pack.human_decisions || []).map(d => d.task_id));
        return reply(id, { content: [{ type: 'text', text: JSON.stringify(pack.human_tasks.filter(t => !done.has(t)), null, 2) }] });
      }
      if (params.name === 'him_attest_decide') {
        const pack = JSON.parse(fs.readFileSync(a.pack, 'utf8'));
        const { privateKey, publicKey } = ensureKey(a.key || './him-human.key');
        const ts = new Date().toISOString();
        const sig = signDecision(privateKey, { task_id: a.task, decision: a.decision, note: a.note || '', ts });
        attachHumanDecision(pack, { task_id: a.task, decision: a.decision, note: a.note || '', ts, humanKeyPublic: publicKey, signatureB64: sig });
        fs.writeFileSync(a.pack, JSON.stringify(pack, null, 2));
        return reply(id, { content: [{ type: 'text', text: `${a.decision} → ${a.task}` }] });
      }
    }
  } catch (e) { err(id, e.message); }
}
