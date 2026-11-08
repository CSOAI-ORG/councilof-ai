import { CATALOG_SCHEMA, DISCLOSURE_SCHEMA, SCHEMA_HASHES } from './schemas.mjs';

/** Offline diagnostic reader. No network, storage, signing, approval or execution. */
export const READER_VERSION = '0.1.0';
export const UPSTREAM_COMMIT = '80605915dccf98b9b07e91a621170306d0a4ac58';
export const LIMITS = Object.freeze({ bytes: 1_048_576, depth: 48, nodes: 50_000, string: 16_384 });
const FORMAT = 'csoai.safe-companion-diagnostic/0.1-experimental';
const encoder = new TextEncoder();
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const permissions = () => ({ execute: false, submit: false, publish: false });
const schemaMap = { catalog: CATALOG_SCHEMA, disclosure: DISCLOSURE_SCHEMA };
const MESSAGES = Object.freeze({
  INPUT_TYPE: 'Input must be UTF-8 bytes or text.',
  INPUT_TOO_LARGE: 'The local reader accepts at most 1 MiB per input.',
  INVALID_UTF8: 'Input is not well-formed UTF-8.',
  BOM_UNSUPPORTED: 'A byte-order mark is outside this reader profile. Preserve the original and export UTF-8 JSON without a BOM.',
  INVALID_JSON: 'Input is not one complete JSON document.',
  DUPLICATE_MEMBER: 'JSON repeats an object member; the reader refuses ambiguous interpretation.',
  UNSAFE_MEMBER: 'Input contains an object member outside the reader safety profile.',
  RESOURCE_LIMIT: 'Input exceeds the reader depth, node or string limit.',
  UNSAFE_NUMBER: 'This reader accepts only mathematically exact integers within the JavaScript safe-integer range.',
  UNKNOWN_DOCUMENT: 'Input is not exactly one supported Starter Kit export type.',
  UNSUPPORTED_VERSION: 'The declared export version is not supported. No later fields were interpreted.',
  SCHEMA_MISMATCH: 'Input does not match the pinned project export schema.',
  SCHEMA_PROFILE_ERROR: 'The bundled schema contains a construct this reader cannot safely evaluate.',
  INVALID_TIMESTAMP: 'A declared timestamp is not a real date/time in the supported RFC 3339 profile (no leap seconds).',
  DUPLICATE_ENTRY_ID: 'Catalog repeats a declared entry identifier.',
  HISTORY_INCONSISTENT: 'Catalog current version/status does not agree with its ordered complete history.',
  TRANSITION_INCONSISTENT: 'Catalog operation, reason or replacement metadata is inconsistent.',
  DUPLICATE_ITEM_ID: 'Disclosure repeats a visible derivative identifier.',
  DUPLICATE_MANIFEST_ID: 'Disclosure repeats a manifest identifier.',
  VERSION_INCONSISTENT: 'Disclosure current/superseded status contradicts the declared version numbers.',
  WITHHELD_COUNT_MISMATCH: 'Withheld count does not match the placeholders in this export.',
  APPROVAL_DIGEST_MISMATCH: 'Approval digest and package digest disagree.',
  MANIFEST_ID_MISMATCH: 'Manifest identifiers do not match the visible derivatives.',
  RANGE_INCONSISTENT: 'Redaction ranges or removed-line totals are inconsistent.',
});
class ReaderError extends Error {
  constructor(code) { super(MESSAGES[code] ?? 'Reader refused input.'); this.code = code; }
}
const refuse = code => { throw new ReaderError(code); };

