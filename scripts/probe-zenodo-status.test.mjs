import {test} from 'node:test';
import assert from 'node:assert/strict';
import {numericId, composeNotice, composeEvent, composeRule, supersededNotice, refreshStatus, CONTROL_DOI} from './probe-zenodo-status.mjs';

// WHY A TEST FOR THE PROBE. The notice this script writes is a published claim about
// somebody else's service. It has to be able to say "gone" and it has to be able to say
// "I could not tell". A probe that cannot distinguish the two would write "every record
// is gone" the day Zenodo blocked our access - which is exactly the sentence this script
// exists to correct.

test('numericId strips the "zenodo." prefix - probing it unstripped is a malformed request', () => {
  assert.equal(numericId('10.5281/zenodo.21991104'), '21991104');
  assert.equal(numericId('10.5281/zenodo.22293340'), '22293340');
});

test('the notice states the counts, the date and the control - and does not say "every"', () => {
  const notice = composeNotice({
    gone: 37, live: [{doi: '10.5281/zenodo.22293340'}, {doi: '10.5281/zenodo.22344048'}],
    total: 39, observed_at: '2026-10-28T13:00:00Z', control_doi: CONTROL_DOI, control_status: 200,
  });
  assert.match(notice, /37 of 39/);
  assert.match(notice, /2 answered HTTP 200/);
  assert.match(notice, /2026-10-28T13:00:00Z/);
  assert.match(notice, /control record that is not ours/);
  assert.doesNotMatch(notice, /every CSOAI Zenodo record/i);
  assert.match(notice, /point-in-time observation, not a standing all-clear/);
});

test('the event text is corrected too - it said "every record" as well', () => {
  const event = composeEvent({
    gone: 37, live: [{doi: '10.5281/zenodo.22293340'}], total: 39,
    observed_at: '2026-10-28T13:00:00Z', control_doi: CONTROL_DOI, control_status: 200,
  });
  assert.match(event, /37 of the 39 deposits we name were answering HTTP 410/);
  assert.match(event, /One record did not/);
  assert.match(event, /already wrong on the day it was written/);
  assert.doesNotMatch(event, /Every record on the account began answering/);
});

test('the superseded notice AND event are kept verbatim, with the date they were published', () => {
  const previous = {as_of: '2026-09-29T16:46Z', notice: 'every record returns 410', method: 'doi.org', event: 'Every record on the account began answering HTTP 410'};
  const s = supersededNotice(previous);
  assert.equal(s.superseded_notice, 'every record returns 410');
  assert.equal(s.superseded_as_of, '2026-09-29T16:46Z');
  assert.equal(s.superseded_method, 'doi.org');
  assert.equal(s.superseded_event, 'Every record on the account began answering HTTP 410');
});

test('EVERY sentence this probe replaces is kept verbatim - including the rule', () => {
  // The probe rewrites notice, event and rule. If it rewrites one of them and does not keep
  // the old text beside the new, the correction is silent - the failure this register row
  // (A12) is about. This test names the three fields on purpose: adding a fourth rewritten
  // field without adding it here is the thing this test exists to catch.
  const previous = {
    as_of: '2026-09-29T16:46Z',
    notice: 'OLD NOTICE',
    method: 'OLD METHOD',
    event: 'OLD EVENT',
    rule: 'OLD RULE',
  };
  const s = supersededNotice(previous);
  assert.equal(s.superseded_notice, 'OLD NOTICE');
  assert.equal(s.superseded_method, 'OLD METHOD');
  assert.equal(s.superseded_event, 'OLD EVENT');
  assert.equal(s.superseded_rule, 'OLD RULE');

  // The rewritten fields of the output document and the preserved fields of the superseded
  // block must cover the same set. A field present in one and absent in the other is a
  // silent edit.
  const REWRITTEN = ['notice', 'event', 'rule', 'method'];
  const PRESERVED = {notice: 'superseded_notice', event: 'superseded_event', rule: 'superseded_rule', method: 'superseded_method'};
  for (const field of REWRITTEN) {
    assert.ok(PRESERVED[field], `${field} is rewritten but has no preserved counterpart`);
    assert.ok(Object.prototype.hasOwnProperty.call(s, PRESERVED[field]), `${field} is not preserved verbatim`);
  }
});

test('the rule is corrected too - it used to say no surface links a deposit as available', () => {
  const rule = composeRule({gone: 37, total: 39, live: [{doi: '10.5281/zenodo.22344048'}], observed_at: '2026-10-28T12:01:50Z'});
  assert.ok(!/No surface we publish links one as available/.test(rule), 'the old blanket rule text is still there');
  assert.match(rule, /RESOLVED_AT_CHECK/);
  assert.match(rule, /point-in-time/);
});

