/**
 * verifyFreshness — binds a displayed verdict to the exact input it verified.
 *
 * Defect (goal-mode 2026-09-14, item 3): the record verifier kept a green verdict on
 * screen after the reader edited the payload, and an older async verification could
 * overwrite the result of a newer input. This module is the pure state machine the
 * form drives; it is testable without a DOM.
 *
 *   - every run is numbered (`seq`); only the latest run may settle a verdict;
 *   - a verdict carries the sha256 of the text it verified (`inputHash`);
 *   - when the input changes, an existing verdict is marked STALE (kept for reading,
 *     never presented as current) until the reader re-verifies the new bytes;
 *   - a settle whose hash differs from the current input is dropped, not displayed.
 */
export type VerdictLike = { valid: boolean };

export type Freshness<V extends VerdictLike> = {
  /** hash of what is in the box now */
  inputHash: string;
  /** monotonically increasing run counter; the latest run is `seq` */
  seq: number;
  /** last verdict shown, with the hash of the input it verified */
  verdict: V | null;
  verdictHash: string | null;
};

export const initialFreshness = <V extends VerdictLike>(): Freshness<V> => ({ inputHash: "", seq: 0, verdict: null, verdictHash: null });

/** sha256 hex of the exact text. Uses WebCrypto (browser and Node ≥ 20). */
export async function inputHash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The box changed. The verdict (if any) no longer describes the input. */
export function onInput<V extends VerdictLike>(s: Freshness<V>, hash: string): Freshness<V> {
  return { ...s, inputHash: hash };
}

/** A run starts for the current input; returns the ticket the settle must present. */
export function startRun<V extends VerdictLike>(s: Freshness<V>): { state: Freshness<V>; seq: number; hash: string } {
  const seq = s.seq + 1;
  return { state: { ...s, seq }, seq, hash: s.inputHash };
}

/**
 * A run finished. Accept only if it is the latest run AND it verified the bytes that
 * are still in the box; otherwise drop it (an older response must never overwrite a
 * newer input, and a verdict about other bytes must never be shown as current).
 */
export function settleRun<V extends VerdictLike>(s: Freshness<V>, seq: number, hash: string, verdict: V): { state: Freshness<V>; accepted: boolean } {
  if (seq !== s.seq || hash !== s.inputHash) return { state: s, accepted: false };
  return { state: { ...s, verdict, verdictHash: hash }, accepted: true };
}

/** True when a verdict is on screen but the input has changed since it was verified. */
export function isStale<V extends VerdictLike>(s: Freshness<V>): boolean {
  return s.verdict !== null && s.verdictHash !== s.inputHash;
}

/** The verdict to present as CURRENT, or null when there is none or it is stale. */
export function currentVerdict<V extends VerdictLike>(s: Freshness<V>): V | null {
  return isStale(s) ? null : s.verdict;
}