function bytesOf(input) {
  if (typeof input === 'string') {
    if (input.length > LIMITS.bytes) refuse('INPUT_TOO_LARGE');
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(input)) refuse('INVALID_UTF8');
    input = encoder.encode(input);
  }
  if (!(input instanceof Uint8Array)) refuse('INPUT_TYPE');
  if (input.byteLength > LIMITS.bytes) refuse('INPUT_TOO_LARGE');
  return Uint8Array.from(input);
}
async function sha256(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('WebCrypto is required for local SHA-256.');
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))]
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// These pinned schemas use integers only. Check the decimal value before Number
// conversion, which would otherwise round 58.00000000000000001 or underflow 1e-999.
function exactInteger(token) {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(token);
  let digits = (m[2] + (m[3] ?? '')).replace(/^0+/, '');
  if (!digits) return 0;
  const shift = Number(m[4] ?? 0) - (m[3]?.length ?? 0);
  if (!Number.isSafeInteger(shift)) refuse('UNSAFE_NUMBER');
  if (shift < 0) {
    const places = -shift;
    if (places > digits.length || !digits.endsWith('0'.repeat(places))) refuse('UNSAFE_NUMBER');
    digits = digits.slice(0, digits.length - places);
  } else {
    if (digits.length + shift > 16) refuse('UNSAFE_NUMBER');
    digits += '0'.repeat(shift);
  }
  if (digits.length > 16) refuse('UNSAFE_NUMBER');
  const value = Number(m[1] + digits);
  if (!Number.isSafeInteger(value)) refuse('UNSAFE_NUMBER');
  return value;
}

/** Bounded JSON parser rejects duplicate decoded keys before objects are constructed. */
function parseBytes(bytes) {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) refuse('BOM_UNSUPPORTED');
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { refuse('INVALID_UTF8'); }
  let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\x09\x0a\x0d]/.test(text[p])) p++; };
  function string() {
    const start = p++;
    for (; p < text.length; p++) {
      if (p - start > LIMITS.string * 6 + 2) refuse('RESOURCE_LIMIT');
      const c = text.charCodeAt(p);
      if (c < 0x20) refuse('INVALID_JSON');
      if (text[p] === '\\') { p++; continue; }
      if (text[p] === '"') {
        let value;
        try { value = JSON.parse(text.slice(start, ++p)); } catch { refuse('INVALID_JSON'); }
        if ([...value].length > LIMITS.string) refuse('RESOURCE_LIMIT');
        // Reject isolated surrogate code points: they do not have stable UTF-8 encoding.
        if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) refuse('INVALID_JSON');
        return value;
      }
    }
    refuse('INVALID_JSON');
  }
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  function value(depth) {
    ws(); if (depth > LIMITS.depth || ++nodes > LIMITS.nodes) refuse('RESOURCE_LIMIT');
    if (text[p] === '"') return string();
    if (text[p] === '{') {
      p++; ws(); const result = Object.create(null), keys = new Set();
      if (text[p] === '}') { p++; return result; }
      while (true) {
        ws(); if (text[p] !== '"') refuse('INVALID_JSON');
        const key = string();
        if (keys.has(key)) refuse('DUPLICATE_MEMBER');
        if (['__proto__', 'prototype', 'constructor'].includes(key)) refuse('UNSAFE_MEMBER');
        keys.add(key); ws(); if (text[p++] !== ':') refuse('INVALID_JSON');
        result[key] = value(depth + 1); ws();
        if (text[p] === '}') { p++; return result; }
        if (text[p++] !== ',') refuse('INVALID_JSON');
      }
    }
    if (text[p] === '[') {
      p++; ws(); const result = [];
      if (text[p] === ']') { p++; return result; }
      while (true) {
        result.push(value(depth + 1)); ws();
        if (text[p] === ']') { p++; return result; }
        if (text[p++] !== ',') refuse('INVALID_JSON');
      }
    }
    for (const [token, parsed] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(token, p)) { p += token.length; return parsed; }
    }
    numberPattern.lastIndex = p;
    const match = numberPattern.exec(text);
    if (!match) refuse('INVALID_JSON');
    p = numberPattern.lastIndex;
    return exactInteger(match[0]);
  }
  const result = value(0); ws(); if (p !== text.length) refuse('INVALID_JSON');
  return result;
}

const SCHEMA_KEYS = new Set(['$schema', '$id', '$comment', 'title', 'description', 'type',
  'additionalProperties', 'required', 'properties', 'const', '$defs', '$ref', 'items',
  'minItems', 'maxItems', 'oneOf', 'enum', 'minLength', 'maxLength', 'format', 'minimum', 'pattern']);
