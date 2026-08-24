/**
 * East-West Value Ledger — local receipts until the edge store is bound.
 *
 * Six event types. No traction claim without a stranger-checkable row.
 * Published server rows start at 0. Browser-minted receipts are local and labelled so.
 */

import { hashBody } from "@/lib/eastWestCrypto";
import { LEDGER_EVENT_TYPES } from "@/data/eastWest";

const STORE = "csoai.east-west-ledger";

export type LedgerEventType = (typeof LEDGER_EVENT_TYPES)[number];

export type LedgerRow = {
  kind: "csoai.east-west-ledger-row/0.1";
  id: string;
  type: LedgerEventType;
  at: string;
  partyClass: "stranger" | "regulator" | "multinational" | "insurer" | "law-firm" | "measured-subject";
  subject: string;
  artifactHash?: string;
  outcome?: string;
  contentHash: string;
  signature: { status: "UNSIGNED"; note: string };
  storage: "local-browser";
};

function load(): LedgerRow[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(rows: LedgerRow[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORE, JSON.stringify(rows.slice(0, 50)));
}

export function publishedLedger() {
  return {
    schema: "csoai.east-west-ledger/0.1",
    doctrine: "No traction claim without a signed stranger-checkable row. Empty is honesty.",
    eventTypes: LEDGER_EVENT_TYPES,
    publishedRows: [] as LedgerRow[],
    publishedCount: 0,
    note: "Published count is 0. Browser-minted receipts stay on-device until the edge ledger is bound.",
  };
}

export async function mintLedgerRow(input: {
  type: LedgerEventType;
  partyClass: LedgerRow["partyClass"];
  subject: string;
  artifactHash?: string;
  outcome?: string;
}): Promise<LedgerRow> {
  const draft = {
    kind: "csoai.east-west-ledger-row/0.1" as const,
    id: `ewl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    at: new Date().toISOString(),
    partyClass: input.partyClass,
    subject: input.subject,
    artifactHash: input.artifactHash,
    outcome: input.outcome,
    storage: "local-browser" as const,
  };
  const contentHash = await hashBody(draft);
  const row: LedgerRow = {
    ...draft,
    contentHash,
    signature: {
      status: "UNSIGNED",
      note: "Local receipt. Not a published Value Ledger row. Not traction.",
    },
  };
  save([row, ...load()]);
  return row;
}

export function loadLocalLedger(): LedgerRow[] {
  return load();
}
