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
 * is that. It is your own note-taking, kept in your browser, readable by nothing but this page.
 *
 * MECHANICS. Ring buffer of 200 (oldest dropped), one localStorage key, every failure swallowed —
 * a storage quota error must never turn into a failed tool run. Args are hashed with WebCrypto
 * SHA-256 where available and with a small FNV-1a fallback where not (the receipt is a pointer for
 * your own recall, not a security boundary; either digest serves that).
 */

export const RECEIPTS_KEY = "coai.tool-receipts/1";
export const RECEIPTS_CAP = 200;

const RECEIPTS_UPDATED_EVENT = "csoai:tool-receipts-updated";

function notifyToolReceipts(): void {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(RECEIPTS_UPDATED_EVENT));
  } catch {
    // Observing a local log must never change the tool's outcome.
  }
}

/** Observe this tab's writes and other tabs' changes without polling or a server. */
export function subscribeToolReceipts(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== RECEIPTS_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    onChange();
  };
  window.addEventListener(RECEIPTS_UPDATED_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(RECEIPTS_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

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
      .map((k) => `${JSON.stringify(k)}:${render((v as Record<string, unknown>)[k])}`);
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

function readAll(): ToolReceipt[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-RECEIPTS_CAP).flatMap((value): ToolReceipt[] => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const r = value as Record<string, unknown>;
      if (typeof r.at !== "string" || r.at.length > 64 || !Number.isFinite(Date.parse(r.at)) ||
          typeof r.tool !== "string" || !r.tool || r.tool.length > 200 ||
          (r.door !== "/mcp" && r.door !== "/mcp/free") ||
          typeof r.args_hash !== "string" || !r.args_hash || r.args_hash.length > 128 ||
          typeof r.outcome !== "string" || !r.outcome || r.outcome.length > 128 ||
          r.not_signed_evidence !== true) return [];
      // Project the complete display shape; arbitrary cached fields are not receipts.
      return [{
        at: r.at, tool: r.tool, door: r.door, args_hash: r.args_hash,
        outcome: r.outcome, not_signed_evidence: true,
      }];
    });
  } catch {
    return [];
  }
}

function writeAll(list: ToolReceipt[]): void {
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(list.slice(-RECEIPTS_CAP)));
}

/** Newest first, for display. */
export function listToolReceipts(): ToolReceipt[] {
  return readAll().reverse();
}

export function recordToolReceipt(input: {
  tool: string;
  argsHash: string;
  outcome: string;
  door?: "/mcp" | "/mcp/free";
  at?: string;
}): ToolReceipt | null {
  try {
    const receipt: ToolReceipt = {
      at: input.at ?? new Date().toISOString(),
      tool: input.tool,
      door: input.door ?? "/mcp",
      args_hash: input.argsHash,
      outcome: input.outcome || "UNKNOWN",
      not_signed_evidence: true,
    };
    const list = readAll();
    list.push(receipt);
    writeAll(list);
    notifyToolReceipts();
    return receipt;
  } catch {
    return null;
  }
}

export function clearToolReceipts(): void {
  try {
    localStorage.removeItem(RECEIPTS_KEY);
    notifyToolReceipts();
  } catch {
    // a blocked store is already "cleared" as far as this page can know
  }
}

/** A JSON download blob; the caller anchors it as a link click. Never throws. */
export function exportToolReceipts(): string | null {
  try {
    return JSON.stringify(
      {
        schema: "csoai.tool-receipts/1",
        exported_at: new Date().toISOString(),
        note: "A local browser log of tool runs. Not signed evidence; verify signed records with the verify tools.",
        receipts: readAll(),
      },
      null,
      2,
    );
  } catch {
    return null;
  }
}