function checkSchemaProfile(schema, root, visited = new Set()) {
  if (!object(schema)) refuse('SCHEMA_PROFILE_ERROR');
  if (visited.has(schema)) return;
  visited.add(schema);
  for (const key of Object.keys(schema)) if (!SCHEMA_KEYS.has(key)) refuse('SCHEMA_PROFILE_ERROR');
  if (schema.format && schema.format !== 'uuid') refuse('SCHEMA_PROFILE_ERROR');
  if (schema.$ref) {
    if (!/^#\/\$defs\/[A-Za-z0-9_]+$/.test(schema.$ref)) refuse('SCHEMA_PROFILE_ERROR');
    const target = root.$defs?.[schema.$ref.slice(8)];
    if (!target) refuse('SCHEMA_PROFILE_ERROR');
    checkSchemaProfile(target, root, visited);
  }
  for (const s of Object.values(schema.properties ?? {})) checkSchemaProfile(s, root, visited);
  for (const s of Object.values(schema.$defs ?? {})) checkSchemaProfile(s, root, visited);
  if (schema.items) checkSchemaProfile(schema.items, root, visited);
  for (const s of schema.oneOf ?? []) checkSchemaProfile(s, root, visited);
}
const typeMatches = (value, type) => ({
  null: value === null, object: object(value), array: Array.isArray(value),
  string: typeof value === 'string', boolean: typeof value === 'boolean',
  number: typeof value === 'number' && Number.isFinite(value),
  integer: Number.isSafeInteger(value),
})[type] === true;
function conforms(value, schema, root) {
  if (schema.$ref && !conforms(value, root.$defs[schema.$ref.slice(8)], root)) return false;
  if (schema.type && !(Array.isArray(schema.type) ? schema.type : [schema.type]).some(t => typeMatches(value, t))) return false;
  if (own(schema, 'const') && value !== schema.const) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.oneOf && schema.oneOf.filter(s => conforms(value, s, root)).length !== 1) return false;
  if (object(value)) {
    if ((schema.required ?? []).some(k => !own(value, k))) return false;
    if (schema.additionalProperties === false && Object.keys(value).some(k => !own(schema.properties ?? {}, k))) return false;
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (own(value, key) && !conforms(value[key], child, root)) return false;
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false;
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return false;
    if (schema.items && value.some(v => !conforms(v, schema.items, root))) return false;
  }
  if (typeof value === 'string') {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) return false;
    if (schema.maxLength !== undefined && length > schema.maxLength) return false;
    if (schema.pattern && !(new RegExp(schema.pattern, 'u')).test(value)) return false;
    if (schema.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return false;
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) return false;
  return true;
}

