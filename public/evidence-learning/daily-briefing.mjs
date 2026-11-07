// Shared, metadata-only projection of the existing public daily-signal index.
// No report body, case, legal judgement, model training or execution authority.
export const DAILY_INDEX_PATH = '/reports/daily-signal/index.json';
export const BRIEFING_SCHEMA = 'csoai.daily-learning-briefing/0.1';
const HEX = /^[a-f0-9]{64}$/;
const dayStamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const count = value => Number.isSafeInteger(value) && value >= 0;
const fixed = {schema: BRIEFING_SCHEMA, source_path: DAILY_INDEX_PATH,
  source_integrity: 'INDEX_DECLARATION_ONLY', grants_authority: false, model_training: false,
  scope: 'Retained report metadata for free educational inspection; not a new measurement or legal assessment.'};

export function dailyBriefing(index, now = new Date()) {
  const instant = now instanceof Date ? now : new Date(now);
  const asOfDay = Number.isFinite(instant.getTime()) ? instant.toISOString().slice(0, 10) : null;
  const unavailable = reason => ({...fixed, state: 'UNAVAILABLE', reason, report_day: null,
    report_id_declared: null, report_paths: null, counts: null, signed_declared: null,
    freshness: {state: 'UNCHECKABLE', as_of_day: asOfDay, age_days: null, max_age_days: 2}});
  if (!asOfDay) return unavailable('INVALID_OBSERVATION_TIME');
  if (index?.schema !== 'csoai.daily-signal-index/0.1' || !Array.isArray(index.reports) ||
      !count(index.report_count) || index.report_count !== index.reports.length ||
      !dayStamp(index.latest_report_day) || !HEX.test(index.latest_report_id || ''))
    return unavailable('INDEX_UNAVAILABLE_OR_INVALID');
  const latest = index.reports.filter(row => row?.report_day === index.latest_report_day);
  if (latest.length !== 1) return unavailable('LATEST_REPORT_NOT_UNIQUE');
  const row = latest[0], day = index.latest_report_day;
  if (row.report_id !== index.latest_report_id || row.json_path !== `/reports/daily-signal/${day}.json` ||
      row.markdown_path !== `/reports/daily-signal/${day}.md` ||
      index.reports.some(item => !dayStamp(item?.report_day) || item.report_day > day))
    return unavailable('REPORT_IDENTITY_DISAGREES');
  const counts = row.counts;
  if (!counts || !['events_in_horizon', 'mapped_events', 'unmapped_events'].every(key => count(counts[key])) ||
      counts.mapped_events + counts.unmapped_events !== counts.events_in_horizon)
    return unavailable('REPORT_COUNTS_DISAGREE');
  const age = Math.round((Date.parse(asOfDay + 'T00:00:00Z') - Date.parse(day + 'T00:00:00Z')) / 86400000);
  if (age < 0) return unavailable('FUTURE_REPORT_DAY');
  return {...fixed, state: 'AVAILABLE', reason: null, report_day: day,
    report_id_declared: row.report_id, report_paths: {json: row.json_path, markdown: row.markdown_path},
    counts: Object.fromEntries(['events_in_horizon', 'mapped_events', 'unmapped_events'].map(key => [key, counts[key]])),
    signed_declared: typeof index.signed === 'boolean' ? index.signed : null,
    freshness: {state: age > 2 ? 'STALE' : 'RECENT', as_of_day: asOfDay, age_days: age, max_age_days: 2}};
}

// Validate the already-projected response before exposing links or learning text.
// Reprojection ensures the view uses the same path/count/freshness rules as producers.
export function briefingView(value, now = new Date()) {
  if (value?.schema !== BRIEFING_SCHEMA || value.state !== 'AVAILABLE') return null;
  const result = dailyBriefing({schema: 'csoai.daily-signal-index/0.1', report_count: 1,
    latest_report_day: value.report_day, latest_report_id: value.report_id_declared,
    signed: value.signed_declared,
    reports: [{report_day: value.report_day, report_id: value.report_id_declared,
      json_path: value.report_paths?.json, markdown_path: value.report_paths?.markdown, counts: value.counts}]},
    now);
  return result.state === 'AVAILABLE' ? result : null;
}

export function briefingExercise(value) {
  const view = briefingView(value);
  if (!view) return null;
  return {question: `The retained ${view.report_day} report lists ${view.counts.unmapped_events} unmapped events. What should a reviewer do?`,
    options: ['Treat the report date as proof the events were newly measured and legally mapped.',
      'Inspect the exact sources and applicability, preserve unmapped states, and request qualified review.',
      'Treat reading the report as permission for an agent to act.'],
    answer: 1, explanation: 'A dated report and its counts do not establish a reviewed mapping, a new measurement or permission to act. This is educational practice only.'};
}
