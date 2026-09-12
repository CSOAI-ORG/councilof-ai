/**
 * GET /corrections.xml — conventional alias of the derived corrections feed.
 *
 * The canonical implementation remains /feeds/corrections.xml. Re-exporting its handler keeps
 * both paths byte-identical and avoids a second feed generator or a second corrections ledger.
 */
export { onRequestGet } from "./feeds/corrections.xml";