function timestamp(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!m) refuse('INVALID_TIMESTAMP');
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59 || Number(m[10] ?? 0) > 23 || Number(m[11] ?? 0) > 59) refuse('INVALID_TIMESTAMP');
  const n = Date.parse(value); if (!Number.isFinite(n)) refuse('INVALID_TIMESTAMP');
  return n;
}
const lowerId = value => value.toLowerCase();
function assertUnique(items, key, code) {
  const seen = new Set();
  for (const item of items) { const id = lowerId(item[key]); if (seen.has(id)) refuse(code); seen.add(id); }
  return seen;
}
function checkCatalog(doc) {
  const entries = doc.catalog_export.entries;
  assertUnique(entries, 'id', 'DUPLICATE_ENTRY_ID');
  let timestampOrderAnomaly = false;
  for (const entry of entries) {
    const history = entry.versions;
    const last = history.at(-1);
    if (last.version !== entry.version || last.status !== entry.status) refuse('HISTORY_INCONSISTENT');
    let previousTime = -Infinity;
    for (const [index, v] of history.entries()) {
      if (v.version !== index + 1 || (index === 0 ? v.operation !== 'create' : v.operation === 'create')) refuse('HISTORY_INCONSISTENT');
      const time = timestamp(v.created_at); if (time < previousTime) timestampOrderAnomaly = true; previousTime = time;
      if (v.verification) timestamp(v.verification.verified_at);
      if (index && ['withdrawn', 'superseded'].includes(history[index - 1].status)) refuse('TRANSITION_INCONSISTENT');
      const ordinary = ['create', 'version'].includes(v.operation);
      if (ordinary ? v.reason !== null : v.reason === null) refuse('TRANSITION_INCONSISTENT');
      if (['create', 'version', 'correction'].includes(v.operation) && v.status !== 'active') refuse('TRANSITION_INCONSISTENT');
      if (v.operation === 'supersession') {
        if (v.status !== 'superseded' || !v.replacement_entry_id || lowerId(v.replacement_entry_id) === lowerId(entry.id)) refuse('TRANSITION_INCONSISTENT');
      } else if (v.replacement_entry_id !== null) refuse('TRANSITION_INCONSISTENT');
      if (v.operation === 'withdrawal' && v.status !== 'withdrawn') refuse('TRANSITION_INCONSISTENT');
      if (v.operation === 'dispute' && v.status !== 'disputed') refuse('TRANSITION_INCONSISTENT');
    }
  }
  return { timestampOrderAnomaly };
}
function checkDisclosure(doc) {
  const d = doc.disclosure_export;
  if (d.status === 'approved' ? d.version !== d.latest_version : d.version >= d.latest_version) refuse('VERSION_INCONSISTENT');
  if (d.withheld_count !== d.items.filter(i => i.withheld).length) refuse('WITHHELD_COUNT_MISMATCH');
  if (d.approval.digest !== d.digest) refuse('APPROVAL_DIGEST_MISMATCH');
  timestamp(d.approval.approved_at);
  const visible = d.items.filter(i => !i.withheld);
  const visibleIds = assertUnique(visible, 'evidence_id', 'DUPLICATE_ITEM_ID');
  const manifestIds = assertUnique(d.manifest.items, 'evidence_id', 'DUPLICATE_MANIFEST_ID');
  if (manifestIds.size !== visibleIds.size || [...manifestIds].some(id => !visibleIds.has(id))) refuse('MANIFEST_ID_MISMATCH');
  for (const item of d.manifest.items) {
    let total = 0, lastEnd = 0;
    for (const r of item.removed) {
      if (r.from_line <= lastEnd || r.to_line < r.from_line || r.to_line > item.lines_total || r.lines !== r.to_line - r.from_line + 1) refuse('RANGE_INCONSISTENT');
      total += r.lines; lastEnd = r.to_line;
    }
    if (total !== item.removed_lines || item.removed_lines > item.lines_total) refuse('RANGE_INCONSISTENT');
  }
}

const check = (id, state, message) => ({ id, state, message });
const finding = (code, severity, message) => ({ code, severity, message });
function blankReport() {
  return {
    format: FORMAT,
    reader: { name: 'Council SAFE export companion', version: READER_VERSION, upstream_commit: UPSTREAM_COMMIT, schema_sha256: null },
    input: { sha256: null, bytes: null, type: 'unknown', schema_version: null },
    accepted_for_reading: false,
    checks: [
      check('syntax', 'NOT_EVALUATED', 'JSON has not been read.'),
      check('schema', 'NOT_EVALUATED', 'The project schema has not been checked.'),
      check('consistency', 'NOT_EVALUATED', 'Record relationships have not been checked.'),
      check('transport_integrity', 'NOT_EVALUATED', 'No input digest has been computed.'),
      check('package_integrity', 'NOT_PROVIDED', 'This export cannot establish the integrity of the underlying evidence.'),
      check('producer_identity', 'NOT_AUTHENTICATED', 'An export does not authenticate its producer.'),
      check('human_authority', 'NOT_ESTABLISHED', 'An approval reference does not establish current human authority.'),
      check('effect', 'NOT_OBSERVED', 'No independent effect observation is supplied or performed.'),
      check('freshness', 'UNCONFIRMED', 'An offline export cannot establish the latest source or revocation state.'),
    ],
    counts: { entries: 0, versions: 0, declared_pass: 0, declared_fail: 0, declared_inconclusive: 0, visible_items: 0, withheld_items: 0 },
    findings: [],
    permissions: permissions(),
    limits: [
      'Experimental diagnostic for pinned project-defined schemas; not an official SAFE schema or assessment.',
      'Checks concern this supplied export only. They do not establish truth, current authority, compliance or general safety.',
      'Input content stays local. This diagnostic omits case text, recipient and personal identifiers; its digest and counts can still be sensitive.',
      'Original bytes must be retained separately by their authorised custodian. This diagnostic is unsigned and does not contain them.',
      'Local reader profile: exact safe integers, bounded input, complete contiguous catalog histories and producer operation/status relationships; wall-clock order is not causal proof.',
    ],
  };
}
function setCheck(report, id, state, message) {
  const i = report.checks.findIndex(c => c.id === id);
  report.checks[i] = check(id, state, message);
}

