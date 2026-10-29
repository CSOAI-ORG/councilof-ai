#!/usr/bin/env node
/**
 * Re-probe every CSOAI Zenodo deposit and refresh public/interop/zenodo-status.json.
 *
 * WHY THIS EXISTS (28 October 2026). The published status said, in one line:
 *
 *   "Zenodo record unavailable since 29 Sep 2026: EVERY CSOAI Zenodo record returns
 *    HTTP 410 (account blocked by Zenodo). Status UNCHECKABLE."
 *
 * "Every" was false, and it was false in the same file: two of the thirty-nine DOI
 * entries carried state RESOLVED_AT_CHECK. A reader of that notice would conclude the
 * Council's deposits are all gone, when two names for one record were answering HTTP
 * 200 with their bytes live. That is the register's A12: the published DOI availability
 * status does not match what Zenodo returns today.
 *
 * The per-DOI states in that file were RIGHT. Only the blanket sentence above them was
 * wrong. So this script does not decide anything: it re-probes, and it writes down what
 * it saw, with the date, next to the value it saw before.
 *
 * WHAT IT DOES NOT DO. It never asserts that a record is AVAILABLE, only that it
 * answered 200 at a stated time. It never changes a DOI, never invents one, and never
 * edits a signed file - the signed boards and the signed value ledger embed a DOI inside
 * signed bytes, so they are listed as not edited and left alone.
 *
 * THE METHOD, AND ITS LIMITS.
 *   - The readable path is https://zenodo.org/api/records/<NUMERIC_ID>. The numeric id
 *     is the last segment of the DOI MINUS the "zenodo." prefix. Probing
 *     /api/records/zenodo.21991104 returns 404 for every record, including records that
 *     are alive: that is a malformed request, not a missing deposit.
 *   - doi.org cannot be used from here at all: it answers HTTP 403 for every DOI,
 *     INCLUDING a control that is definitely live. That is a publisher-side client
 *     rejection, not record absence, and it is why the old method's "UNCHECKABLE" was
 *     the wrong word for the wrong reason.
 *   - A CONTROL is probed every run and MUST answer 200. If the control does not answer
 *     200, the run cannot distinguish "the records are gone" from "we cannot read
 *     Zenodo", and the script refuses to write. A probe with no control is a probe that
 *     cannot fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATUS_PATH = path.join(REPO, 'public', 'interop', 'zenodo-status.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; csoai-zenodo-status-probe/0.1; +https://councilof.ai)';
const API = 'https://zenodo.org/api/records/';

/** A Zenodo record that is alive and is NOT ours. If this does not answer 200, the probe cannot read Zenodo. */
export const CONTROL_DOI = '10.5281/zenodo.3234648';

/** The numeric record id: the DOI's last segment minus the "zenodo." prefix. */
export function numericId(doi) {
  const last = String(doi ?? '').split('/').pop() ?? '';
  return last.replace(/^zenodo\./, '');
}

