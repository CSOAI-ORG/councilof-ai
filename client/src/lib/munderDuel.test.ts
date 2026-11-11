// @vitest-environment node
import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  makeMunderSession, chooseMunder, beginMeok, receiveMeok, approveMunder, nextMunder,
  holdMunder, decodeMunder, encodeMunder, saveMunder, modelRequest, parseModelMove,
  fetchMeokMove, munderSummary, munderReport, MEOK_MODEL, MEOK_ENDPOINT, MAX_REPLY_BYTES,
  beginMunderLesson, retryMunderLesson, munderCaseLesson, MAX_MUNDER_LOCAL_RETRIES,
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



  it("keeps failure, case lesson and exact retry in one saved record without changing the original game", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const round = generatePracticeRounds(42)[0], expected = round.critical ? "escalate" : "resolve";
    const wrong = expected === "resolve" ? "escalate" : "resolve";
    let s = makeMunderSession("same-loop", 42, t, "a".repeat(40));
    s = beginMeok(chooseMunder(s, 1, wrong), 1, t);
    s = approveMunder(receiveMeok(s, "same-loop_r1", answer(expected), t), 1, t);
    const original = JSON.parse(JSON.stringify(s)), score = munderSummary(s);
    s = beginMunderLesson(s, 1, t);
    s = retryMunderLesson(s, 1, wrong, t);
    s = retryMunderLesson(s, 1, expected, t);
    expect(s.rounds[0].human).toBe(original.rounds[0].human);
    expect(s.rounds[0].intent).toEqual(original.rounds[0].intent);
    expect(s.rounds[0].proof).toEqual(original.rounds[0].proof);
    expect(s.rounds[0].approvedAt).toBe(original.rounds[0].approvedAt);
    expect(munderSummary(s)).toEqual(score);
    const restored = decodeMunder(encodeMunder(s))!;
    expect(restored.rounds[0].learning?.attempts.map(a => a.choice)).toEqual([wrong, expected]);
    const { data, markdown } = await munderReport(restored, "b".repeat(40));
    const object = data.rows[0].learningObject!;
    expect(object.lesson.originalParticipantMatched).toBe(false);
    expect(object.lesson.originalMeokMatched).toBe(true);
    expect(object.exactRetries.map(a => a.matchesKnownRule)).toEqual([false, true]);
    expect(object.responseSha256).toBe(data.rows[0].response?.sha256);
    expect(object.independentAssessment).toBe("NOT_ESTABLISHED");
    expect(object.graphAdmission).toBe("NOT_SUBMITTED");
    expect(data.qualification.measuredHumanLearning).toBe(false);
    expect(data.qualification.automaticTrainingReuse).toBe(false);
    expect(markdown).toContain("not a novel held-out assessment");
    expect(() => beginMunderLesson(restored, 1, t)).toThrow("history was preserved");
    expect(() => retryMunderLesson(restored, 1, wrong, t)).toThrow("already matched");
  });

  it("makes a matched original case available as a lesson without claiming the lesson was opened", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const c = generatePracticeRounds(42)[0], expected = c.critical ? "escalate" : "resolve";
    const chosen = beginMeok(chooseMunder(makeMunderSession("win", 42, t), 1, expected), 1, t);
    const s = approveMunder(receiveMeok(chosen, "win_r1", answer(expected), t), 1, t);
    const { data } = await munderReport(s, "a".repeat(40));
    expect(data.rows[0].learningObject).toMatchObject({
      lessonState: "AVAILABLE_NOT_OPENED", openedAt: null, exactRetries: [],
      lesson: { originalParticipantMatched: true, originalMeokMatched: true },
    });
    expect(s.rounds[0].learning).toBeUndefined();
  });

  it("refuses lessons for unapproved, wrong and held cases and refuses retry before opening", () => {
    expect(() => beginMunderLesson(pending(), 1, t)).toThrow("separately approved");
    const replied = receiveMeok(pending(), "test_r1", answer(), t);
    expect(() => beginMunderLesson(replied, 1, t)).toThrow("separately approved");
    expect(() => beginMunderLesson(holdMunder(replied, "test_r1", "held"), 1, t)).toThrow();
    const s = approveMunder(replied, 1, t);
    expect(() => beginMunderLesson(s, 99, t)).toThrow("case has changed");
    expect(() => retryMunderLesson(s, 1, "resolve", t)).toThrow("Open this exact");
  });

  it("preserves an earlier case and its retry history while the same game advances", () => {
    const s = beginMunderLesson(approveMunder(receiveMeok(pending(), "test_r1", answer(), t), 1, t), 1, t);
    const later = nextMunder(s, 1), second = JSON.parse(JSON.stringify(later.rounds[1]));
    const expected = generatePracticeRounds(42)[0].critical ? "escalate" : "resolve";
    const revised = retryMunderLesson(later, 1, expected, t);
    expect(revised.rounds[1]).toEqual(second);
    expect(revised.rounds[0].learning?.attempts).toEqual([{ choice: expected, at: t }]);
    expect(decodeMunder(encodeMunder(revised))?.rounds).toEqual(revised.rounds);
    expect(munderSummary(revised)).toEqual(munderSummary(later));
  });

  it("refuses backwards clocks and an overflowing retry without erasing any attempt", () => {
    const approved = approveMunder(receiveMeok(pending(), "test_r1", answer(), t), 1, t);
    const past = "2026-01-01T00:00:00.000Z";
    expect(() => beginMunderLesson(approved, 1, past)).toThrow("precedes approval");
    let s = beginMunderLesson(approved, 1, t);
    expect(() => retryMunderLesson(s, 1, "resolve", past)).toThrow("precedes");
    const wrong = munderCaseLesson(s, 1).expected === "resolve" ? "escalate" : "resolve";
    for (let i = 0; i < MAX_MUNDER_LOCAL_RETRIES; i++) s = retryMunderLesson(s, 1, wrong, t);
    const retained = encodeMunder(s);
    expect(() => retryMunderLesson(s, 1, wrong, t)).toThrow("limit");
    expect(encodeMunder(s)).toBe(retained);
    expect(decodeMunder(retained)?.rounds[0].learning?.attempts).toHaveLength(MAX_MUNDER_LOCAL_RETRIES);
  });

  it.each(["case", "request", "response", "approval", "unapproved", "order", "post-match", "authority"])(
    "refuses an invalid saved lesson binding or history: %s", kind => {
      const original = beginMunderLesson(approveMunder(receiveMeok(pending(), "test_r1", answer(), t), 1, t), 1, t);
      const s = JSON.parse(JSON.stringify(original)), row = s.rounds[0], learning = row.learning;
      if (kind === "case") learning.caseKey = "{}";
      if (kind === "request") learning.requestId = "other";
      if (kind === "response") learning.responseId = "other";
      if (kind === "approval") learning.approvedAt = "2026-11-06T04:59:00.000Z";
      if (kind === "unapproved") row.approvedAt = null;
      if (kind === "order") learning.attempts = [{ choice: "resolve", at: "2026-01-01T00:00:00.000Z" }];
      if (kind === "post-match") {
        const expected = munderCaseLesson(original, 1).expected;
        learning.attempts = [{ choice: expected, at: t }, { choice: expected, at: t }];
      }
      if (kind === "authority") learning.graphAdmitted = true;
      expect(decodeMunder(JSON.stringify(s))).toBeNull();
    });

  it("retains the creation build across restore and distinguishes a later report exporter", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const original = makeMunderSession("build-bound", 42, t, "a".repeat(40));
    const restored = decodeMunder(encodeMunder(original))!;
    const { data, markdown } = await munderReport(restored, "b".repeat(40));
    expect(restored.createdWithSourceRevision).toBe("a".repeat(40));
    expect(data.sessionSourceRevision).toBe("a".repeat(40));
    expect(data.sourceRevision).toBe("b".repeat(40));
    expect(data.sourceRevisionRole).toBe("report-exporter");
    expect(data.qualification.buildProvenance).toContain("not authenticated");
    expect(data.qualification.signed).toBe(false);
    expect(data.qualification.graphAdmitted).toBe(false);
    expect(markdown).toContain("Session creation build: " + "a".repeat(40));
    expect(markdown).toContain("Report exporter build: " + "b".repeat(40));
  });

  it("exports a legacy save without inventing its missing creation build", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const restored = decodeMunder(encodeMunder(makeMunderSession("legacy", 42, t)))!;
    const { data, markdown } = await munderReport(restored, "b".repeat(40));
    expect(data.sessionSourceRevision).toBeNull();
    expect(data.sourceRevision).toBe("b".repeat(40));
    expect(data.qualification.buildProvenance).toContain("was not retained");
    expect(markdown).toContain("Session creation build: not retained in this legacy save");
    expect(restored.createdWithSourceRevision).toBeUndefined();
  });

  it.each(["not-a-revision", "a".repeat(41), " ".repeat(40)])(
    "refuses malformed saved creation-build metadata: %s", invalid => {
      const saved = { ...makeMunderSession("bad-build", 42, t),
        createdWithSourceRevision: invalid };
      expect(decodeMunder(JSON.stringify(saved))).toBeNull();
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