/** Returns a fixed diagnostic plus the parsed document for local use only. */
export async function inspectExport(input) {
  const report = blankReport(); let stage = 'syntax';
  try {
    const bytes = bytesOf(input);
    report.input.bytes = bytes.length; report.input.sha256 = await sha256(bytes);
    setCheck(report, 'transport_integrity', 'DIGEST_COMPUTED', 'SHA-256 identifies the exact supplied bytes; no trusted external digest was supplied.');
    const doc = parseBytes(bytes);
    setCheck(report, 'syntax', 'CHECKED', 'Bounded UTF-8 JSON parsed with duplicate-member refusal.');
    stage = 'schema';
    if (!object(doc)) refuse('UNKNOWN_DOCUMENT');
    const hasCatalog = own(doc, 'catalog_export_schema_version');
    const hasDisclosure = own(doc, 'disclosure_export_schema_version');
    if (hasCatalog === hasDisclosure) refuse('UNKNOWN_DOCUMENT');
    const type = hasCatalog ? 'catalog' : 'disclosure';
    report.input.type = type;
    const version = doc[`${type}_export_schema_version`];
    if (version !== '0.1.0') refuse('UNSUPPORTED_VERSION');
    report.input.schema_version = version;
    const schema = schemaMap[type];
    report.reader.schema_sha256 = SCHEMA_HASHES[type];
    checkSchemaProfile(schema, schema);
    if (!conforms(doc, schema, schema)) refuse('SCHEMA_MISMATCH');
    setCheck(report, 'schema', 'CHECKED', 'The supported 0.1.0 project schema matches, including UUID syntax and unknown-field refusal.');
    stage = 'consistency';
    const catalogConsistency = type === 'catalog' ? checkCatalog(doc) : null;
    if (type === 'disclosure') checkDisclosure(doc);
    setCheck(report, 'consistency', 'CONSISTENT', 'Declared identifiers, version relationships and available internal consistency checks agree. This does not authenticate the records.');
    if (type === 'catalog') {
      const entries = doc.catalog_export.entries;
      report.counts.entries = entries.length;
      for (const entry of entries) for (const version of entry.versions) {
        report.counts.versions++;
        if (version.verification) report.counts[`declared_${version.verification.result}`]++;
      }
      setCheck(report, 'package_integrity', 'NOT_PROVIDED', 'Catalog summaries omit evidence bytes, signatures, comparator versions and measurement configuration.');
      report.findings.push(finding('DECLARED_RESULTS_ONLY', 'limitation', 'Verification results are source-declared history, not measurements performed by this reader.'));
      report.findings.push(finding('COMPARATOR_NOT_PROVIDED', 'limitation', 'A comparator version and reproducible evidence are not supplied by this export.'));
      if (catalogConsistency.timestampOrderAnomaly) report.findings.push(finding('TIMESTAMP_ORDER_ANOMALY', 'limitation', 'Version order and declared wall-clock order differ. Clock changes or source inconsistencies require review; timestamps do not prove causal order.'));
    } else {
      const d = doc.disclosure_export;
      report.counts.visible_items = d.items.filter(i => !i.withheld).length;
      report.counts.withheld_items = d.withheld_count;
      setCheck(report, 'package_integrity', 'NOT_PROVIDED', 'Approval/package digest equality is internally consistent, but omitted canonical fields prevent package-digest recomputation. Derivative bytes are absent.');
      report.findings.push(finding('APPROVAL_REFERENCE_ONLY', 'limitation', 'The approver identifier and separation assertion are records, not cryptographic human authentication or a current authority grant.'));
      if (d.withheld_count) report.findings.push(finding('WITHHELD_NOT_ASSESSED', 'limitation', 'Withheld evidence remains unassessed; withholding is neither a pass nor a failure.'));
      if (d.status === 'superseded') {
        setCheck(report, 'freshness', 'SUPERSEDED_AS_DECLARED', 'The source marks this approved version as historical; it must not be treated as current permission.');
        report.findings.push(finding('HISTORICAL_ONLY', 'limitation', 'A superseded export is readable history, not a current release approval.'));
      }
    }
    report.accepted_for_reading = true;
    return { report, document: doc };
  } catch (error) {
    if (!(error instanceof ReaderError)) throw error;
    setCheck(report, stage, stage === 'consistency' ? 'CONTRADICTED' : 'REFUSED', error.message);
    report.findings.push(finding(error.code, 'refusal', error.message));
    return { report, document: null };
  }
}

