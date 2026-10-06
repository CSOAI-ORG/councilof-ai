/** GET /feeds/corrections.atom — Atom of the same derived entries. One source, two syntaxes. */
import { atomBody } from "./corrections.xml";
import { FEED_HEADERS } from "./_xml";
import { headFromGet } from "../api/_head";
export const onRequestGet: PagesFunction = async () =>
  new Response(atomBody(), { headers: { ...FEED_HEADERS, "content-type": "application/atom+xml; charset=utf-8" } });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