test('running the probe TWICE does not lose the original text', async () => {
  // The failure this catches: run 1 replaces the notice and stashes the original under
  // `superseded`. Run 2 reads the corrected file and, if it is not careful, stashes run 1's
  // text instead - so the ORIGINAL 29 September wording is destroyed by a routine
  // re-probe, silently. The block must always carry the text published before ANY
  // supersession, however many times the probe runs.
  const original = {
    as_of: '2026-09-29T16:46Z',
    notice: 'ORIGINAL NOTICE: every record returns 410',
    method: 'ORIGINAL METHOD: doi.org',
    event: 'ORIGINAL EVENT: Every record on the account began answering 410',
    rule: 'ORIGINAL RULE: no surface links a deposit as available',
  };
  const fetcher = async (url) => (url.includes('3234648')
    ? {status: 200, url, arrayBuffer: async () => new ArrayBuffer(4)}
    : {status: 410, url, arrayBuffer: async () => new ArrayBuffer(64)});

  // run 1
  const run1 = await refreshStatus(structuredClone(original), {fetcher, observed_at: '2026-10-28T12:01:50Z'});
  assert.equal(run1.superseded.superseded_notice, 'ORIGINAL NOTICE: every record returns 410');
  assert.equal(run1.superseded.superseded_as_of, '2026-09-29T16:46Z');

  // run 2, on the file run 1 wrote
  const run2 = await refreshStatus(structuredClone(run1), {fetcher, observed_at: '2026-10-28T13:00:00Z'});
  assert.equal(run2.superseded.superseded_notice, 'ORIGINAL NOTICE: every record returns 410',
    'run 2 replaced the preserved original with run 1\'s text');
  assert.equal(run2.superseded.superseded_event, 'ORIGINAL EVENT: Every record on the account began answering 410');
  assert.equal(run2.superseded.superseded_rule, 'ORIGINAL RULE: no surface links a deposit as available');
  assert.equal(run2.superseded.superseded_method, 'ORIGINAL METHOD: doi.org');
  assert.equal(run2.superseded.superseded_as_of, '2026-09-29T16:46Z',
    'the preserved date moved - it must stay the date the original was published');
});

test('a control that does not answer 200 REFUSES the write', async () => {
  const doc = {as_of: '2026-09-29T16:46Z', notice: 'x', method: 'y', dois: [{doi: '10.5281/zenodo.21991104', state: 'UNAVAILABLE', http_status_at_check: 410}]};
  const fetcher = async () => ({status: 403, url: 'https://zenodo.org/api/records/3234648', arrayBuffer: async () => new ArrayBuffer(0)});
  await assert.rejects(() => refreshStatus(doc, {fetcher}), /ZENODO_CONTROL_NOT_READABLE/);
});

test('a run where every record is gone still says so, with the count', async () => {
  const doc = {as_of: '2026-09-29T16:46Z', notice: 'x', method: 'y', dois: [
    {doi: '10.5281/zenodo.11111111', state: 'UNAVAILABLE', http_status_at_check: 410},
    {doi: '10.5281/zenodo.22222222', state: 'UNAVAILABLE', http_status_at_check: 410},
  ]};
  const fetcher = async (url) => (url.includes('3234648')
    ? {status: 200, url, arrayBuffer: async () => new ArrayBuffer(4)}
    : {status: 410, url, arrayBuffer: async () => new ArrayBuffer(64)});
  const out = await refreshStatus(doc, {fetcher, observed_at: '2026-10-28T13:00:00Z'});
  assert.equal(out.observation.answered_410, 2);
  assert.equal(out.observation.answered_200, 0);
  assert.match(out.notice, /2 of 2 CSOAI deposits answered HTTP 410/);
  // The methodology deposit is among the gone, so the DOI on the board stays UNAVAILABLE.
  assert.match(out.notice, /stays UNAVAILABLE/);
});

test('a live record is reported as live and the prior value is kept beside it', async () => {
  const doc = {as_of: '2026-09-29T16:46Z', notice: 'x', method: 'y', dois: [
    {doi: '10.5281/zenodo.22293340', state: 'RESOLVED_AT_CHECK', http_status_at_check: 200},
    {doi: '10.5281/zenodo.21991104', state: 'UNAVAILABLE', http_status_at_check: 410},
  ]};
  const fetcher = async (url) => (url.includes('3234648')
    ? {status: 200, url, arrayBuffer: async () => new ArrayBuffer(4)}
    : (url.includes('22293340')
      ? {status: 200, url, arrayBuffer: async () => new ArrayBuffer(8138)}
      : {status: 410, url, arrayBuffer: async () => new ArrayBuffer(64)}));
  const out = await refreshStatus(doc, {fetcher, observed_at: '2026-10-28T13:00:00Z'});
  assert.equal(out.observation.answered_200, 1);
  assert.equal(out.observation.answered_410, 1);
  const live = out.dois.find(d => d.doi.endsWith('22293340'));
  assert.equal(live.http_status_at_check, 200);
  assert.equal(live.http_status_at_prior_check, 200);
  assert.equal(live.bytes_at_check, 8138);
  const gone = out.dois.find(d => d.doi.endsWith('21991104'));
  assert.equal(gone.state, 'UNAVAILABLE');
  assert.equal(gone.http_status_at_check, 410);
  assert.equal(gone.http_status_at_prior_check, 410);
});

test('a status that is neither 200 nor 410 is UNCHECKABLE, never a zero', async () => {
  const doc = {as_of: '2026-09-29T16:46Z', notice: 'x', method: 'y', dois: [{doi: '10.5281/zenodo.33333333', state: 'UNAVAILABLE', http_status_at_check: 410}]};
  const fetcher = async (url) => (url.includes('3234648')
    ? {status: 200, url, arrayBuffer: async () => new ArrayBuffer(4)}
    : {status: 503, url, arrayBuffer: async () => new ArrayBuffer(0)});
  const out = await refreshStatus(doc, {fetcher, observed_at: '2026-10-28T13:00:00Z'});
  assert.equal(out.dois[0].state, 'UNCHECKABLE');
  assert.equal(out.observation.answered_other, 1);
  assert.equal(out.observation.answered_410, 0);
});