function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const same = (a, b) => stable(a) === stable(b);
function immutableDisclosure(d) {
  const copy = { ...d };
  for (const key of ['latest_version', 'status', 'items', 'manifest', 'withheld_count']) delete copy[key];
  return copy;
}
function incompatibleProjection(a, b) {
  if (a.items.length !== b.items.length) return true;
  const beforeIds = new Set(a.items.filter(i => !i.withheld).map(i => lowerId(i.evidence_id)));
  const afterIds = new Set(b.items.filter(i => !i.withheld).map(i => lowerId(i.evidence_id)));
  // A previously visible item can disappear only into a withheld placeholder;
  // a newly visible item can come only from a previously withheld position.
  if ([...beforeIds].filter(id => !afterIds.has(id)).length > b.withheld_count
      || [...afterIds].filter(id => !beforeIds.has(id)).length > a.withheld_count) return true;
  for (const select of [d => d.items.filter(i => !i.withheld), d => d.manifest.items]) {
    const left = new Map(select(a).map(i => [lowerId(i.evidence_id), i]));
    for (const item of select(b)) {
      const previous = left.get(lowerId(item.evidence_id));
      if (previous && !same(previous, item)) return true;
    }
  }
  return false;
}

/** Compares declared histories; never retains or renews permission. */
export async function compareExports(previousInput, currentInput) {
  const previous = await inspectExport(previousInput), current = await inspectExport(currentInput);
  const result = {
    format: 'csoai.safe-companion-comparison/0.1-experimental',
    reader_version: READER_VERSION,
    previous_sha256: previous.report.input.sha256,
    current_sha256: current.report.input.sha256,
    relationship: 'NOT_ESTABLISHED', decision: 'NOT_COMPARABLE', changes: [],
    permissions: permissions(),
    limits: [
      'Relationships use declared identifiers; producer and installation identity are not authenticated.',
      'No comparison establishes current authority, factual truth or an external effect.',
      'A new source or unchanged evidence cannot renew an execution permission.',
      'Different caller visibility can change a disclosure projection without changing its package version. Omitted evidence remains unknown.',
    ],
  };
  if (!previous.report.accepted_for_reading || !current.report.accepted_for_reading) {
    result.changes.push('INPUT_REFUSED'); return result;
  }
  if (previous.report.input.type !== current.report.input.type) {
    result.relationship = 'DIFFERENT_TYPES'; result.decision = 'UNRELATED'; return result;
  }
  if (result.previous_sha256 === result.current_sha256) {
    result.relationship = 'IDENTICAL_BYTES'; result.decision = 'NO_DOCUMENT_CHANGE'; return result;
  }
  if (same(previous.document, current.document)) {
    result.relationship = 'REPRESENTATION_CHANGED'; result.decision = 'NO_DOCUMENT_CHANGE';
    result.changes.push('BYTE_IDENTITY_CHANGED'); return result;
  }
  if (current.report.input.type === 'disclosure') {
    const a = previous.document.disclosure_export, b = current.document.disclosure_export;
    if (lowerId(a.case_id) !== lowerId(b.case_id) || lowerId(a.package_id) !== lowerId(b.package_id)) {
      result.relationship = 'DIFFERENT_DECLARED_PACKAGE'; result.decision = 'UNRELATED'; return result;
    }
    result.relationship = 'SAME_DECLARED_PACKAGE';
    if (b.version < a.version || b.latest_version < a.latest_version) {
      result.decision = 'CONFLICT'; result.changes.push('VERSION_ROLLBACK'); return result;
    }
    if (b.version === a.version && (!same(immutableDisclosure(a), immutableDisclosure(b)) || incompatibleProjection(a, b))) {
      result.decision = 'CONFLICT'; result.changes.push('SAME_VERSION_CONTENT_CHANGED'); return result;
    }
    if (b.version > a.version && (lowerId(b.version_id) === lowerId(a.version_id) || lowerId(b.approval.id) === lowerId(a.approval.id))) {
      result.decision = 'CONFLICT'; result.changes.push('VERSION_OR_APPROVAL_ID_REUSED'); return result;
    }
    result.decision = 'REASSESSMENT_REQUIRED';
    if (b.version > a.version) result.changes.push('NEW_VERSION');
    if (b.status === 'superseded' && a.status !== 'superseded') result.changes.push('PREVIOUSLY_CURRENT_NOW_HISTORICAL');
    if (a.recipient !== b.recipient) result.changes.push('RECIPIENT_CHANGED');
    if (a.purpose !== b.purpose) result.changes.push('PURPOSE_CHANGED');
    if (!same(a.template, b.template)) result.changes.push('TEMPLATE_CHANGED');
    if (a.tlp_audience !== b.tlp_audience) result.changes.push('AUDIENCE_CHANGED');
    if (a.digest !== b.digest) result.changes.push('DECLARED_DIGEST_CHANGED');
    if (!same(a.items, b.items) || !same(a.manifest, b.manifest)) result.changes.push('EVIDENCE_PROJECTION_CHANGED');
    if (!same(a.approval, b.approval)) result.changes.push('APPROVAL_RECORD_CHANGED');
    if (!result.changes.length) result.changes.push('LATEST_VERSION_METADATA_CHANGED');
    return result;
  }
  const a = new Map(previous.document.catalog_export.entries.map(e => [lowerId(e.id), e]));
  const b = new Map(current.document.catalog_export.entries.map(e => [lowerId(e.id), e]));
  const shared = [...a.keys()].filter(id => b.has(id));
  if (a.size && b.size && !shared.length) {
    result.relationship = 'NO_SHARED_DECLARED_ENTRY'; result.decision = 'UNRELATED'; return result;
  }
  result.relationship = 'DECLARED_ENTRY_COMPARISON';
  const changes = new Set();
  for (const id of shared) {
    const before = a.get(id), after = b.get(id);
    if (after.version < before.version) changes.add('VERSION_ROLLBACK');
    else if (before.versions.some((v, i) => !same(v, after.versions[i]))) changes.add('HISTORY_CHANGED');
    else if (after.version > before.version) changes.add('HISTORY_APPENDED');
  }
  if ([...a.keys()].some(id => !b.has(id))) changes.add('ENTRY_NO_LONGER_EXPORTED');
  if ([...b.keys()].some(id => !a.has(id))) changes.add('ENTRY_ADDED');
  if (!changes.size) changes.add('REPRESENTATION_OR_ORDER_CHANGED');
  result.changes = [...changes].sort();
  result.decision = changes.has('VERSION_ROLLBACK') || changes.has('HISTORY_CHANGED') ? 'CONFLICT'
    : changes.size === 1 && changes.has('REPRESENTATION_OR_ORDER_CHANGED') ? 'NO_DOCUMENT_CHANGE' : 'REASSESSMENT_REQUIRED';
  return result;
}

/** Never trusts imported diagnostic assertions: reproduce from original bytes. */
export async function verifySavedReport(originalInput, savedReportInput) {
  const { report } = await inspectExport(originalInput);
  let saved;
  try { saved = parseBytes(bytesOf(savedReportInput)); }
  catch (error) { if (error instanceof ReaderError) return { matches: false, report }; throw error; }
  return { matches: same(report, saved), report };
}
