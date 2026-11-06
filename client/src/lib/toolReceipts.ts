/**
 * toolReceipts — the workspace's local log of tool runs (2026-11-02, lane csoai-frontend-consol,
 * plan item P5).
 *
 * WHAT IT IS. After ToolRunner executes a tool, one small receipt is appended here: which tool, on
 * which door, the SHA-256 of the arguments you sent (never the arguments themselves — the args can
 * carry anything you typed, and a local log has no business keeping a copy), the outcome word the
 * result carried, and when. You can export the list as a JSON file and clear it.
 *
 * WHAT IT IS NOT. A local localStorage list is NOT signed evidence. A signed record is one whose
 * bytes hash into a published Merkle root you can verify with the verify tools; nothing in this log
 * is that. It is your own note-taking in this origin's browser storage.
 *
 * MECHANICS. Ring buffer of 200 (oldest dropped), one localStorage key, storage failures reported
 * separately — a storage quota error must never turn into a failed tool run. Args are hashed with WebCrypto
 * SHA-256 where available and with a small FNV-1a fallback where not (the receipt is a pointer for
 * your own recall, not a security boundary; either digest serves that).
 */

export const RECEIPTS_KEY = "coai.tool-receipts/1";
export const RECEIPTS_CAP = 200;
/** Compatible with the refresh event proposed in PR #3892. */
export const RECEIPTS_EVENT = "coai:receipts-changed";
export const TOOL_RECEIPTS_STORAGE_KEYS = [RECEIPTS_KEY] as const;

export type ToolReceipt = {
  /** ISO-8601 timestamp of the moment the result came back. */
  at: string;
  /** The MCP tool name as called. */
  tool: string;
  /** The door the runner used. */
  door: "/mcp" | "/mcp/free";
  /** sha256 (or fnv1a-prefixed fallback) over the canonical argument string. Args are NOT stored. */
  args_hash: string;
  /** The outcome word the result carried (e.g. VALID, DELIVERED, PAYMENT_REQUIRED), or OK / ERROR. */
  outcome: string;
  not_signed_evidence: true;
};

export function stableArgsString(args: Record<string, unknown>): string {
  const render = (v: unknown): string => {
    if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
    if (Array.isArray(v)) return `[${v.map(render).join(",")}]`;
    const pairs = Object.keys(v as Record<string, unknown>)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${render((v as Record<string, unknown>)[k])}`,
      );
    return `{${pairs.join(",")}}`;
  };
  return render(args);
}

/** FNV-1a, for environments without WebCrypto. Marked so nobody mistakes it for sha256. */
export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv1a:${h.toString(16).padStart(8, "0")}`;
}

export async function hashArgs(args: Record<string, unknown>): Promise<string> {
  const canonical = stableArgsString(args);
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(canonical),
      );
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // fall through to the local hash
  }
  return fnv1aHex(canonical);
}

const RECEIPT_FIELDS = new Set([
  "at",
  "tool",
  "door",
  "args_hash",
  "outcome",
  "not_signed_evidence",
]);
const MAX_STORE_CHARS = 512_000;
const ARG_HASH = /^(?:[a-f0-9]{64}|fnv1a:[a-f0-9]{8})$/i;
const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const printable = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(value);

function validInstant(value: string): boolean {
  if (!ISO_INSTANT.test(value) || !Number.isFinite(Date.parse(value)))
    return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1] &&
    Number(value.slice(11, 13)) <= 23 &&
    Number(value.slice(14, 16)) <= 59 &&
    Number(value.slice(17, 19)) <= 59
  );
}

/** Only the declared metadata fields may enter the log or an export. */
export function parseToolReceipt(value: unknown): ToolReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    Object.keys(row).some((key) => !RECEIPT_FIELDS.has(key)) ||
    !printable(row.at, 64) ||
    !validInstant(row.at) ||
    !printable(row.tool, 200) ||
    (row.door !== "/mcp" && row.door !== "/mcp/free") ||
    typeof row.args_hash !== "string" ||
    !ARG_HASH.test(row.args_hash) ||
    !printable(row.outcome, 100) ||
    row.not_signed_evidence !== true
  )
    return null;
  return {
    at: row.at,
    tool: row.tool,
    door: row.door,
    args_hash: row.args_hash,
    outcome: row.outcome,
    not_signed_evidence: true,
  };
}

export type ToolReceiptsReadStatus = {
  state: "ok" | "unavailable" | "unreadable";
  /** Valid metadata only, newest first. A non-ok read may contain a readable subset. */
  receipts: ToolReceipt[];
  reason: string | null;
};

let mutationNotice: { reason: string; expectedRaw?: string | null } | null =
  null;

function notifyReceipts(): void {
  try {
    window.dispatchEvent(new Event(RECEIPTS_EVENT));
  } catch {
    /* Storage never changes a tool outcome. */
  }
}

