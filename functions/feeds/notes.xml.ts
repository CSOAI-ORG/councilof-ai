/**
 * GET /feeds/notes.xml — evidence notes, DERIVED from client/src/data/evidence-notes.json.
 *
 * The same data file renders /notes/ and each /notes/<id>/ page, so an item here cannot say
 * anything its page does not. Each item links the note's canonical page and carries the
 * artifact URLs the note names. The date is the note's own date, never the time of the request.
 */
import data from "../../client/src/data/evidence-notes.json";
import { rss, FEED_HEADERS, type Entry } from "./_xml";
import { headFromGet } from "../api/_head";

interface Note { id: string; date: string; title: string; summary: string; body: string; artifacts: { label: string; url: string }[] }

export function entries(): Entry[] {
  const notes = (data as unknown as { notes?: Note[] }).notes || [];
  return notes
    .map((note, i) => ({ note, i }))
    .sort((a, b) => b.note.date.localeCompare(a.note.date) || a.i - b.i)
    .map(({ note }) => {
      const url = `https://councilof.ai/notes/${note.id}/`;
      return {
        id: url,
        title: note.title,
        link: url,
        iso: note.date,
        body: [
          note.summary,
          note.body,
          "Artifacts:\n" + note.artifacts.map((a) => `${a.label}: ${a.url}`).join("\n"),
          "How to verify: https://councilof.ai/gspc-verify/ — measurement, not certification.",
        ].join("\n\n"),
      };
    });
}

// Typed without PagesFunction: this module is imported by tests that run under the root
// tsconfig, where the Cloudflare Workers types are not loaded (TS2304 raised the ratchet 204 -> 205).
export const onRequestGet = async (): Promise<Response> =>
  new Response(rss(
    "Council of AI — evidence notes",
    "https://councilof.ai/feeds/notes.xml",
    "Dated evidence notes, one citable page per note, each naming the artifacts behind it. Derived from client/src/data/evidence-notes.json; nothing typed.",
    entries(),
  ), { headers: FEED_HEADERS });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
