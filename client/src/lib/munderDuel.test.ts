// @vitest-environment node
import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  makeMunderSession, chooseMunder, beginMeok, receiveMeok, approveMunder, nextMunder,
  holdMunder, decodeMunder, encodeMunder, saveMunder, modelRequest, parseModelMove,
  fetchMeokMove, munderSummary, munderReport, MEOK_MODEL, MEOK_ENDPOINT, MAX_REPLY_BYTES,
} from "./munderDuel";
import { generatePracticeRounds } from "./munderPractice";
const t = "2026-11-06T05:00:00.000Z";
const answer = (action = "resolve") => JSON.stringify({ id: "chatcmpl-test", model: MEOK_MODEL,
  choices: [{ finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ action }) } }] });
function pending() {
  return beginMeok(chooseMunder(makeMunderSession("test", 42, t), 1, "resolve"), 1, t);
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("real MEOK Munder game contract", () => {
  it("keeps rejected provider payloads and internal aliases out of the public error", () => {
    const wrong = { ...JSON.parse(answer()), model: "private-token-fixture" };
    let message = "";
    try { parseModelMove(JSON.stringify(wrong)); }
    catch (error) { message = (error as Error).message; }
    expect(message).toContain("unsupported game proposal");
    expect(message).not.toContain("private-token-fixture");
    expect(message).not.toContain(MEOK_MODEL);
    expect(message.length).toBeLessThan(150);
  });

  it("completes eight participant-approved moves using actual response bytes, without a simulated seat", () => {
    let s = makeMunderSession("test", 42, t);
    for (let i = 0; i < 8; i++) {
      const c = generatePracticeRounds(42)[i];
      s = chooseMunder(s, c.id, c.critical ? "escalate" : "resolve");
      s = beginMeok(s, c.id, t);
      s = receiveMeok(s, s.rounds.at(-1)!.intent!.requestId, answer(c.critical ? "escalate" : "resolve"), t);
      expect(munderSummary(s).completed).toBe(i);
      s = approveMunder(s, c.id, t);
      expect(decodeMunder(encodeMunder(s))?.rounds).toEqual(s.rounds);
      if (i < 7) s = nextMunder(s, c.id);
    }
    expect(munderSummary(s)).toEqual({ completed: 8, total: 8, human: 8, meok: 8, finished: true });
    expect(() => nextMunder(s, 8)).toThrow();
  });

  it("omits hidden case labels and participant answers from the request", () => {
    const c = generatePracticeRounds(42)[0];
    const req = JSON.parse(modelRequest(c, "test_r1"));
    const same = modelRequest({ ...c, critical: !c.critical }, "test_r1");
    expect(same).toBe(modelRequest(c, "test_r1"));
    expect(req.messages[0].content).toContain(c.body);
    expect(req).not.toHaveProperty("critical");
    expect(req.messages[0].content).not.toContain("participant");
    expect(req.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(req.model).toBe(MEOK_MODEL);
  });

  it("refuses another request, stale response, premature approval and duplicate application", () => {
    const s = pending();
    expect(() => beginMeok(s, 1, t)).toThrow();
    expect(() => receiveMeok(s, "other", answer(), t)).toThrow();
    expect(() => approveMunder(s, 1, t)).toThrow();
    const replied = receiveMeok(s, "test_r1", answer(), t);
    expect(() => receiveMeok(replied, "test_r1", answer(), t)).toThrow();
    const applied = approveMunder(replied, 1, t);
    expect(() => approveMunder(applied, 1, t)).toThrow();
    expect(() => chooseMunder(nextMunder(applied, 1), 1, "resolve")).toThrow();
  });

  it.each([
    ["wrong model", { model: "another-model" }],
    ["truncation", { choices: [{ finish_reason: "length", message: { role: "assistant", content: '{"action":"resolve"}' } }] }],
    ["refusal", { choices: [{ finish_reason: "stop", message: { role: "assistant", content: "I cannot play" } }] }],
    ["extra action", { choices: [{ finish_reason: "stop", message: { role: "assistant", content: '{"action":"resolve","execute":true}' } }] }],
    ["two choices", { choices: [{}, {}] }],
  ])("rejects %s instead of attributing a fallback to MEOK", (_name, patch) => {
    expect(() => parseModelMove(JSON.stringify({ ...JSON.parse(answer()), ...patch }))).toThrow();
  });

  it("holds an interrupted intent on restore and never approves or restarts it", () => {
    const restored = decodeMunder(encodeMunder(pending()))!;
    expect(restored.rounds[0].hold).toContain("will not be repeated");
    expect(() => beginMeok(restored, 1, t)).toThrow();
    expect(() => approveMunder(restored, 1, t)).toThrow();
    expect(munderSummary(restored).completed).toBe(0);
  });

  it.each(["cases", "request", "response", "authority", "order"])("rejects cache tampering: %s", kind => {
    const s = receiveMeok(pending(), "test_r1", answer(), t) as any;
    if (kind === "cases") s.casesKey = "[]";
    if (kind === "request") s.rounds[0].intent.body += " ";
    if (kind === "response") s.rounds[0].proof.requestId = "alien";
    if (kind === "authority") s.graphAdmitted = true;
    if (kind === "order") s.rounds.push({ ...s.rounds[0], caseId: 2 });
    expect(decodeMunder(JSON.stringify(s))).toBeNull();
  });

  it("refuses invalid JSON, oversized data, backwards clocks and denied storage", () => {
    expect(decodeMunder("{")).toBeNull();
    expect(decodeMunder("x".repeat(200001))).toBeNull();
    expect(() => parseModelMove("x".repeat(MAX_REPLY_BYTES + 1))).toThrow();
    expect(() => receiveMeok(pending(), "test_r1", answer(), "2026-01-01T00:00:00.000Z")).toThrow();
    expect(saveMunder(pending(), { setItem() { throw Error("full"); } })).toBe(false);
  });

  it("uses the fixed provider with no credentials, redirect or automatic retry", async () => {
    const fetcher = vi.fn(async () => new Response(answer(), { status: 200 }));
    const raw = await fetchMeokMove(pending().rounds[0].intent!, { fetchImpl: fetcher as typeof fetch });
    expect(parseModelMove(raw).action).toBe("resolve");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(MEOK_ENDPOINT, expect.objectContaining({
      method: "POST", credentials: "omit", redirect: "error", cache: "no-store",
    }));
  });

  it("refuses HTTP errors, oversized streams and already-cancelled requests", async () => {
    const intent = pending().rounds[0].intent!;
    const failed = vi.fn(async () => new Response("unavailable", { status: 503 }));
    await expect(fetchMeokMove(intent, { fetchImpl: failed as typeof fetch })).rejects.toThrow("503");
    expect(failed).toHaveBeenCalledTimes(1);
    await expect(fetchMeokMove(intent, { fetchImpl: (async () => new Response("x".repeat(MAX_REPLY_BYTES + 1))) as typeof fetch })).rejects.toThrow("limit");
    const abort = new AbortController(); abort.abort();
    await expect(fetchMeokMove(intent, { fetchImpl: failed as typeof fetch, signal: abort.signal })).rejects.toThrow("cancelled");
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it("aborts a slow provider once at the deadline", async () => {
    vi.useFakeTimers();
    try {
      const f = vi.fn((_url: unknown, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
        options.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      }));
      const result = fetchMeokMove(pending().rounds[0].intent!, { fetchImpl: f as typeof fetch, timeoutMs: 10 });
      const assertion = expect(result).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(11);
      await assertion;
      expect(f).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });

  it("retains raw bounded I/O and hashes but refuses independent-learning or admission claims", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const s = approveMunder(receiveMeok(pending(), "test_r1", answer(), t), 1, t);
    const { data, markdown } = await munderReport(s, "a".repeat(40));
    expect(data.rows[0].response?.body).toBe(answer());
    expect(data.rows[0].request?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.qualification).toMatchObject({ signed: false, graphAdmitted: false,
      measuredHumanLearning: false, authenticatedR3TaskOrNativeEffect: false, automaticTrainingReuse: false });
    expect(markdown).toContain("study outcome or external acceptance is asserted");
    expect(holdMunder(s, "test_r1", "late failure")).toBe(s);
  });
});