function parseStore(raw: string | null): ToolReceiptsReadStatus {
  if (raw === null) return { state: "ok", receipts: [], reason: null };
  if (raw.length > MAX_STORE_CHARS)
    return {
      state: "unreadable",
      receipts: [],
      reason:
        "The local run log is too large to read safely. It has not been replaced.",
    };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not a list");
    const valid = parsed
      .map(parseToolReceipt)
      .filter((row): row is ToolReceipt => row !== null);
    return valid.length === parsed.length
      ? { state: "ok", receipts: valid.reverse(), reason: null }
      : {
          state: "unreadable",
          receipts: valid.reverse(),
          reason:
            "Some local run entries could not be read. Only valid metadata is shown; the stored log has not been replaced.",
        };
  } catch {
    return {
      state: "unreadable",
      receipts: [],
      reason:
        "The local run log could not be read. It has not been replaced or treated as empty.",
    };
  }
}

/** A failed read is distinct from a confirmed empty log. */
export function readToolReceiptsStatus(): ToolReceiptsReadStatus {
  try {
    const raw = window.localStorage.getItem(RECEIPTS_KEY);
    if (
      mutationNotice &&
      "expectedRaw" in mutationNotice &&
      raw === mutationNotice.expectedRaw
    )
      mutationNotice = null;
    const read = parseStore(raw);
    return read.state === "ok" && mutationNotice
      ? { ...read, state: "unavailable", reason: mutationNotice.reason }
      : read;
  } catch {
    return {
      state: "unavailable",
      receipts: [],
      reason:
        "Browser storage is unavailable. The local run log could not be read or confirmed empty.",
    };
  }
}

/** Same-tab changes and other tabs' writes use one subscription contract. */
export function subscribeToolReceipts(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const storage = (event: StorageEvent) => {
    if (event.key === RECEIPTS_KEY || event.key === null) listener();
  };
  window.addEventListener(RECEIPTS_EVENT, listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(RECEIPTS_EVENT, listener);
    window.removeEventListener("storage", storage);
  };
}

/** Newest first, for display. */
export function listToolReceipts(): ToolReceipt[] {
  return readToolReceiptsStatus().receipts;
}

export function recordToolReceipt(input: {
  tool: string;
  argsHash: string;
  outcome: string;
  door?: "/mcp" | "/mcp/free";
  at?: string;
}): ToolReceipt | null {
  const receipt = parseToolReceipt({
    at: input.at ?? new Date().toISOString(),
    tool: input.tool,
    door: input.door ?? "/mcp",
    args_hash: input.argsHash,
    outcome: input.outcome || "UNKNOWN",
    not_signed_evidence: true,
  });
  if (!receipt) return null;
  let expectedRaw: string | undefined;
  try {
    const store = window.localStorage;
    const existing = parseStore(store.getItem(RECEIPTS_KEY));
    // Never erase an unreadable entry just to make room for a new one.
    if (existing.state !== "ok") {
      // The read already explains the unreadable store. Do not leave a stale write warning behind
      // after another tab repairs or explicitly clears that store.
      mutationNotice = null;
      notifyReceipts();
      return null;
    }
    const list = [...existing.receipts].reverse();
    expectedRaw = JSON.stringify([...list, receipt].slice(-RECEIPTS_CAP));
    store.setItem(RECEIPTS_KEY, expectedRaw);
    if (store.getItem(RECEIPTS_KEY) !== expectedRaw)
      throw new Error("Save not confirmed");
    mutationNotice = null;
    notifyReceipts();
    return receipt;
  } catch {
    mutationNotice = {
      reason:
        "The latest local receipt could not be confirmed saved. The tool's own result is unchanged.",
      ...(expectedRaw === undefined ? {} : { expectedRaw }),
    };
    notifyReceipts();
    return null;
  }
}

export function clearToolReceiptsStatus(): { cleared: boolean } {
  try {
    window.localStorage.removeItem(RECEIPTS_KEY);
    if (window.localStorage.getItem(RECEIPTS_KEY) !== null)
      throw new Error("Clear not confirmed");
    mutationNotice = null;
    notifyReceipts();
    return { cleared: true };
  } catch {
    mutationNotice = {
      reason:
        "Clearing the local run log could not be confirmed. No successful clear is claimed.",
      expectedRaw: null,
    };
    notifyReceipts();
    return { cleared: false };
  }
}

export function clearToolReceipts(): void {
  clearToolReceiptsStatus();
}

/** A JSON download blob; the caller anchors it as a link click. Never throws. */
export function exportToolReceipts(
  snapshot?: readonly ToolReceipt[],
): string | null {
  try {
    const read = snapshot === undefined ? readToolReceiptsStatus() : null;
    if (read && read.state !== "ok") return null;
    const rows =
      snapshot === undefined
        ? [...read!.receipts].reverse()
        : snapshot.map(parseToolReceipt);
    if (rows.some((row) => row === null)) return null;
    return JSON.stringify(
      {
        schema: "csoai.tool-receipts/1",
        exported_at: new Date().toISOString(),
        note: "A local browser log of tool runs. Not signed evidence; verify signed records with the verify tools.",
        receipts: rows,
      },
      null,
      2,
    );
  } catch {
    return null;
  }
}
