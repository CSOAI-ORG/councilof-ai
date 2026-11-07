import {publicURL, validateBoard, captureForStorage, measurementTimeLabel} from './contract.mjs';

// Public-source comprehension only. No model calls, credentials, promotion or authority.
export const REPORT_PRACTICE_VERSION = '1';
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export async function compileReportPractice(capture, axis) {
  if (!capture || capture.url !== publicURL('/api/gspc') ||
      typeof capture.raw !== 'string' || capture.raw.length > 2_000_000) {
    throw Error('Read the public GSPC source before creating report practice.');
  }
  // Parse and hash the same bytes; supplied parsed data and digest are not trusted.
  const data = validateBoard(JSON.parse(capture.raw));
  const row = data.axes.find(item => item.axis === axis);
  if (!row) throw Error('The selected axis is absent from this source revision.');
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(capture.raw)
  ))).map(x => x.toString(16).padStart(2, '0')).join('');
  const source = captureForStorage({url: capture.url, readAt: capture.readAt, sha256, data});
  const measurementTime = measurementTimeLabel(row.measurement_time);
  return freeze({
    schema: 'csoai.report-practice/0.1', version: REPORT_PRACTICE_VERSION,
    id: `${axis}:${sha256}:${REPORT_PRACTICE_VERSION}`, axis,
    source: {url: source.url, readAt: source.readAt, sha256},
    task: row.task, measurementTime,
    reported: {status: row.status, n: row.n},
    grants_authority: false,
    questions: [
      {id: 'status', question: 'Which measurement status does this pinned report record?',
       options: ['Certified compliant', row.status, 'Approved for every deployment'], answer: 1,
       explanation: `The source records ${row.status}. This status alone establishes neither certification nor permission to act.`},
      {id: 'count', question: 'What value of n does this report record for the selected axis?',
       options: [String(row.n + 1), 'The number of AI systems worldwide', String(row.n)], answer: 2,
       explanation: `The recorded n is ${row.n}. Consult the original method for its denominator; do not reinterpret it as incidents, users or all AI systems.`},
      {id: 'time', question: 'Which statement describes the measurement date in this report?',
       options: [measurementTime, 'It is the time this browser downloaded the report', 'It becomes current whenever the page refreshes'], answer: 0,
       explanation: 'Retrieval and measurement dates are different. A missing or uncheckable date remains unknown; reading a report does not renew its evidence.'}
    ]
  });
}
