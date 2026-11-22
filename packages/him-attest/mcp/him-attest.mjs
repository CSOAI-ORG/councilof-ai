#!/usr/bin/env node
/** H.I.M. MCP stdio research adapter — not an enrolled-human authority issuer.
 * Agents may create scoped research packs and inspect their pending tasks.
 * An MCP caller CANNOT sign or claim a human decision: no agent-side key creation.
 * A signed local demo is not identity, reviewer enrollment or permission to execute.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runCeremony } from '../src/ceremony.js';

const DIR = new URL('../frameworks/', import.meta.url).pathname;
const FRAMEWORKS = new Set(['eu-ai-act-art50', 'eu-ai-act-art53', 'dora-art28-30', 'cra', 'iso-42001-lite', 'nist-ai-rmf-lite']);
const SUBJECT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const PACK_FILE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.(?:eu-ai-act-art50|eu-ai-act-art53|dora-art28-30|cra|iso-42001-lite|nist-ai-rmf-lite)\.pack\.json$/;

function safePackPath(value) {
  const name = typeof value === 'string' && value.startsWith('./') ? value.slice(2) : value;
  if (typeof name !== 'string' || !PACK_FILE.test(name)) throw new Error('PACK_PATH_NOT_MANAGED');
  const file = path.resolve(process.cwd(), name);
  if (path.dirname(file) !== process.cwd()) throw new Error('PACK_PATH_NOT_MANAGED');
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('PACK_FILE_NOT_REGULAR');
  return file;
}
const TOOLS = [
  { name: 'him_attest_run', description: 'Build a human-in-the-loop attestation ceremony pack (machine evidence + human task queue) for subject × framework', inputSchema: { type: 'object', properties: { subject: { type: 'string' }, framework: { type: 'string', enum: ['eu-ai-act-art50', 'eu-ai-act-art53', 'dora-art28-30', 'cra', 'iso-42001-lite', 'nist-ai-rmf-lite'] } }, required: ['subject', 'framework'] } },
  { name: 'him_attest_queue', description: 'List pending human tasks in a ceremony pack', inputSchema: { type: 'object', properties: { pack: { type: 'string' } }, required: ['pack'] } },
];

function reply(id, result) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n'); }
function err(id, m) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message: m } }) + '\n'); }

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  buf += data;
  let end;
  while ((end = buf.indexOf('\\n')) >= 0) {
    const line = buf.slice(0, end).trim();
    buf = buf.slice(end + 1);
    if (!line) continue;
    try { void handle(JSON.parse(line)); }
    catch { err(null, 'MALFORMED_JSON'); }
  }
});

async function handle({ id, method, params }) {
  try {
    if (method === 'initialize') return reply(id, { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'csoai-him-attest', version: '0.1.0' } });
    if (method === 'tools/list') return reply(id, { tools: TOOLS });
    if (method !== 'tools/call') return err(id, 'METHOD_NOT_SUPPORTED');

    // Backwards-compatible refusal BEFORE reading pack, key, or filesystem paths.
    if (params?.name === 'him_attest_decide') {
      return err(id, 'HUMAN_AUTHORITY_NOT_ENROLLED: agents cannot create or sign human approvals');
    }
    const a = params?.arguments || {};
    if (params?.name === 'him_attest_run') {
      if (typeof a.subject !== 'string' || !SUBJECT.test(a.subject)) throw new Error('INVALID_SUBJECT_SLUG');
      if (!FRAMEWORKS.has(a.framework)) throw new Error('INVALID_FRAMEWORK');
      const { pack, tasks } = await runCeremony({ frameworkSlug: a.framework, frameworksDir: DIR.replace(/\\/$/, ''), subject: a.subject });
      const out = path.join(process.cwd(), `${a.subject}.${a.framework}.pack.json`);
      // Do not overwrite previous research evidence or follow symlinks.
      fs.writeFileSync(out, JSON.stringify(pack, null, 2), { flag: 'wx', mode: 0o600 });
      return reply(id, { content: [{ type: 'text', text: `pack=${path.basename(out)} ceremony_sha256=${pack.ceremony_sha256} human_tasks=${pack.human_tasks.length} ${JSON.stringify(tasks.map(t => t.task_id))} authority=NOT_ENROLLED` }] });
    }
    if (params?.name === 'him_attest_queue') {
      const pack = JSON.parse(fs.readFileSync(safePackPath(a.pack), 'utf8'));
      const done = new Set((pack.human_decisions || []).map(d => d.task_id));
      return reply(id, { content: [{ type: 'text', text: JSON.stringify((pack.human_tasks || []).filter(t => !done.has(t)), null, 2) }] });
    }
    return err(id, 'UNKNOWN_TOOL');
  } catch (error) { err(id, error?.code === 'EEXIST' ? 'PACK_ALREADY_EXISTS' : String(error?.message || 'ERROR')); }
}
