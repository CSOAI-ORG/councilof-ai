/** Shared read-only projection. Uses the existing AG-UI contract; no new authority or grader. */
import { newRun, reduceRun, interruptRun, type TalkRun, type Json } from '../../client/src/lib/aguiTalk';
export { streamRun } from '../../client/src/lib/aguiTalk';
export const ORIGIN = 'https://councilof.ai';
export const RUN_ENDPOINT = ORIGIN + '/api/agui/run';
export const SUGGESTIONS = [
  'What does the leaderboard show?', 'How did safety measure?', 'Show the latest corrections',
];
export const rec = (v: unknown): Record<string, any> | null => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : null;
export const clip = (v: unknown, n = 1000): string => typeof v === 'string' ? v.slice(0, n) : '';
export function safeLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const u = new URL(value, ORIGIN); return u.protocol === 'https:' && !u.username && !u.password && u.hostname === 'councilof.ai' ? u.href : null; } catch { return null; }
}
export class TaskProjection {
  run: TalkRun;
  expectedRun: string | null = null;
  expectedThread: string;
  events: Json[] = [];
  constructor(question: string, id: string) {
    if (!question.trim() || question.length > 3000 || !/^[a-z0-9-]{1,100}$/i.test(id)) throw new Error('Invalid task input.');
    this.run = newRun(question, id); this.expectedThread = id;
  }
  bindRequest(body: string) {
    const p = rec(JSON.parse(body));
    if (!p || p.threadId !== this.expectedThread || typeof p.runId !== 'string' || p.forwardedProps || p.tools) throw new Error('Unexpected request scope.');
    this.expectedRun = p.runId;
  }
  accept(event: Json) {
    if (!this.expectedRun || event.runId !== this.expectedRun || event.threadId !== this.expectedThread) throw new Error('Event is not bound to this request.');
    if (this.events.length >= 2048) throw new Error('Event budget exceeded.');
    this.run = reduceRun(this.run, event);
    // Duplicates are handled by the shared reducer, including changed-content rejection.
    if (!this.events.some(e => e.eventId === event.eventId)) this.events.push(event);
  }
  interrupt(reason: string) { this.run = interruptRun(this.run, 'interrupted', reason); }
  summary() {
    const r = this.run;
    return {
      status: r.status,
      toolCount: r.tools.length,
      returned: r.tools.filter(t => t.status === 'done').length,
      unresolved: r.tools.filter(t => t.status !== 'done').length,
      labels: r.tools.map(t => ({ name: t.name, status: t.status, label: t.label ?? 'UNMEASURED' })),
      traceCheck: r.status === 'done' && r.hasStarted ? 'Complete event sequence received' : r.status === 'streaming' ? 'Observing this Council task' : 'Review required',
      authority: false,
    };
  }
  export() {
    return { schema: 'csoai.panel-observation/1', exportedAt: new Date().toISOString(), source: RUN_ENDPOINT,
      scope: 'This panel’s Council task only. Not platform-wide monitoring, private reasoning, a signed measurement, or human authority.',
      request: { threadId: this.expectedThread, runId: this.expectedRun }, summary: this.summary(),
      answer: this.run.text, events: this.events, grantsAuthority: false, signatureStatus: 'UNSIGNED' };
  }
}
export type BenchRow = { framework: string; task: string; model: string; adapter: string | null; revision: string; metric: string; value: number; samples: number | null; state: string };
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;
/** Resolve only explicit model identifiers; adapter names are not model identity. */
export function harnessModel(data: Record<string, any>): string {
  const named = clip(data.model_name, 160).trim(); if (named) return named;
  const args = rec(data.config)?.model_args; const object = rec(args);
  if (object) for (const key of ['pretrained', 'model', 'model_name']) {
    const value = clip(object[key], 160).trim(); if (value) return value;
  }
  if (typeof args === 'string' && args.length <= 10000) {
    for (const part of args.split(',')) {
      const at = part.indexOf('='); if (at < 0) continue;
      if (['pretrained','model','model_name'].includes(part.slice(0, at).trim())) {
        const value = part.slice(at+1).trim().replace(/^['"]|['"]$/g, '');
        if (value) return value.slice(0,160);
      }
    }
  }
  return 'Unspecified model';
}
/** Local-only import of selected summary fields. Does not run/score a model or trust file claims. */
export function benchmarkRows(value: unknown): BenchRow[] {
  const d = rec(value); if (!d) throw new Error('Expected a benchmark JSON object.');
  const rows: BenchRow[] = [];
  const add = (framework: string, task: unknown, model: unknown, revision: unknown, metric: string, v: unknown, samples: unknown, adapter: string | null = null) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return;
    if (rows.length >= 200) throw new Error('More than 200 metric rows: the entire import was refused; no results were silently omitted.');
    rows.push({ framework, task: clip(task, 120) || 'Unspecified task', model: clip(model, 160) || 'Unspecified model',
      adapter, revision: typeof revision === 'number' ? String(revision) : clip(revision, 100) || 'Not supplied', metric: metric.slice(0, 120),
      value: v, samples: count(samples), state: 'IMPORTED_UNVERIFIED' });
  };
  if (rec(d.eval) && rec(d.results) && Array.isArray(d.results.scores)) {
    if (d.status !== 'success') throw new Error('Inspect run is not marked successful; do not present it as a completed benchmark.');
    for (const score of d.results.scores) {
      const s = rec(score); if (!s) continue;
      for (const [name, item] of Object.entries(rec(s.metrics) ?? {})) add('Inspect', d.eval.task, d.eval.model, d.eval.task_version,
        `${clip(s.name, 80) || 'scorer'} / ${name}`, rec(item)?.value, d.results.completed_samples);
    }
  } else if (rec(d.results) && rec(d.config) && rec(d.versions)) {
    for (const [task, metrics] of Object.entries(d.results)) {
      for (const [metric, v] of Object.entries(rec(metrics) ?? {})) {
        if (metric === 'alias' || metric.includes('stderr')) continue;
        const sample = rec(rec(d['n-samples'])?.[task]);
        add('lm-evaluation-harness', task, harnessModel(d), d.versions[task], metric, v, sample?.effective ?? sample?.original, clip(d.config.model,120) || null);
      }
    }
  } else throw new Error('Supported summaries: Inspect JSON and lm-evaluation-harness results JSON. No conversion was guessed.');
  if (!rows.length) throw new Error('No finite metric values were found.');
  return rows;
}
export function publicBoard(value: unknown) {
  const obj = rec(value);
  // MCP board_totals returns named counts; AG-UI also accepts the raw totals.
  // Read the declared fields only, never infer counts from prose or array order.
  if (obj?.kind === 'live-board-totals') {
    if (obj.state !== 'LIVE' || obj.reachable !== true || !Array.isArray(obj.counts)) return null;
    const named = new Map<string, number>();
    for (const item of obj.counts) {
      const row = rec(item);
      if (!row || !['axis_slots', 'measured', 'unmeasured'].includes(row.name)) continue;
      const n = count(row.value);
      if (n === null || named.has(row.name)) return null;
      named.set(row.name, n);
    }
    const axes = named.get('axis_slots'), measured = named.get('measured'), unmeasured = named.get('unmeasured');
    return axes !== undefined && measured !== undefined && unmeasured !== undefined && measured + unmeasured === axes ? { axes, measured, unmeasured } : null;
  }
  const t = rec(obj?.totals) ?? obj;
  if (!t) return null;
  const axes = count(t.axes), measured = count(t.measured_axes), unmeasured = count(t.unmeasured_axes);
  return axes !== null && measured !== null && unmeasured !== null ? { axes, measured, unmeasured } : null;
}
/** Metadata-only screen copy. No questions, replies, imported datasets or credentials. */
export function screenSnapshot(task: TaskProjection | null) {
  return { schema: 'csoai.local-screen/1', at: Date.now(), status: task?.run.status ?? 'idle',
    title: 'Council of AI · MEOK', tools: (task?.run.tools ?? []).map(t => ({ name: clip(t.name, 120), status: clip(t.status, 40) })).slice(0, 50),
    scope: 'Read-only local second screen. This Council task only. No control authority.' };
}
export function validateScreen(value: unknown) {
  const d = rec(value);
  if (!d || d.schema !== 'csoai.local-screen/1' || typeof d.at !== 'number' || !Number.isFinite(d.at) || !Array.isArray(d.tools) || d.tools.length > 50) return null;
  return { at: d.at, status: clip(d.status, 40), tools: d.tools.map((v: unknown) => ({ name: clip(rec(v)?.name, 120), status: clip(rec(v)?.status, 40) })) };
}
