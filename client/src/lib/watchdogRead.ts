import { retrievalState } from "../../../functions/_lib/watchdogRoute";
import { retrievalFailed, sha256Hex, type Retrieval } from "./watchdogJourney";

export const WATCHDOG_READ_TIMEOUT_MS = 15_000;

/** Bound public reads, including response bodies; callers can cancel on navigation. */
export async function readWatchdogJson(
  url: string,
  signal?: AbortSignal,
): Promise<Retrieval<{ json: unknown; text: string }>> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, WATCHDOG_READ_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (retrievalState(res.status) === "UNCHECKABLE" || !res.ok)
      return retrievalFailed("HTTP " + res.status, fetchedAt, res.status);
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return retrievalFailed("The response was not JSON", fetchedAt, res.status);
    }
    return { state: "OK", value: { json, text }, fetchedAt, status: res.status, sha256: await sha256Hex(text) };
  } catch (e) {
    return retrievalFailed(
      controller.signal.aborted
        ? signal?.aborted ? "Read cancelled" : "Read timed out; please retry"
        : e instanceof Error ? e.message : "Network error",
      fetchedAt,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
