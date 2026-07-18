/**
 * CSOAI SIGIL Client — TypeScript
 * Sovereign Inter-aGent Interchange Language
 * Compact, deterministic, signable agent communication DSL.
 */

export interface SigilOpSpec {
  code: string;
  name: string;
  fields: [string, string][];
  glossTemplate: string;
}

export interface SigilRegistry {
  [code: string]: SigilOpSpec;
}

const CHOICE: Record<string, string> = { '+': 'APPROVE', '-': 'REJECT', '~': 'ABSTAIN' };
const CHOICE_INV: Record<string, string> = { APPROVE: '+', REJECT: '-', ABSTAIN: '~' };

// Built-in v0.1 registry
const DEFAULT_REGISTRY: SigilRegistry = {
  P: { code: 'P', name: 'propose', fields: [['id', 's'], ['topic', 's'], ['options', 'list']], glossTemplate: 'Proposal {id}: {topic} (options: {options})' },
  V: { code: 'V', name: 'vote', fields: [['agent', 's'], ['prop', 's'], ['choice', 'choice'], ['conf', 'float']], glossTemplate: 'Agent {agent} votes {choice} on {prop} (confidence {conf}).' },
  M: { code: 'M', name: 'memory', fields: [['key', 's'], ['value', 's'], ['salience', 'float']], glossTemplate: 'Memory {key} = {value} (salience {salience})' },
  Q: { code: 'Q', name: 'query', fields: [['pattern', 's'], ['k', 'int']], glossTemplate: 'Query "{pattern}" (top {k})' },
  C: { code: 'C', name: 'care', fields: [['subject', 's'], ['score', 'float'], ['dims', 'list']], glossTemplate: 'Care score {score} for {subject} (dimensions: {dims})' },
  H: { code: 'H', name: 'handoff', fields: [['from', 's'], ['to', 's'], ['task', 's']], glossTemplate: 'Handoff from {from} to {to}: {task}' },
  S: { code: 'S', name: 'state', fields: [['fields', 'kv*']], glossTemplate: 'State: {fields}' },
  A: { code: 'A', name: 'alert', fields: [['level', 's'], ['msg', 's']], glossTemplate: 'Alert [{level}]: {msg}' },
};

function encField(kind: string, value: unknown): string {
  if (kind === 'list') return Array.isArray(value) ? value.join(',') : String(value);
  if (kind === 'choice') return CHOICE_INV[String(value)] || String(value);
  return String(value);
}

function decField(kind: string, raw: string): unknown {
  if (kind === 'list') return raw ? raw.split(',') : [];
  if (kind === 'choice') return CHOICE[raw] || raw;
  if (kind === 'int') { const n = parseInt(raw, 10); if (isNaN(n)) throw new Error(`Invalid int: ${raw}`); return raw; }
  if (kind === 'float') { const n = parseFloat(raw); if (isNaN(n)) throw new Error(`Invalid float: ${raw}`); return raw; }
  return raw;
}

export class SigilClient {
  private registry: SigilRegistry;

  constructor(registry?: SigilRegistry) {
    this.registry = registry ? { ...DEFAULT_REGISTRY, ...registry } : { ...DEFAULT_REGISTRY };
  }

  register(spec: SigilOpSpec): void {
    if (this.registry[spec.code]) throw new Error(`Opcode ${spec.code} already registered`);
    this.registry[spec.code] = spec;
  }

  encode(intent: Record<string, unknown>): string {
    const op = String(intent.op);
    const spec = this.registry[op];
    if (!spec) throw new Error(`Unknown opcode: ${op}`);
    const parts: string[] = [op];
    for (const [fname, kind] of spec.fields) {
      if (kind === 'kv*') {
        const kv = intent[fname] as Record<string, string>;
        for (const [k, v] of Object.entries(kv)) parts.push(`${k}:${v}`);
      } else {
        parts.push(encField(kind, intent[fname]));
      }
    }
    return parts.join('|');
  }

  parse(line: string): Record<string, unknown> {
    const parts = line.split('|');
    const op = parts[0];
    const spec = this.registry[op];
    if (!spec) throw new Error(`Unknown opcode: ${op}`);
    const out: Record<string, unknown> = { op };
    let i = 1;
    for (const [fname, kind] of spec.fields) {
      if (kind === 'kv*') {
        const kv: Record<string, string> = {};
        for (let j = i; j < parts.length; j++) {
          const [k, v] = parts[j].split(':', 2);
          kv[k] = v;
        }
        out[fname] = kv;
        i = parts.length;
      } else {
        out[fname] = decField(kind, parts[i]);
        i++;
      }
    }
    return out;
  }

  gloss(line: string): string {
    const parsed = this.parse(line);
    const op = String(parsed.op);
    const spec = this.registry[op];
    if (!spec) return `Unknown: ${line}`;
    const view: Record<string, string> = {};
    for (const [fname, kind] of spec.fields) {
      const v = parsed[fname];
      if (kind === 'list') view[fname] = Array.isArray(v) ? v.join(', ') : String(v);
      else if (kind === 'kv*') {
        view[fname] = Object.entries(v as Record<string, string>).map(([k, val]) => `${k}=${val}`).join(', ');
      } else {
        view[fname] = String(v);
      }
    }
    try {
      return spec.glossTemplate.replace(/\{(\w+)\}/g, (_, key) => view[key] || '');
    } catch {
      return `${spec.name}: ${JSON.stringify(view)}`;
    }
  }

  digest(line: string): string {
    const parsed = this.parse(line);
    const canon = JSON.stringify(parsed, Object.keys(parsed).sort());
    let hash = 0;
    for (let i = 0; i < canon.length; i++) {
      const char = canon.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  }

  manifest(): SigilRegistry {
    return { ...this.registry };
  }
}

// Singleton for convenience
export const sigil = new SigilClient();
