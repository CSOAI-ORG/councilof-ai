/** GET /feeds/corrections.atom — Atom of the same derived entries. One source, two syntaxes. */
import { atomBody } from "./corrections.xml";
import { FEED_HEADERS } from "./_xml";
export const onRequestGet: PagesFunction = async () =>
  new Response(atomBody(), { headers: { ...FEED_HEADERS, "content-type": "application/atom+xml; charset=utf-8" } });
