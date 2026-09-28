/**
 * Signed measurement records that have their own page (public/measurements/<kind>/<id>/record.json,
 * board-signed record.signed.json and OpenTimestamps record.json.ots beside it).
 *
 * Every field is DERIVED: the dates, subject and state from the committed record bytes
 * (client/src/data/measurements/<kind>/<id>.json, held byte-equal to the published record.json by
 * scripts/measurements/measurement-pages.node-test.mjs) and the title and description from the
 * page's own head entry in client/src/data/seo-head.json. RECORDS only says which records exist;
 * measurementRecords.test.ts fails when a published record.json on disk is missing from it, so a
 * new record cannot be left out of the feed silently.
 */
import SEO from "../../../client/src/data/seo-head.json";
import MEDICARE from "../../../client/src/data/measurements/disclosure-lag/2026-09-medicare-agent.json";
import GEMINI from "../../../client/src/data/measurements/disclosure-lag/2026-09-gemini-evaluation.json";

const SITE = "https://councilof.ai";

type RecordFile = { as_of: string; capsules: { subject_id: string; measurement_state: string }[] };
type Head = { title: string; description: string };

export const RECORDS: { route: string; rec: RecordFile }[] = [
  { route: "/measurements/disclosure-lag/2026-09-medicare-agent", rec: MEDICARE as unknown as RecordFile },
  { route: "/measurements/disclosure-lag/2026-09-gemini-evaluation", rec: GEMINI as unknown as RecordFile },
];

export interface MeasurementRecordEntry {
  route: string; url: string; record_url: string; title: string; description: string; as_of: string; subject_id: string; state: string;
}

export function measurementRecordEntries(): MeasurementRecordEntry[] {
  const routes = (SEO as unknown as { routes: Record<string, Head> }).routes;
  return RECORDS.flatMap(({ route, rec }) => {
    const head = routes[route];
    const c = rec.capsules?.[0];
    if (!head || !c || !rec.as_of) return []; // no head or no record: not listed, never invented
    return [{
      route,
      url: `${SITE}${route}/`,
      record_url: `${SITE}${route}/record.json`,
      title: head.title.replace(/ \| Council of AI$/, ""),
      description: head.description,
      as_of: rec.as_of,
      subject_id: c.subject_id,
      state: c.measurement_state,
    }];
  });
}
