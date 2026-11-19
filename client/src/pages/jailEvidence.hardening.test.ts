import { describe, expect, it } from "vitest";
import { fetchJailArchive, JAIL_INDEX_LIMIT, parseJailArchive, readJailBoard } from "./jailEvidence";

const id = "a".repeat(64);
const fixture = () => ({
  schema: "csoai.jail-index/0.1", kind: "folder", writes_board: false,
  axis: "jail", as_of: "2026-08-18", dataset: "csoai/gspc-jail-goldbank",
  dataset_url: "https://huggingface.co/datasets/csoai/gspc-jail-goldbank", separation: "TIE",
  cards: [{ id, axis: "jail-escape-detection", url: `/signed/cards/${id}.json` }],
});
const signal = () => new AbortController().signal;
// This ceiling is a test guard, not a change to the component's request timeout.
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error("TEST_DEADLINE_EXCEEDED")), 1_000);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

// Deliberately synthetic negative controls, not measurements or production events.
describe("jail evidence strict readers and stream lifecycle", () => {
  it("does not coerce an array into a measured status", () => {
    expect(readJailBoard({ axes: [{ axis: "jail", status: ["MEASURED"] }] })?.status).toBe("Not published");
  });
  it("does not invoke an object's status coercion", () => {
    let coerced = false;
    const status = { toString: () => { coerced = true; return "MEASURED"; } };
    expect(readJailBoard({ axes: [{ axis: "jail", status }] })?.status).toBe("Not published");
    expect(coerced).toBe(false);
  });
  for (const segment of [".", ".."]) {
    it(`rejects the normalized dataset segment ${segment}`, () => {
      expect(() => parseJailArchive({ ...fixture(), dataset: `csoai/${segment}`,
        dataset_url: `https://huggingface.co/datasets/csoai/${segment}` })).toThrow();
    });
  }
  it("rejects an already-aborted request without calling its adapter", async () => {
    const controller = new AbortController(); controller.abort(); let calls = 0;
    await expect(fetchJailArchive(controller.signal, async () => {
      calls++; return new Response(JSON.stringify(fixture()));
    })).rejects.toThrow();
    expect(calls).toBe(0);
  });
  it("does not parse a response received after an abort", async () => {
    const controller = new AbortController();
    await expect(fetchJailArchive(controller.signal, async () => {
      controller.abort(); return new Response(JSON.stringify(fixture()));
    })).rejects.toThrow();
  });
  it("releases an unread failed HTTP body", async () => {
    let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    await expect(fetchJailArchive(signal(), async () => new Response(body, { status: 503 }))).rejects.toThrow("HTTP 503");
    expect(cancelled).toBe(true);
  });
  it("does not await an indefinitely pending oversize cancellation", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(JAIL_INDEX_LIMIT + 1)); },
      cancel() { return new Promise<void>(() => {}); },
    });
    await expect(bounded(fetchJailArchive(signal(), async () => new Response(body)))).rejects.toThrow("read limit");
  });
  it("aborts a stalled body even when an adapter omits signal propagation", async () => {
    const controller = new AbortController(); let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    const result = fetchJailArchive(controller.signal, async () => new Response(body));
    const timer = setTimeout(() => controller.abort(), 5);
    try {
      await expect(bounded(result)).rejects.toThrow();
      expect(cancelled).toBe(true);
    } finally { clearTimeout(timer); }
  });
  it("rejects invalid UTF-8 instead of repairing it into a record", async () => {
    await expect(fetchJailArchive(signal(), async () => new Response(new Uint8Array([0xc3, 0x28])))).rejects.toThrow();
  });
  it("accepts a valid body at exactly the byte limit", async () => {
    const json = JSON.stringify(fixture());
    const body = json + " ".repeat(JAIL_INDEX_LIMIT - new TextEncoder().encode(json).byteLength);
    expect((await fetchJailArchive(signal(), async () => new Response(body))).cards.length).toBe(1);
  });
  it("reassembles many byte chunks without changing the record", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(fixture()));
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
      controller.close();
    } });
    expect((await fetchJailArchive(signal(), async () => new Response(body))).cards[0].id).toBe(id);
  });
  it("retains a legitimate zero accuracy", () => {
    expect(readJailBoard({ axes: [{ axis: "jail", status: "MEASURED", accuracy: 0 }] })?.accuracy).toBe(0);
  });
  it("does not mutate the original archive", () => {
    const value = fixture(); const original = JSON.stringify(value);
    parseJailArchive(value); expect(JSON.stringify(value)).toBe(original);
  });
});