/** Anonymous GET, following redirects. Returns the final-hop status. */
export async function probeRecord(id, {fetcher = fetch, userAgent = USER_AGENT} = {}) {
  const response = await fetcher(API + id, {
    method: 'GET',
    headers: {'user-agent': userAgent, accept: 'application/json, */*'},
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  let bytes = 0;
  try { bytes = (await response.arrayBuffer()).byteLength; } catch { bytes = 0; }
  return {status: response.status, final_url: response.url, bytes};
}

/** The corrected notice. It states what was seen, on what date, and says nothing more. */
export function composeNotice(observation) {
  const {gone, live, total, observed_at, control_doi, control_status} = observation;
  const liveNames = live.length ? live.map(d => d.doi).join(', ') : 'none';
  return (
    `Zenodo: ${gone} of ${total} CSOAI deposits answered HTTP 410 (the account was blocked by Zenodo on 29 Sep 2026) ` +
    `when re-probed on ${observed_at}. ${live.length ? `${live.length} answered HTTP 200 and their bytes are live: ${liveNames}. ` : ''}` +
    `A control record that is not ours (${control_doi}) answered HTTP ${control_status}, so this is a reading of the ` +
    `deposits and not a reading of our own access. The methodology deposit (10.5281/zenodo.21991104) is among the ` +
    `gone, so the DOI on the board stays UNAVAILABLE. This is a point-in-time observation, not a standing all-clear.`
  );
}

/**
 * The notice this replaces, kept verbatim so the change is visible.
 *
 * IDEMPOTENCE. A second run of this probe must not overwrite the ORIGINAL text with the
 * text the first run wrote. The first run replaces `notice`/`event`/`rule`/`method` and
 * stashes the old ones under `superseded`; a second run that reads the *current* file
 * would stash the first run's corrected text and the original 29 September wording would be
 * lost for good - silently, on a routine re-probe. So when the file already carries a
 * `superseded` block, the DEEPEST preserved values win: the block always holds the text
 * that was published before any supersession, however many times the probe has run.
 */
export function supersededNotice(previous) {
  const prior = previous?.superseded ?? null;
  const pick = (field, key) => (prior && prior[key] != null ? prior[key] : (previous?.[field] ?? null));
  return {
    superseded_as_of: prior?.superseded_as_of ?? previous?.as_of ?? null,
    superseded_notice: pick('notice', 'superseded_notice'),
    superseded_method: pick('method', 'superseded_method'),
    superseded_event: pick('event', 'superseded_event'),
    superseded_rule: pick('rule', 'superseded_rule'),
    note: 'The notice above was published on the date in superseded_as_of and is kept verbatim. It said EVERY record returned HTTP 410; two names for one record were answering 200 at the time and still do. The event text above said the same thing about the hour after the block. The rule above said no surface we publish links a deposit as available, which the file\'s own rows contradicted. The per-DOI states in that same file were right - only the blanket sentences were wrong. No measurement, signature or ledger entry was changed by those sentences; only this notice, this event text and this rule were.',
  };
}

/**
 * The rule, corrected. The old rule said no surface we publish links one as available -
 * which is now false in this file's own terms, because one deposit answers 200 and is
 * reported as RESOLVED_AT_CHECK. What is still true is that a deposit answering 200 at
 * one check is not a durable availability claim, and that the bytes are only called the
 * same when the digest matches.
 */
export function composeRule(observation) {
  return (
    `The DOIs are kept: they are the permanent names and may resolve again. A deposit that answered 200 at the ` +
    `check of ${observation.observed_at} is reported as RESOLVED_AT_CHECK with the date it was seen, and its other ` +
    `live copy is named beside it. That is a point-in-time reading, not a durable availability claim, and no surface ` +
    `we publish links a deposit as durable. 'Same bytes' is claimed only where the served file's sha256 equals the ` +
    `digest the deposit itself recorded.`
  );
}

/**
 * The account of the block, corrected. The 29 September text said every record on the
 * account began answering 410 within the hour. The file's own per-DOI states said
 * otherwise on the same day: two names for one record carried RESOLVED_AT_CHECK / 200.
 */
export function composeEvent(observation) {
  const {gone, live, total, observed_at} = observation;
  const liveNames = live.length ? live.map(d => d.doi).join(', ') : 'none';
  return (
    `At 15:47Z on 29 Sep 2026 Zenodo blocked the account that held CSOAI's deposits as spam, after one of our own ` +
    `automated lanes bulk-published 54 datasets there at roughly 15-second intervals. Within the hour ${gone} of the ` +
    `${total} deposits we name were answering HTTP 410 ('User was blocked'), including records deposited weeks earlier. ` +
    `One record did not: ${liveNames} answered 200 then and answers 200 now. The first notice said EVERY record, and ` +
    `that was already wrong on the day it was written - the same file's per-DOI states said so. No appeal to Zenodo is ` +
    `on record. We do not contact Zenodo from automation. Re-probed ${observed_at}.`
  );
}

/**
 * Re-probe every DOI in the status file, plus the control, and return the refreshed
 * document. Refuses to write when the control does not answer 200.
 */
export async function refreshStatus(doc, {fetcher = fetch, observed_at = null, sleep = async () => {}} = {}) {
  observed_at = observed_at ?? new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const control = await probeRecord(numericId(CONTROL_DOI), {fetcher});
  if (control.status !== 200) {
    const err = new Error('ZENODO_CONTROL_NOT_READABLE');
    err.detail = {control_doi: CONTROL_DOI, control_status: control.status, control_final_url: control.final_url};
    throw err;
  }
  const dois = [];
  for (const entry of doc.dois ?? []) {
    const id = numericId(entry.doi);
    const result = await probeRecord(id, {fetcher});
    dois.push({
      ...entry,
      http_status_at_check: result.status,
      observed_at,
      final_url: result.final_url,
      bytes_at_check: result.bytes,
      http_status_at_prior_check: entry.http_status_at_check ?? null,
      prior_state: entry.state ?? null,
      state: result.status === 200 ? 'RESOLVED_AT_CHECK' : (result.status === 410 ? 'UNAVAILABLE' : 'UNCHECKABLE'),
    });
    await sleep();
  }
  const gone = dois.filter(d => d.http_status_at_check === 410).length;
  const live = dois.filter(d => d.http_status_at_check === 200);
  const observation = {gone, live, total: dois.length, observed_at, control_doi: CONTROL_DOI, control_status: control.status};
  const notice = composeNotice(observation);
  return {
    ...doc,
    as_of: observed_at,
    notice,
    event: composeEvent(observation),
    rule: composeRule(observation),
    superseded: supersededNotice(doc),
    method: 'For each DOI: anonymous GET https://zenodo.org/api/records/<numeric id>, following redirects; http_status_at_check is the final hop. The numeric id is the DOI last segment minus the "zenodo." prefix - /api/records/zenodo.21991104 is a malformed request and answers 404 even for a live record. doi.org is NOT used: it answers HTTP 403 for every DOI, including a control that is alive, which is a publisher-side client rejection and not record absence. A control record that is not ours is probed every run and MUST answer 200; if it does not, this file is not written.',
    control: {
      doi: CONTROL_DOI,
      http_status_at_check: control.status,
      final_url: control.final_url,
      why: 'A Zenodo record that is alive and is not ours. If it does not answer 200, the probe cannot tell "the deposits are gone" from "we cannot read Zenodo", and nothing is written.',
    },
    observation: {
      observed_at,
      total_dois: dois.length,
      answered_410: gone,
      answered_200: live.length,
      answered_other: dois.length - gone - live.length,
      live_records: live.map(d => ({doi: d.doi, final_url: d.final_url, bytes: d.bytes_at_check})),
    },
    dois,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
  const doc = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
  const refreshed = await refreshStatus(doc, {sleep: () => new Promise(r => setTimeout(r, 350))});
  const text = JSON.stringify(refreshed, null, 2) + '\n';
  if (out) fs.writeFileSync(out, text);
  else fs.writeFileSync(STATUS_PATH, text);
  console.log(JSON.stringify(refreshed.observation, null, 2));
  console.log(`written to ${out ?? STATUS_PATH}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(JSON.stringify({
      state: 'UNCHECKABLE',
      reason: error.message === 'ZENODO_CONTROL_NOT_READABLE' ? 'the control record did not answer 200, so this probe cannot read Zenodo and nothing was written' : 'UNEXPECTED_PROBE_FAILURE',
      detail: error.detail ?? null,
      written: false,
    }));
    process.exitCode = 2;
  });
}
