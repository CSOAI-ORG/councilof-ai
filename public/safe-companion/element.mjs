import { inspectExport, compareExports, verifySavedReport } from './reader.mjs';
import { CATALOG_EXAMPLE_TEXT, DISCLOSURE_EXAMPLE_TEXT } from './examples.mjs';

export const COMPONENT_VERSION = '0.2.1';

const MAX_BYTES = 1024 * 1024;
const ENCODER = new TextEncoder();
const TYPE_NAMES = { catalog: 'Catalog export', disclosure: 'Disclosure export', unknown: 'Unrecognised export' };
const CHECK_NAMES = {
  syntax: 'Readable JSON', schema: 'Supported format', consistency: 'Recorded relationships',
  transport_integrity: 'Original file identity', package_integrity: 'Package content integrity',
  producer_identity: 'Who produced the file', human_authority: 'Human authority', effect: 'Observed effect', freshness: 'Current source status',
};
const STATE_NAMES = {
  PASS: 'Checked', PASSED: 'Checked', FAIL: 'Not accepted', FAILED: 'Not accepted',
  CHECKED: 'Checked', CONSISTENT: 'Consistent within this file', MISMATCH: 'Mismatch',
  NOT_ESTABLISHED: 'Not established', NOT_VERIFIED: 'Not verified', UNCHECKABLE: 'Could not check',
  NOT_APPLICABLE: 'Not applicable', NOT_CHECKED: 'Not checked', UNKNOWN: 'Unknown',
  SELF_HASH_ONLY: 'File hash only', DECLARED_ONLY: 'Recorded assertion only', REFUSED: 'Not accepted',
  CONTRADICTED: 'Contradiction found', NOT_EVALUATED: 'Not evaluated', NOT_PROVIDED: 'Not provided',
  NOT_AUTHENTICATED: 'Not authenticated', NOT_OBSERVED: 'Not observed', UNCONFIRMED: 'Unconfirmed',
  DIGEST_COMPUTED: 'File digest computed', SUPERSEDED_AS_DECLARED: 'Historical, as declared',
};
const DECISIONS = {
  REASSESSMENT_REQUIRED: ['Review affected conclusions', 'The exports differ. Inspect the changed dependencies before relying on an earlier conclusion. No permission is renewed.'],
  NO_DOCUMENT_CHANGE: ['No change to the compared records', 'The comparison did not identify a change to the declared records. Byte representation or ordering may differ. This does not establish that either file is the latest available version.'],
  UNRELATED: ['Relationship not established', 'The available identifiers do not establish a link between these exports. Do not infer a version relationship.'],
  CONFLICT: ['Conflicting records', 'The selected records disagree in a way that needs review. Neither takes precedence automatically.'],
  NOT_COMPARABLE: ['Comparison unavailable', 'One or both exports could not be accepted for comparison. Inspect each file separately.'],
};
const CSS = `
:host{display:block;container-type:inline-size;color:#183c38;font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--ink:#183c38;--muted:#526762;--line:#d7e2dd;--paper:#fff;--tint:#f2f6f2;--accent:#176355;--warn:#80551d;--bad:#9d3434}*{box-sizing:border-box}button,input,select{font:inherit}button,a,input{touch-action:manipulation}h1,h2,h3,p{margin:0}h1{font-size:clamp(25px,4vw,37px);letter-spacing:-1px;line-height:1.2;font-weight:650;max-width:760px}h2{font-size:20px;letter-spacing:-.3px}h3{font-size:15px;font-weight:650}p{color:var(--muted)}a{color:var(--accent);text-underline-offset:3px}button{padding:10px 15px;border:1px solid #b7cdc3;border-radius:8px;background:#fff;color:var(--ink);cursor:pointer;font-weight:600;font-size:14px;line-height:1.4}button:hover{background:#edf5ef}button.primary{background:var(--accent);border-color:var(--accent);color:#fff}button.primary:hover{background:#0e5246}button:disabled{opacity:.52;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid #267cbd;outline-offset:3px}.wrap{max-width:1140px;margin:0 auto;padding:clamp(18px,3vw,32px);background:#fafcf9;border:1px solid var(--line);border-radius:16px;overflow-wrap:anywhere}.eyebrow{font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}.lead{font-size:16px;max-width:790px;margin-top:14px}.intro{padding-bottom:25px;border-bottom:1px solid var(--line)}.scope{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.scope span{font-size:12px;background:#e9f1ec;border:1px solid #d2e0d8;padding:5px 9px;border-radius:5px;color:#315d50}.layout{display:grid;grid-template-columns:minmax(260px,.75fr) minmax(0,1.35fr);gap:22px;margin-top:24px}.panel{border:1px solid var(--line);border-radius:12px;background:var(--paper);padding:22px}.panel>p{margin-top:8px}.panel+.panel{margin-top:18px}.step{font-size:11px;font-weight:700;color:#61756d;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}.stack>*+*{margin-top:15px}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.section-gap{margin-top:20px}.label{display:block;color:#294a41;font-size:14px;font-weight:650;margin-bottom:8px}input[type=file]{display:block;width:100%;max-width:100%;border:1px solid #c7d8cf;border-radius:8px;background:#f6f9f5;padding:10px;font-size:12px;color:#496358}input[type=file]::file-selector-button{border:0;background:#e5eee7;color:#234e3f;padding:7px 9px;margin-right:9px;border-radius:5px;font-weight:650;cursor:pointer}input[type=text]{padding:10px 12px;border:1px solid #bfd1c7;border-radius:7px;width:100%;font:12px/1.5 ui-monospace,SFMono-Regular,monospace;color:var(--ink)}.hint{font-size:12px;color:#60766c;margin-top:7px}.demo-list{display:grid;gap:9px;margin-top:12px}.demo-list button{text-align:left;font-weight:550}.notice{padding:13px 15px;border-radius:8px;background:#edf4ef;border:1px solid #cedfd3;color:#315c49;margin:18px 0 0;font-size:13px}.notice:empty{display:none}.notice.error{background:#fff2f0;border-color:#e7c0ba;color:#852c2a}.notice.warning{background:#fff8e8;border-color:#e3d3aa;color:#775219}.badge{display:inline-block;font-size:11px;font-weight:650;padding:5px 8px;border:1px solid #d9e2dc;border-radius:5px;background:#f0f5f1;color:#466452}.badge.synthetic{background:#edf3fb;border-color:#cbdcf0;color:#315e8a}.result-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.result-title h2{margin-top:4px}.small{font-size:12px}.strong{color:#264f40;font-weight:650}.empty{padding:24px 2px}.empty p{max-width:550px}.steps{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:18px}.steps li{display:grid;grid-template-columns:30px 1fr;gap:11px;color:var(--muted);font-size:14px}.steps .number{font-size:12px;border:1px solid var(--line);width:28px;height:28px;display:grid;place-items:center;border-radius:50%;color:var(--accent);font-weight:700}.limits{margin-top:17px;padding:14px 16px;background:#f7f5ef;border-left:3px solid #b79b68;border-radius:0 7px 7px 0}.limits p{font-size:13px;color:#6b5d42;margin-top:5px}.table-wrap{overflow:auto;margin-top:18px}table{border-collapse:collapse;width:100%;font-size:13px;text-align:left}caption{text-align:left;font-size:12px;color:#5d7268;padding:0 0 8px}th,td{padding:11px 9px;border-bottom:1px solid #e3eae5;vertical-align:top}thead th{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#65796e}tbody th{min-width:125px;font-weight:600;color:#294b3f}.check-state{display:block;color:#315d4b;font-weight:650;margin-bottom:4px}.check-detail{font-size:12px;color:#63756e}.refused{color:var(--bad)}.counts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.count{background:#f2f6f3;border-radius:6px;padding:7px 10px;font-size:12px;color:#43614f}.count b{color:#1c4e3a;margin-right:5px}.detail-list{display:grid;grid-template-columns:125px minmax(0,1fr);gap:9px 12px;font-size:12px;margin:12px 0 0}.detail-list dt{color:#60776a}.detail-list dd{margin:0;color:#31523f}.mono{font:11px/1.6 ui-monospace,SFMono-Regular,monospace;word-break:break-all}details{margin-top:18px;border-top:1px solid #e1e9e3;padding-top:14px}summary{font-size:13px;font-weight:650;cursor:pointer;color:#315845;padding:3px 0}.findings{padding-left:20px;margin:12px 0 0;font-size:13px;color:#6b5a3f}.findings li+li{margin-top:8px}.actions{margin-top:18px}.tools{margin-top:18px;border-top:1px solid var(--line);padding-top:18px}.tools h3{margin-bottom:8px}.question{border:0;padding:0;margin:17px 0 0}.question legend{font-weight:600;font-size:14px;padding:0;margin-bottom:10px}.choice{display:flex;gap:10px;padding:10px 11px;border:1px solid #dbe4dd;border-radius:7px;margin-top:8px;color:#45634e;font-size:13px;cursor:pointer}.choice:has(input:checked){background:#edf5ef;border-color:#8bb19b}.choice input{margin-top:3px;accent-color:var(--accent)}.practice-result{margin-top:14px}.footer{border-top:1px solid var(--line);padding-top:17px;margin-top:24px;font-size:12px;color:#5e7267}.comparison{border:1px solid #d4dfd6;border-radius:8px;background:#f7faf6;padding:15px;margin-top:13px}.comparison p{font-size:13px;margin-top:6px}.codes{padding-left:18px;font-size:12px;color:#536f5b}.restore-note{font-size:12px;color:#526c5c;margin:10px 0}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@container(max-width:820px){.layout{grid-template-columns:1fr}.panel{padding:18px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}@media print{.input-panel,.practice,.actions,.tools,.footer button{display:none}.wrap{border:0;padding:0;background:#fff}.layout{display:block}.panel{border:0}.table-wrap{overflow:visible}}
[hidden]{display:none!important}button,summary{min-height:44px}summary{align-content:center;font-size:14px}.intro{padding-bottom:18px}h1{font-size:clamp(24px,3vw,32px);letter-spacing:-.6px}.lead{font-size:15px;margin-top:8px}.scope{margin-top:12px}.task-selector{display:flex;gap:6px;padding-top:20px}.task-selector .task{flex:1;max-width:180px}.task.active{background:var(--accent);color:white;border-color:var(--accent)}.layout{align-items:start;margin-top:16px;grid-template-columns:minmax(250px,.8fr) minmax(0,1.3fr)}.panel+.panel{margin-top:0}.panel{padding:20px}.panel>p{font-size:14px}.boundary{margin-top:14px;padding:13px 15px;background:#f6f5ef;border:1px solid #e0dccb;border-radius:8px;color:#605438;font-size:13px}.boundary p{font-size:13px;margin-top:5px}.boundary-list{padding-left:18px;margin:7px 0 0}.boundary-list li+li{margin-top:3px}.result-summary{margin-top:12px}.recovery{margin-top:8px;font-size:13px;color:#725529}.top-actions{margin-top:15px}.next-actions{margin-top:12px;gap:8px}.next-actions button{background:transparent;font-size:13px}.task-next{margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}.selected-file{margin-top:12px;padding:11px 12px;border:1px solid var(--line);border-radius:7px;background:#f4f7f3;font-size:13px;overflow-wrap:anywhere}.selected-file .hint{margin-top:4px;font-size:12px}.pending{border-left:2px solid #b7cdc3;padding-left:10px}.optional-practice{margin-top:20px}.optional-practice>.panel{margin-top:10px}.footer details{margin-top:8px;padding-top:8px}.hint{font-size:13px}.check-detail{font-size:13px}.notice:empty{display:none}.notice{margin-top:14px}.counts{gap:6px}.count{font-size:12px}.table-wrap{margin-top:10px}.detail-list{grid-template-columns:110px minmax(0,1fr)}:host([compact]) .wrap{padding:14px;border-radius:10px}:host([compact]) .layout{grid-template-columns:1fr}:host([compact]) h1{font-size:24px}:host([compact]) .panel{padding:16px}@container(max-width:820px){.layout{grid-template-columns:1fr}}@container(max-width:440px){.wrap{padding:12px;border-radius:10px}.panel{padding:14px}h1{font-size:24px}h2{font-size:19px}.lead{font-size:14px}.top-actions{display:grid}.top-actions button{width:100%}.next-actions{display:grid}.next-actions button{width:100%}.task-selector{gap:5px}.task-selector button{padding:10px 8px}.result-title{gap:6px}.badge{font-size:11px}.detail-list{grid-template-columns:1fr;gap:3px}.detail-list dd{margin-bottom:8px}tbody th{min-width:90px}.table-wrap th,.table-wrap td{padding:9px 5px}.optional-practice summary{font-size:14px}input[type=file]{padding:7px;font-size:12px}.scope{gap:5px}}

`;

