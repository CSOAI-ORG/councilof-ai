/**
 * Zero-priced x402 discovery door for Ondo Finance OUSG on XRPL. GET and POST are aliases of the
 * same bounded discovery contract; discovery is not a measurement, rating, endorsement or certificate.
 */
import { handleSubject } from "./_subject";
import { headFromGet } from "../_head";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("ondo-ousg", context as never);
export const onRequestPost = onRequestGet;
// HEAD answers what GET answers, with no body, and never reaches payment. Without it Pages answers
// HEAD with the static 404 (functions/api/_head.test.ts reads the door list from the manifest).
export const onRequestHead = headFromGet(onRequestGet);
