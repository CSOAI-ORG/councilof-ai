/**
 * Zero-priced x402 discovery door for Ondo Finance / ONDO. GET and POST are aliases of the same
 * bounded discovery contract; discovery is not a measurement, rating, endorsement or certificate.
 */
import { handleSubject } from "./_subject";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("ondo", context as never);
export const onRequestPost = onRequestGet;