const TASKS = {
  inspect: { label: 'Inspect', title: 'Inspect an export', instruction: 'Choose a catalog or disclosure export. The reader checks its structure and recorded relationships.', input: 'Choose an export' },
  reopen: { label: 'Reopen', title: 'Reopen a saved check', instruction: 'First choose the original export. Then select the check summary saved for it. The reader recomputes the result.', input: '1. Choose the original export' },
  compare: { label: 'Compare', title: 'Compare two exports', instruction: 'First choose the later export, then an earlier one. Their order is your selection; this reader cannot establish live freshness.', input: '1. Choose the later export' },
};
const RECOVERY = {
  INVALID_JSON: 'Request a fresh JSON export from the source, then choose it here.',
  INVALID_UTF8: 'Export the record as UTF-8 JSON, then choose that original file.',
  UNSUPPORTED_VERSION: 'Choose an export using supported format 0.1.0. Later formats need a compatible reader.',
  SCHEMA_MISMATCH: 'Choose the catalog or disclosure export, rather than a case file or saved check summary.',
  UNKNOWN_DOCUMENT: 'Choose a SAFE Starter Kit catalog or disclosure JSON export.',
  DUPLICATE_MEMBER: 'Request a new export with unambiguous fields. This reader will not silently choose between duplicates.',
};

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(options)) {
    if (key === 'text') node.textContent = String(value);
    else if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key in node && !key.startsWith('aria')) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}
