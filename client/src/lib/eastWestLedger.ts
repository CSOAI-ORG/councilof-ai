import { hashBody } from "@/lib/eastWestCrypto";
import { LEDGER_EVENT_TYPES } from "@/data/eastWest";
export function publishedLedger() { return { publishedCount: 0 }; }
export function loadLocalLedger() { return []; }
