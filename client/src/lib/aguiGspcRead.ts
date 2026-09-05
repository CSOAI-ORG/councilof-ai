import { z } from "zod";
import {
  AGUI_GSPC_STATE_PATH,
  toAguiGspcTextMessage,
  type GspcLiveSnapshot,
} from "./aguiGspcStream";

const count = z.number().finite().int().nonnegative().nullable();
const axis = z.object({
  axis: z.string().min(1).max(100),
  status: z.string().min(1).max(80),
  family: z.string().max(100).optional(),
  kind: z.string().max(100).optional(),
  n: count,
  accuracy: z.number().finite().min(0).max(1).nullable(),
  separation: z.string().max(100).nullable(),
});

const snapshotSchema = z
  .object({
    schema: z.literal("csoai.agui-gspc-snapshot/0.1"),
    source: z.literal("wire"),
    endpoint: z.literal("/api/gspc"),
    public_count: z.string().min(1).max(500),
    count_grammar: z.string().max(2_000),
    totals: z.object({
      axes: count,
      measured_axes: count,
      unmeasured_axes: count,
    }),
    measured: z.array(axis.extend({ status: z.literal("MEASURED") })).max(64),
    empty: z.array(axis.refine((row) => row.status !== "MEASURED")).max(64),
    note: z.string().max(2_000),
  })
  .refine((snapshot) => {
    const names = [...snapshot.measured, ...snapshot.empty].map(
      (row) => row.axis,
    );
    return new Set(names).size === names.length;
  }, "Duplicate axis in snapshot");

const observationSchema = z.object({
  observedAt: z.string().datetime(),
  snapshot: snapshotSchema,
});

/** Browser-session observation, never a signed or durable receipt. */
export type GspcChatObservation = {
  observedAt: string;
  snapshot: GspcLiveSnapshot;
};

export function parseGspcChatObservation(
  value: unknown,
): GspcChatObservation | undefined {
  const parsed = observationSchema.safeParse(value);
  // This repository disables strictNullChecks, which makes Zod's inferred
  // properties optional in TypeScript; the runtime schema above requires them.
  return parsed.success ? (parsed.data as GspcChatObservation) : undefined;
}

export class GspcStreamError extends Error {
  constructor(
    message: string,
    readonly state: "unchecked" | "unreachable",
  ) {
    super(message);
    this.name = "GspcStreamError";
  }
}

const invalid = () =>
  new GspcStreamError(
    "The board response was incomplete or could not be validated.",
    "unchecked",
  );
const MAX_BYTES = 128 * 1024;

/** Consume this endpoint's finite projection pair, not a general agent run.
 * Never apply arbitrary JSON Patch paths or treat EOF as RUN_FINISHED.
 */
export function parseAguiGspcSse(body: string): GspcLiveSnapshot {
  if (new TextEncoder().encode(body).byteLength > MAX_BYTES) throw invalid();
  const normalized = body.replace(/\r\n/g, "\n");
  if (!normalized.endsWith("\n\n")) throw invalid();
  try {
    const events = normalized.split("\n\n").flatMap((frame) => {
      const lines = frame
        .split("\n")
        .filter((line) => line && !line.startsWith(":"));
      if (!lines.length) return [];
      const names = lines.filter((line) => line.startsWith("event:"));
      const data = lines.filter((line) => line.startsWith("data:"));
      if (names.length !== 1 || !data.length) throw invalid();
      const name = names[0].slice(6).trim();
      const value = JSON.parse(
        data.map((line) => line.slice(5).replace(/^ /, "")).join("\n"),
      );
      if (!value || typeof value !== "object" || value.type !== name)
        throw invalid();
      return [{ name, value }];
    });
    if (
      events.length !== 2 ||
      events[0].name !== "STATE_DELTA" ||
      events[1].name !== "TEXT_MESSAGE_CONTENT"
    )
      throw invalid();
    const delta: unknown = events[0].value.delta;
    if (!Array.isArray(delta) || delta.length !== 3) throw invalid();
    const parsed = snapshotSchema.safeParse(delta[0]?.value);
    if (!parsed.success) throw invalid();
    const snapshot = parsed.data as GspcLiveSnapshot;
    if (
      delta[0]?.op !== "replace" ||
      delta[0]?.path !== "/gspc" ||
      delta[1]?.op !== "replace" ||
      delta[1]?.path !== "/gspc/public_count" ||
      delta[1]?.value !== snapshot.public_count ||
      delta[2]?.op !== "replace" ||
      delta[2]?.path !== "/gspc/empty_visible" ||
      JSON.stringify(delta[2]?.value) !==
        JSON.stringify(snapshot.empty.map((row) => row.axis)) ||
      events[1].value.delta !== toAguiGspcTextMessage(snapshot).delta
    )
      throw invalid();
    return snapshot;
  } catch {
    throw invalid();
  }
}

/** A single bounded GET. Intentional EOF must not trigger EventSource retries. */
export async function readAguiGspcOnce(
  fetchImpl: typeof fetch = fetch,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<GspcChatObservation> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, options.timeoutMs ?? 15_000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const cancelRead = () => {
    void reader?.cancel().catch(() => {});
  };
  controller.signal.addEventListener("abort", cancelRead, { once: true });
  try {
    controller.signal.throwIfAborted();
    const response = await fetchImpl(AGUI_GSPC_STATE_PATH, {
      headers: { accept: "text/event-stream" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok)
      throw new GspcStreamError(
        `The board could not be reached (HTTP ${response.status}).`,
        "unreachable",
      );
    if (
      response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "text/event-stream" ||
      !response.body
    )
      throw invalid();
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let body = "";
    let size = 0;
    while (true) {
      controller.signal.throwIfAborted();
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BYTES) throw invalid();
      body += decoder.decode(part.value, { stream: true });
    }
    controller.signal.throwIfAborted();
    body += decoder.decode();
    return {
      observedAt: new Date().toISOString(),
      snapshot: parseAguiGspcSse(body),
    };
  } catch (error) {
    if (error instanceof GspcStreamError) throw error;
    throw new GspcStreamError(
      controller.signal.aborted
        ? "The board read stopped before it completed. Try again."
        : "The board connection ended before a complete response arrived.",
      "unreachable",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", cancelRead);
    await reader?.cancel().catch(() => {});
    reader?.releaseLock();
  }
}
