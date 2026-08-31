/**
 * Bloomberg-style functions for the one paste box.
 *
 * VERIFY · BOARD · AXIS · CENSUS · CORRECT · WATCH
 * Chat is a skin. These are the keys. A Hub id is a census row, never MEASURED.
 */

import { looksLikeCardJson, namedAxis } from "@/components/os/osChat";

export const TERMINAL_FNS = [
  "VERIFY",
  "BOARD",
  "AXIS",
  "CENSUS",
  "CORRECT",
  "WATCH",
  "COMPUTE",
  "HELP",
] as const;
export type TerminalFn = (typeof TERMINAL_FNS)[number];
export type TerminalPaste = "card" | "hub-id" | "text";

export type TerminalParse = {
  fn: TerminalFn | null;
  arg: string;
  paste: TerminalPaste;
};

export const TERMINAL_HINT =
  "Functions: VERIFY · BOARD · AXIS {name} · CENSUS {id} · CORRECT · WATCH {id} · COMPUTE";

export const TERMINAL_FN_RULING =
  "Type a function, get a dated vital sign. A Hub listing is DISCOVERED, never MEASURED.";

/** owner/name — Speed 0 subject, not a URL and not a sentence. */
export function looksLikeHubId(raw: string): boolean {
  const t = raw.trim();
  if (!t || /\s/.test(t) || /^https?:/i.test(t) || t.startsWith("{")) return false;
  return /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(
    t,
  );
}

export function parseTerminal(raw: string): TerminalParse {
  const t = raw.trim();
  if (!t) return { fn: null, arg: "", paste: "text" };
  if (looksLikeCardJson(t)) return { fn: "VERIFY", arg: t, paste: "card" };

  const headed = t.match(/^(VERIFY|BOARD|AXIS|CENSUS|CORRECT|WATCH|COMPUTE|HELP)\b\s*([\s\S]*)$/i);
  if (headed) {
    const fn = headed[1].toUpperCase() as TerminalFn;
    const arg = headed[2].trim();
    const paste: TerminalPaste = looksLikeCardJson(arg)
      ? "card"
      : looksLikeHubId(arg)
        ? "hub-id"
        : "text";
    return { fn, arg, paste };
  }

  if (looksLikeHubId(t)) return { fn: "CENSUS", arg: t, paste: "hub-id" };
  return { fn: null, arg: t, paste: "text" };
}

export function censusNote(id: string): string {
  return (
    `CENSUS ${id} — DISCOVERED. Listing is not MEASURED. Speed 0. ` +
    `No weight download. Empty stays empty.`
  );
}

export function correctionsNote(count: unknown): string {
  const n = typeof count === "number" && Number.isFinite(count) ? String(count) : "see GET /api/corrections";
  return (
    `CORRECT — ${n} addenda on GET /api/corrections. Append-only. ` +
    `Honesty asset, not a wellness score.`
  );
}

export function axisFromFn(parsed: TerminalParse): string | null {
  if (parsed.fn === "AXIS" && parsed.arg) return namedAxis(parsed.arg) ?? parsed.arg.trim().toLowerCase();
  if (parsed.fn === null && parsed.paste === "text") return namedAxis(parsed.arg);
  return null;
}
