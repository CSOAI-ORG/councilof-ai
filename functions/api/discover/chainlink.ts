/**
 * Zero-priced x402 discovery door for Chainlink / LINK. GET and POST are aliases of the same
 * bounded discovery contract; discovery is not a measurement, rating, endorsement or certificate.
 */
import { headFromGet } from "../_head";
import { handleSubject } from "./_subject";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("chainlink", context as never);
export const onRequestPost = onRequestGet;
export const onRequestHead = headFromGet(onRequestGet);