const p = (text, cls = '') => el('p', { text, class: cls });
const bytes = text => ENCODER.encode(text);
const safeCount = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
const localFileLabel = name => String(name || 'Selected export').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, 160) || 'Selected export';
const readableCode = value => String(value || 'NOT_ESTABLISHED').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase());
function describeComparison(result) {
  if (result.relationship === 'NO_SHARED_DECLARED_ENTRY') return ['Relationship not established', 'The catalogs share no declared entry identifier. This does not establish whether they came from the same catalog; do not infer a version link.'];
  if (result.relationship === 'DIFFERENT_TYPES') return ['Different export types', 'A catalog and a disclosure cannot be compared as versions of one export. This does not establish whether they came from the same system.'];
  if (result.relationship === 'DIFFERENT_DECLARED_PACKAGE') return ['Different declared package identifiers', 'The exports declare different case or package identifiers. Their relationship is not established, and producer identity has not been authenticated.'];
  if (result.decision === 'NO_DOCUMENT_CHANGE' && result.relationship === 'IDENTICAL_BYTES') return ['The selected bytes are identical', 'Both selected files have the same byte identity. This does not establish that either is the latest available version or carries current permission.'];
  return DECISIONS[result.decision] || DECISIONS.NOT_COMPARABLE;
}

export class CouncilSafeCompanion extends HTMLElement {
  static componentVersion = COMPONENT_VERSION;
  static componentProtocol = 'csoai.safe-companion.mount/1';
  static get observedAttributes() { return ['compact']; }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.intent = 'inspect';
    this.selectedFileLabel = '';
    this.earlierFileLabel = '';
    this.savedFileLabel = '';
    this.token = 0;
    this.busy = false;
    this.original = null;
    this.report = null;
    this.synthetic = false;
    this.comparison = null;
    this.practice = null;
    this.choice = null;
    this.message = '';
    this.error = '';
    this.restoreMessage = '';
    this.restoreState = 'idle';
    this.expectedDigest = '';
    this.digestMessage = '';
    this.pendingFocus = null;
    this.urls = new Set();
    this.focusTrackers = new Set();
  }
  connectedCallback() { this.render(); }
  disconnectedCallback() {
    this.cancelFocusTracking();
    this.token++; this.busy = false; this.original = null; this.report = null;
    this.synthetic = false; this.comparison = null; this.practice = null; this.choice = null;
    this.expectedDigest = ''; this.digestMessage = ''; this.restoreMessage = ''; this.restoreState = 'idle';
    this.message = ''; this.error = ''; this.pendingFocus = null; this.intent = 'inspect'; this.revokeURLs();
    this.selectedFileLabel = ''; this.earlierFileLabel = ''; this.savedFileLabel = '';
    this.shadowRoot.replaceChildren(); this.shell = null; this.statusNode = null; this.errorNode = null; this.contentNode = null;
  }
  revokeURLs() { for (const url of this.urls) URL.revokeObjectURL(url); this.urls.clear(); }
  announce(message, error = false) {
    this.message = error ? '' : message;
    this.error = error ? message : '';
    this.render();
    if (error) this.shadowRoot.getElementById('safe-error')?.focus();
  }
  async fileBytes(file) {
    if (!file || file.size === 0) throw new Error('EMPTY_FILE');
    if (file.size > MAX_BYTES) throw new Error('LARGE_FILE');
    return new Uint8Array(await file.arrayBuffer());
  }
  download(name, data, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([data], { type }));
    this.urls.add(url);
    const link = el('a', { href: url, download: name });
    this.shadowRoot.append(link); link.click(); link.remove();
    setTimeout(() => { URL.revokeObjectURL(url); this.urls.delete(url); }, 1000);
  }
  saveReport() {
    if (!this.report) return;
    this.download('Council-SAFE-assessment.json', JSON.stringify(this.report, null, 2) + '\n');
    this.announce('Check-summary download requested. Keep the matching original separately. To return, choose Reopen and select both files; this reader does not keep them.');
  }
  reset() {
    this.cancelFocusTracking();
    this.token++; this.busy = false; this.original = null; this.report = null; this.synthetic = false;
    this.comparison = null; this.practice = null; this.choice = null; this.restoreMessage = ''; this.restoreState = 'idle';
    this.selectedFileLabel = ''; this.earlierFileLabel = ''; this.savedFileLabel = '';
    this.expectedDigest = ''; this.digestMessage = ''; this.error = ''; this.pendingFocus = null; this.message = 'Selected export and results cleared from this reader.';
    this.revokeURLs(); this.render(); this.shadowRoot.getElementById('safe-export')?.focus();
  }
  setIntent(intent) {
    if (!TASKS[intent] || this.busy) return;
    this.intent = intent; this.error = ''; this.message = ''; this.render();
    this.shadowRoot.getElementById('task-' + intent)?.focus({ preventScroll: true });
  }
  beginFocusTracking() {
    const doc = this.ownerDocument;
    const eligible = doc.activeElement === this || doc.activeElement === doc.body;
    let moved = false, stopped = false;
    const markMoved = () => { moved = true; };
    const stop = (cancelled = false) => {
      if (cancelled) moved = true;
      if (!stopped) {
        stopped = true;
        doc.removeEventListener('focusin', markMoved, true);
        doc.removeEventListener('pointerdown', markMoved, true);
        this.focusTrackers.delete(stop);
      }
      return eligible && !moved && this.isConnected && (doc.activeElement === this || doc.activeElement === doc.body);
    };
    doc.addEventListener('focusin', markMoved, true);
    doc.addEventListener('pointerdown', markMoved, true);
    this.focusTrackers.add(stop);
    return stop;
  }
  cancelFocusTracking() { for (const stop of [...this.focusTrackers]) stop(true); }
  focusOutcome(id) {
    if (document.activeElement !== this && document.activeElement !== document.body) return;
    const target = this.shadowRoot.getElementById(id);
    target?.focus({ preventScroll: true });
    if (target) { const box = target.getBoundingClientRect(); if (box.top < 0 || box.bottom > innerHeight) target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }
  focusResult() {
    const next = this.intent === 'reopen' ? 'saved-assessment' : this.intent === 'compare' ? 'earlier-export' : 'result-title';
    this.focusOutcome(this.shadowRoot.getElementById(next) ? next : 'result-title');
  }
  async load(input, synthetic = false) {
    this.cancelFocusTracking();
    const token = ++this.token;
    this.busy = true; this.error = ''; this.message = 'Inspecting the selected bytes…';
    this.original = null; this.report = null; this.comparison = null; this.restoreMessage = ''; this.restoreState = 'idle';
    this.selectedFileLabel = synthetic ? input === CATALOG_EXAMPLE_TEXT ? 'Synthetic catalog example' : 'Synthetic disclosure example'
      : input instanceof File ? localFileLabel(input.name) : 'Selected export';
    this.earlierFileLabel = ''; this.savedFileLabel = '';
    this.synthetic = synthetic; this.expectedDigest = ''; this.digestMessage = ''; this.render();
    const finishFocus = this.beginFocusTracking();
    try {
      const original = input instanceof File ? await this.fileBytes(input) : bytes(input);
      if (original.byteLength === 0 || original.byteLength > MAX_BYTES) throw new Error('FILE_BOUNDARY');
      const { report } = await inspectExport(original);
      if (token !== this.token || !this.isConnected) return;
      this.original = original;
      this.report = report;
      this.message = report.accepted_for_reading
        ? this.intent === 'reopen' ? 'Original inspected. Next choose its saved check summary.'
          : this.intent === 'compare' ? 'Later export inspected. Next choose the earlier export.'
          : 'Inspection complete. The result separates readable records from authority and observed effects.'
        : 'The export was not accepted for reading. The original bytes have not been changed.';
    } catch (error) {
      if (token !== this.token || !this.isConnected) return;
      this.error = error?.message === 'EMPTY_FILE' ? 'This file is empty. Choose a complete JSON export.'
        : error?.message === 'LARGE_FILE' ? 'This file is larger than 1 MiB. Request a smaller export from the source; do not truncate the original.'
        : 'The file could not be inspected. Choose a UTF-8 JSON export no larger than 1 MiB, or try an example.';
      this.message = '';
    } finally {
      const shouldFocus = finishFocus();
      if (token === this.token && this.isConnected) { this.busy = false; this.render(shouldFocus); if (shouldFocus) { if (this.error) this.focusOutcome('safe-error'); else this.focusResult(); } }
    }
  }
  async restore(file) {
    if (!file || !this.original || this.busy) return;
    const token = ++this.token; this.busy = true; this.error = ''; this.restoreMessage = 'Checking this saved summary against the selected original…'; this.restoreState = 'checking'; this.savedFileLabel = localFileLabel(file.name);
    this.message = 'Checking the saved summary against the selected original…'; this.render();
    const finishFocus = this.beginFocusTracking();
    try {
      const saved = await this.fileBytes(file);
      const result = await verifySavedReport(this.original, saved);
      if (token !== this.token || !this.isConnected) return;
      if (!result.matches) throw new Error('ASSESSMENT_MISMATCH');
      this.report = result.report;
      this.restoreState = 'matched';
      this.restoreMessage = 'The saved assessment matches a fresh inspection of the selected original bytes. Current external authority and latest-version status are still not established.';
      this.message = 'Saved assessment checked against the original.';
    } catch {
      if (token !== this.token || !this.isConnected) return;
      this.error = 'The saved assessment could not be matched to this original. Its imported conclusions were not used. Select the matching original and retry.';
      this.restoreState = 'failed';
      this.restoreMessage = 'Saved check not matched. Its imported conclusions were not used. Choose the matching original and saved summary to retry.';
    } finally {
      const shouldFocus = finishFocus();
      if (token === this.token && this.isConnected) { this.busy = false; this.render(shouldFocus); if (shouldFocus) this.focusOutcome('saved-check-status'); }
    }
  }
  async compare(file) {
    if (!file || !this.original || this.busy) return;
    const token = ++this.token; this.busy = true; this.error = ''; this.comparison = null; this.earlierFileLabel = localFileLabel(file.name);
    this.message = 'Comparing the selected earlier and later exports…'; this.render();
    const finishFocus = this.beginFocusTracking();
    try {
      const previous = await this.fileBytes(file);
      const result = await compareExports(previous, this.original);
      if (token !== this.token || !this.isConnected) return;
      this.comparison = result;
      const [headline, detail] = describeComparison(result);
      this.message = 'Comparison complete: ' + headline + '. ' + detail;
    } catch {
      if (token !== this.token || !this.isConnected) return;
      this.error = 'The comparison could not be completed. Choose a supported earlier export under 1 MiB. No earlier conclusion has been carried forward.';
    } finally {
      const shouldFocus = finishFocus();
      if (token === this.token && this.isConnected) { this.busy = false; this.render(shouldFocus); if (shouldFocus) this.focusOutcome(this.error ? 'safe-error' : 'comparison-title'); }
    }
  }
  checkExpectedDigest() {
    if (!this.report) return;
    const expected = this.expectedDigest.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(expected)) { this.setDigestMessage('Enter exactly 64 hexadecimal characters from a separately trusted source.'); return; }
    this.setDigestMessage(expected === this.report.input.sha256
      ? 'The selected bytes match the supplied digest. This checks the byte identity against your expectation; the reader has not authenticated where that expectation came from.'
      : 'The selected bytes do not match the supplied digest. Do not substitute this file for the expected record.');
  }
  setDigestMessage(message) {
    this.digestMessage = message;
    const node = this.shadowRoot.getElementById('expected-digest-status');
    if (node) node.textContent = message;
  }
  async runPractice() {
    if (this.choice === null || this.busy) return;
    const token = ++this.token; this.busy = true; this.error = ''; this.practice = null;
    this.message = 'Running the original example and a deliberate duplicate-entry error…'; this.render();
    const finishFocus = this.beginFocusTracking();
    try {
      const original = bytes(CATALOG_EXAMPLE_TEXT);
      const changed = JSON.parse(CATALOG_EXAMPLE_TEXT);
      changed.catalog_export.entries.push(structuredClone(changed.catalog_export.entries[0]));
      const altered = bytes(JSON.stringify(changed));
      const positive = await inspectExport(original);
      const negative = await inspectExport(altered);
      if (token !== this.token || !this.isConnected) return;
      const detected = positive.report.accepted_for_reading === true && negative.report.accepted_for_reading === false &&
        negative.report.findings.some(f => f.code === 'DUPLICATE_ENTRY_ID');
      this.practice = {
        format: 'csoai.safe-companion-practice/0.1-experimental',
        completed_at: new Date().toISOString(), scenario: 'catalog-duplicate-entry',
        reader: positive.report.reader, original_sha256: positive.report.input.sha256,
        negative_control_sha256: negative.report.input.sha256,
        expected: 'DUPLICATE_ENTRY_ID', negative_control_detected: detected,
        positive_accepted: positive.report.accepted_for_reading, negative_accepted: negative.report.accepted_for_reading,
        answer_correct: this.choice === 1, state: detected && this.choice === 1 ? 'REPRODUCED_LOCAL_PRACTICE' : 'NOT_REPRODUCED',
        human_competence_assessed: false, grants_authority: false, certificate_issued: false,
        limitations: ['Synthetic reader exercise only.', 'No human appointment or external action occurred.', 'This local result is not a canonical Academy credential.'],
      };
      this.message = this.practice.state === 'REPRODUCED_LOCAL_PRACTICE'
        ? 'Practice complete: the original was accepted and the duplicate was refused. Your answer preserves the evidence boundary. No authority or credential was granted.'
        : 'Practice incomplete. Review the reader outcome and your answer. No authority or credential was granted.';
    } catch {
      if (token !== this.token || !this.isConnected) return;
      this.error = 'The exercise could not complete. No practice result or authority was issued.';
    } finally {
      const shouldFocus = finishFocus();
      if (token === this.token && this.isConnected) { this.busy = false; this.render(shouldFocus); if (shouldFocus) this.focusOutcome(this.error ? 'safe-error' : 'practice-result'); }
    }
  }
  button(text, action, options = {}) { return el('button', { id: 'safe-btn-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-'), type: 'button', text, disabled: this.busy, onclick: action, ...options }); }
  fileInput(id, label, action, hint) {
    return el('div', {}, [el('label', { class: 'label', htmlFor: id, text: label }),
      el('input', { id, 'data-testid': id, type: 'file', accept: '.json,application/json', disabled: this.busy, 'aria-describedby': id + '-hint',
        onchange: event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) action(file); } }),
      el('p', { id: id + '-hint', class: 'hint', text: hint })]);
  }
  taskSelector() {
    return el('div', { class: 'task-selector', role: 'group', 'aria-label': 'What would you like to do?' },
      Object.entries(TASKS).map(([key, task]) => this.button(task.label, () => this.setIntent(key), {
        id: 'task-' + key, 'data-testid': 'task-' + key, 'aria-pressed': String(this.intent === key),
        class: this.intent === key ? 'task active' : 'task',
      })));
  }
  inputPanel() {
    const task = TASKS[this.intent];
    const block = el('section', { class: 'panel input-panel', 'aria-labelledby': 'choose-title', part: 'input' }, [
      el('h2', { id: 'choose-title', text: task.title }), p(task.instruction),
      el('div', { class: 'section-gap' }, [this.fileInput('safe-export', task.input, file => this.load(file), 'JSON · up to 1 MiB · export version 0.1.0')]),
    ]);
    if (this.selectedFileLabel) block.append(el('div', { class: 'selected-file', 'data-testid': 'selected-file' }, [
      el('strong', { text: this.intent === 'compare' ? 'Later candidate: ' : 'Selected original: ' }),
      el('span', { text: this.selectedFileLabel }),
      p(this.report?.input?.sha256 ? 'SHA-256 starts ' + this.report.input.sha256.slice(0, 12) + '…' : 'No file identity established yet.', 'hint'),
      p('Filename shown locally only; omitted from saved check summaries.', 'hint'),
    ]));
    if (this.intent === 'reopen') {
      if (this.original) block.append(el('div', { class: 'task-next' }, [
        this.fileInput('saved-assessment', '2. Choose the saved check summary', file => this.restore(file), 'The original is selected. This summary will be recomputed, not trusted.'),
        ...(this.savedFileLabel ? [p('Selected summary: ' + this.savedFileLabel, 'hint')] : []),
        el('p', { id: 'saved-check-status', 'data-testid': 'saved-check-status', tabindex: -1, class: this.restoreState === 'failed' ? 'notice error' : 'restore-note', text: this.restoreMessage }),
      ]));
      else block.append(p('Next: the saved-summary selector appears after the original is read.', 'hint pending'));
    }
    if (this.intent === 'compare') {
      if (this.original) block.append(el('div', { class: 'task-next' }, [
        this.fileInput('earlier-export', '2. Choose the earlier export', file => this.compare(file), 'The current selection is the later candidate. Neither file establishes the latest live state.'),
        ...(this.earlierFileLabel ? [p('Selected earlier file: ' + this.earlierFileLabel, 'hint')] : []),
      ]));
      else block.append(p('Next: the earlier-export selector appears after the later export is read.', 'hint pending'));
    }
    if (this.original || this.busy || this.practice || this.error) block.append(el('div', { class: 'actions' }, [this.button('Clear selected export', () => this.reset(), { disabled: false, 'data-testid': 'reset' })]));
    block.append(el('details', { id: 'safe-examples' }, [el('summary', { text: 'Try an example instead', 'data-testid': 'examples-toggle' }),
      p('Synthetic data only. Choosing an example replaces the selected file in this reader.', 'hint'),
      el('div', { class: 'demo-list' }, [this.button('Inspect a catalog example', () => this.load(CATALOG_EXAMPLE_TEXT, true), { 'data-testid': 'demo-catalog' }), this.button('Inspect a disclosure example', () => this.load(DISCLOSURE_EXAMPLE_TEXT, true), { 'data-testid': 'demo-disclosure' })]),
    ]));
    block.append(p('This component does not upload files. Other scripts on an embedded page are outside its privacy boundary.', 'hint'));
    return block;
  }
  emptyResult() {
    return el('section', { class: 'panel', 'aria-labelledby': 'result-title', 'data-testid': 'empty-result', part: 'result' }, [
      el('h2', { id: 'result-title', text: this.intent === 'inspect' ? 'Your result appears here' : this.intent === 'reopen' ? 'Bring the original and its saved check' : 'Bring the later and earlier exports' }),
      p(this.intent === 'inspect' ? 'See what the file supports, what remains unproven and what to do next.' : this.intent === 'reopen' ? 'A saved summary is matched against a new inspection of the original. Imported conclusions never replace the check.' : 'Compare recorded changes without carrying an earlier permission forward.'),
      el('div', { class: 'boundary' }, [el('strong', { text: 'Reading is not approval.' }), p('This reader does not authenticate a person, authorise an action or observe an external effect.')]),
    ]);
  }
  resultPanel() {
    const report = this.report;
    if (!report) return this.emptyResult();
    const result = el('section', { class: 'panel', 'aria-labelledby': 'result-title', 'data-testid': 'inspection-result', part: 'result' });
    const title = report.accepted_for_reading ? 'Inspection complete' : 'Export not accepted';
    result.append(el('div', { class: 'result-title' }, [el('div', {}, [p(TYPE_NAMES[report.input.type] || TYPE_NAMES.unknown, 'step'), el('h2', { id: 'result-title', tabindex: -1, text: title })]),
      el('span', { class: 'badge' + (this.synthetic ? ' synthetic' : ''), text: this.synthetic ? 'Synthetic example' : 'Local file' })]));
    const findings = report.findings || [];
    const refusal = findings.find(f => f.severity === 'refusal');
    result.append(p(report.accepted_for_reading ? 'The supported structure and recorded relationships can be read.' : refusal?.message || 'The file could not be read within the supported format.', report.accepted_for_reading ? 'result-summary' : 'result-summary refused'));
    if (!report.accepted_for_reading) result.append(p(RECOVERY[refusal?.code] || 'Check the source records and request a corrected export. The original has not been changed.', 'recovery'));
    for (const finding of findings.filter(f => f.severity === 'warning' || f.code === 'TIMESTAMP_ORDER_ANOMALY')) result.append(p(finding.message, 'notice warning'));
    const freshness = report.checks.find(check => check.id === 'freshness');
    result.append(el('div', { class: 'boundary', 'data-testid': 'evidence-boundary' }, [
      el('strong', { text: 'These checks do not establish permission.' }),
      el('ul', { class: 'boundary-list' }, [
        el('li', { text: 'Human authority: not established' }),
        el('li', { text: 'External effect: not observed' }),
        el('li', { text: freshness?.state === 'SUPERSEDED_AS_DECLARED' ? 'Source status: historical, as declared' : 'Latest source and revocation: unconfirmed' }),
      ]),
    ]));
    result.append(el('div', { class: 'actions row top-actions' }, [this.button('Save check summary', () => this.saveReport(), { class: 'primary', 'data-testid': 'save-assessment' }),
      this.button('Save exact original', () => { this.download('SAFE-original-export.json', this.original); this.announce('Original-file download requested. It may contain restricted metadata. Keep its sharing limits and retain the matching check summary separately.'); }, { 'data-testid': 'save-original' })]));
    result.append(p('The unsigned summary omits record text and identities. Its digest and counts can still be sensitive.', 'hint'));
    if (this.intent === 'inspect') result.append(el('div', { class: 'row next-actions' }, [
      this.button('Reopen a saved check', () => this.setIntent('reopen'), { 'data-testid': 'go-reopen' }),
      this.button('Compare an earlier export', () => this.setIntent('compare'), { 'data-testid': 'go-compare' }),
    ]));
    if (this.comparison && this.intent === 'compare') {
      const [headline, detail] = describeComparison(this.comparison);
      result.append(el('div', { class: 'comparison', 'data-testid': 'comparison-result' }, [el('h3', { id: 'comparison-title', tabindex: -1, text: headline }), p(detail),
        el('ul', { class: 'codes' }, (this.comparison.changes || []).map(code => el('li', { text: readableCode(code) }))),
        el('div', { class: 'actions' }, [this.button('Save comparison', () => { this.download('Council-SAFE-comparison.json', JSON.stringify(this.comparison, null, 2) + '\n'); this.announce('Comparison download requested. It is an unsigned check; no assignment, charter change or permission was created.'); })]),
      ]));
    }
    const counts = report.counts || {};
    if (report.accepted_for_reading) result.append(el('div', { class: 'counts' }, (report.input.type === 'catalog'
      ? [['Entries', counts.entries], ['Recorded versions', counts.versions], ['Declared fail', counts.declared_fail]]
      : [['Visible items', counts.visible_items], ['Withheld items', counts.withheld_items]])
      .map(([label, value]) => el('span', { class: 'count' }, [el('b', { text: safeCount(value) }), document.createTextNode(label)]))));
    if (report.accepted_for_reading && report.input.type === 'catalog') result.append(p('Outcomes are reported by the source across its recorded version history.', 'hint'));
    const checks = el('details', { id: 'safe-checks' }, [el('summary', { text: 'Inspect all checks and recorded outcomes', 'data-testid': 'checks-toggle' })]);
    if (report.input.type === 'catalog' && report.accepted_for_reading) checks.append(p(`Across recorded versions: ${safeCount(counts.declared_pass)} declared pass, ${safeCount(counts.declared_fail)} declared fail, ${safeCount(counts.declared_inconclusive)} inconclusive. These are source reports, not tests run by this reader.`, 'hint'));
    const body = el('tbody');
    for (const check of report.checks || []) body.append(el('tr', {}, [
      el('th', { scope: 'row', text: CHECK_NAMES[check.id] || readableCode(check.id) }),
      el('td', {}, [el('span', { class: 'check-state' + (/FAIL|REFUSED|MISMATCH|CONTRADICTED/.test(check.state) ? ' refused' : ''), text: STATE_NAMES[check.state] || readableCode(check.state) }), p(check.message || 'Inspect the reported check limits.', 'check-detail')]),
    ]));
    checks.append(el('div', { class: 'table-wrap' }, [el('table', {}, [el('caption', { text: 'Separate properties; no overall safety or approval verdict' }),
      el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: 'Property' }), el('th', { scope: 'col', text: 'Finding' })])]), body]) ]));
    if (findings.length) checks.append(el('ul', { class: 'findings' }, findings.map(f => el('li', { text: f.message || readableCode(f.code) }))));
    result.append(checks);
    const details = el('details', { id: 'safe-identity' }, [el('summary', { id: 'safe-identity-toggle', text: 'File identity and reader version' })]);
    const list = el('dl', { class: 'detail-list' });
    for (const [label, value, mono] of [
      ['Original SHA-256', report.input.sha256, true], ['Size', safeCount(report.input.bytes).toLocaleString('en-GB') + ' bytes', false],
      ['Export version', report.input.schema_version || 'Not identified', false], ['Reader', report.reader?.version || 'Not identified', false],
      ['Upstream commit', report.reader?.upstream_commit || 'Not identified', true],
    ]) list.append(el('dt', { text: label }), el('dd', { text: value, class: mono ? 'mono' : '' }));
    details.append(list, p('This hash identifies the selected bytes. The supported source commit does not authenticate the producer of your file.', 'hint'));
    const digestField = el('input', { type: 'text', id: 'expected-digest', value: this.expectedDigest, maxlength: 64, spellcheck: false, autocomplete: 'off',
      oninput: event => { this.expectedDigest = event.target.value; this.setDigestMessage(''); }, 'aria-describedby': 'digest-help expected-digest-status' });
    details.append(el('div', { class: 'section-gap' }, [el('label', { class: 'label', htmlFor: 'expected-digest', text: 'Expected SHA-256 from a separate source (optional)' }), digestField,
      el('p', { id: 'digest-help', class: 'hint', text: 'A hash copied from the same file or summary is not an independent expectation.' }),
      el('div', { class: 'actions' }, [this.button('Compare expected digest', () => this.checkExpectedDigest())]),
      el('p', { id: 'expected-digest-status', 'data-testid': 'expected-digest-status', class: 'hint', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', text: this.digestMessage }),
    ]));
    result.append(details);
    return result;
  }
  practicePanel() {
    const panel = el('section', { class: 'panel practice', 'aria-labelledby': 'practice-title' }, [p('03 / Practise', 'step'),
      el('h2', { id: 'practice-title', text: 'Check that the reader can say no' }),
      p('Run a synthetic catalog, then the same catalog with one repeated entry. A useful reader must accept the valid structure and refuse the duplicate.')]);
    const fieldset = el('fieldset', { class: 'question' }, [el('legend', { text: 'The original format checks succeed. What does that establish?' })]);
    const options = ['The producer and human approver are authenticated.', 'The supported structure is readable; authority and effects still need separate evidence.', 'The export gives permission to act on every listed finding.'];
    options.forEach((option, i) => fieldset.append(el('label', { class: 'choice' }, [el('input', { id: 'safe-practice-' + i, type: 'radio', name: 'safe-practice', value: String(i), checked: this.choice === i, disabled: this.busy,
      onchange: () => { this.choice = i; this.practice = null; this.render(); this.shadowRoot.getElementById('safe-practice-' + i)?.focus(); } }), el('span', { text: option })])));
    panel.append(fieldset, el('div', { class: 'actions' }, [this.button('Run the reproduction checks', () => this.runPractice(), { class: 'primary', 'data-testid': 'run-practice', disabled: this.busy || this.choice === null })]));
    if (this.practice) {
      const passed = this.practice.state === 'REPRODUCED_LOCAL_PRACTICE';
      panel.append(el('div', { id: 'practice-result', 'data-testid': 'practice-result', tabindex: -1, class: 'notice' + (passed ? '' : ' warning') }, [
        el('strong', { text: passed ? 'The reader caught the negative control.' : 'The practice result is incomplete.' }),
        p(this.practice.negative_control_detected ? 'The original was accepted and the duplicate was refused.' : 'The required acceptance/refusal pair was not established.'),
        p(this.practice.answer_correct ? 'Your answer preserves the distinction between structure, authority and effect.' : 'A readable format alone does not authenticate a person or prove an effect. Review the evidence boundary and try again.'),
      ]));
      panel.append(el('div', { class: 'actions' }, [this.button('Save local practice result', () => this.download('Council-SAFE-practice.json', JSON.stringify(this.practice, null, 2) + '\n'))]));
    }
    panel.append(p('This exercise records local practice with synthetic inputs. It does not assess professional competence, appoint a reviewer or grant execution authority.', 'hint'));
    return panel;
  }
  render(restorePendingFocus = true) {
    if (!this.shadowRoot) return;
    const openDetails = [...this.shadowRoot.querySelectorAll('details[open][id]')].map(node => node.id);
    const active = this.shadowRoot.activeElement;
    const focusId = active?.id;
    const focusTestId = active?.getAttribute('data-testid');
    if (this.busy && (focusId || focusTestId)) this.pendingFocus = { id: focusId, testId: focusTestId };
    if (!this.shell) {
      const style = el('style', { text: CSS });
      const nonce = this.getAttribute('style-nonce');
      if (nonce) style.nonce = nonce;
      this.shell = el('div', { class: 'wrap', part: 'surface' });
      this.shell.append(el('header', { class: 'intro', part: 'header' }, [p('Council of AI / Evidence review', 'eyebrow'),
        el('h1', { text: 'SAFE export reader' }),
        p('Inspect a file, revisit a saved check or compare versions. Keep evidence and permission separate.', 'lead'),
        el('div', { class: 'scope' }, [el('span', { text: 'Read-only' }), el('span', { text: 'Local processing' })]),
      ]));
      this.statusNode = el('div', { class: 'notice', id: 'safe-status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', tabindex: -1 });
      this.errorNode = el('div', { class: 'notice error', id: 'safe-error', role: 'alert', 'aria-live': 'assertive', tabindex: -1, hidden: true });
      this.contentNode = el('div');
      this.shell.append(this.statusNode, this.errorNode, this.contentNode);
      this.shell.append(el('footer', { class: 'footer' }, [
        p('Independent Council of AI reader for Theseus Guard’s SAFE Starter Kit format; not an official Alliance product.'),
        el('details', { id: 'safe-privacy' }, [el('summary', { text: 'Privacy, scope and keeping your work' }),
          p('This component does not upload, track or use browser storage. The surrounding page and its scripts are outside that boundary. Use a reviewed standalone copy in a trusted browser for restricted exports.', 'hint'),
          p('Closing this reader clears its selection. Download a check summary and keep the matching original to revisit it. Downloads retain their sharing restrictions.', 'hint'),
          p('No case, reviewer assignment, external submission, charter amendment, permission or execution is created here.', 'hint'),
        ]),
      ]));
      this.shadowRoot.replaceChildren(style, this.shell);
    }
    this.contentNode.replaceChildren(this.taskSelector(), el('div', { class: 'layout' }, [this.inputPanel(), this.resultPanel()]),
      el('details', { id: 'safe-practice', class: 'optional-practice' }, [
        el('summary', { text: 'Optional practice: test the reader with a deliberate error', 'data-testid': 'practice-toggle' }), this.practicePanel(),
      ]));
    this.statusNode.textContent = this.error ? '' : this.message;
    this.errorNode.textContent = this.error;
    this.errorNode.hidden = !this.error;
    this.contentNode.setAttribute('aria-busy', String(this.busy));
    for (const id of openDetails) { const detail = this.shadowRoot.getElementById(id); if (detail) detail.open = true; }
    const restore = { id: focusId, testId: focusTestId };
    if (restorePendingFocus && !restore.id && !restore.testId && !this.busy && this.pendingFocus) Object.assign(restore, this.pendingFocus);
    const previousFocus = restore.id ? this.shadowRoot.getElementById(restore.id)
      : restore.testId ? [...this.shadowRoot.querySelectorAll('[data-testid]')].find(node => node.getAttribute('data-testid') === restore.testId) : null;
    if (previousFocus && !previousFocus.disabled && (document.activeElement === this || document.activeElement === document.body)) previousFocus.focus({ preventScroll: true });
    if (!this.busy) this.pendingFocus = null;
  }
}
if (!customElements.get('council-safe-companion')) customElements.define('council-safe-companion', CouncilSafeCompanion);
