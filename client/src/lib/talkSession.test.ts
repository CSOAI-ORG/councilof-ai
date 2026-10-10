import { isVerificationNavigationQuestion, plannedPageReply } from "./askNavigation";
import assert from "node:assert/strict";
import { it } from "vitest";
import { newRun, reduceRun, streamRun, type Json, type StreamOptions, type TalkRun } from "./aguiTalk";
import { createTalkLifecycle, createTalkSession } from "./talkSession";
import { lookupFromRun } from "./myResults";
import { upsertTalkRun } from "./talkHistory";
import { createAskRequests, createWatchRequests, onceAccepted, takeAskRequest, takeWatchRequest } from "./askRequests";
import type { AskOpenDetail, AskRequest } from "../components/ask/askBus";
import type { Thread } from "../components/lobby/useLobbyChat";

const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function harness() {
  const calls: StreamOptions[] = [];
  const updates: TalkRun[] = [];
  const settled: TalkRun[] = [];
  const completed: TalkRun[] = [];
  const pending: { resolve: () => void; reject: (reason: Error) => void }[] = [];
  let questions = 0;
  let ids = 0;
  const runner = createTalkSession(() => ({
    makeId: () => `local-${++ids}`,
    origin: () => ({ threadId: "original-thread", userMessageId: `question-${++questions}` }),
    onUpdate: (run) => updates.push(run),
    onSettled: (run) => settled.push(run),
    onDone: (run) => completed.push(run),
    stream: (options) => {
      calls.push(options);
      return new Promise<void>((resolve, reject) => pending.push({ resolve, reject }));
    },
  }));
  return { runner, calls, updates, settled, completed, pending, questions: () => questions,
    event: (event: Json, index = 0) => calls[index].onEvent(event) };
}
const toolResult = { type: "TOOL_CALL_RESULT", toolCallId: "card", content: JSON.stringify({
  tool: "get_axis", label: "MEASURED", output: { n: 7 },
  citation: { tool: "get_axis", record_id: "axis:safety", url: "/cards/actual.json" },
}) };

it("reserves an Ask synchronously before a second send can record an orphan question", async () => {
  const h = harness();
  assert.equal(h.runner.start("  first question  "), true);
  assert.equal(h.runner.isBusy(), true);
  assert.equal(h.runner.start("second draft"), false);
  assert.equal(h.questions(), 1);
  await tick();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].question, "first question");
  assert.equal(h.calls[0].threadId, "original-thread");
  assert.equal(h.calls[0].runId, "local-1");
  assert.equal(h.calls[0].userMessageId, "question-1");
  h.runner.stop();
});
it("keeps server IDs separate from the stable history and browser keys", async () => {
  const h = harness(); h.runner.start("question"); await tick();
  h.event({ type: "RUN_STARTED", threadId: "server-thread", runId: "server-run" });
  h.event({ type: "TEXT_MESSAGE_START", messageId: "server-message" });
  h.event({ type: "TEXT_MESSAGE_CONTENT", messageId: "server-message", delta: "answer" });
  h.event({ type: "RUN_FINISHED", threadId: "server-thread", runId: "server-run", result: {} });
  h.pending[0].resolve(); await tick();
  const run = h.settled[0];
  assert.equal(run.id, "local-1");
  assert.equal(run.threadId, "server-thread"); assert.equal(run.runId, "server-run");
  assert.equal(run.messageId, "server-message"); assert.equal(run.text, "answer");
  assert.deepEqual(run.origin, { threadId: "original-thread", userMessageId: "question-1" });
  assert.equal(h.completed.length, 1); assert.equal(h.runner.isBusy(), false);
});
it("ignores text belonging to a different server message", () => {
  const run = reduceRun(newRun("q", "stable"), { type: "TEXT_MESSAGE_START", messageId: "right" });
  assert.equal(reduceRun(run, { type: "TEXT_MESSAGE_CONTENT", messageId: "wrong", delta: "foreign" }).text, "");
  assert.equal(reduceRun(run, { type: "TEXT_MESSAGE_CONTENT", messageId: "right", delta: "actual" }).text, "actual");
});
it("Stop keeps returned output, citations and answer text while ending pending cards", async () => {
  const h = harness(); h.runner.start("question"); await tick();
  h.event(toolResult);
  h.event({ type: "TOOL_CALL_START", toolCallId: "pending", toolCallName: "get_root" });
  h.event({ type: "TEXT_MESSAGE_CONTENT", delta: "partial answer" });
  assert.equal(h.runner.stop(), true);
  const run = h.settled[0];
  assert.equal(run.status, "cancelled"); assert.equal(run.text, "partial answer");
  assert.equal(run.tools[0].status, "done"); assert.deepEqual(run.tools[0].output, { n: 7 });
  assert.equal(run.tools[0].citation?.record_id, "axis:safety");
  assert.equal(run.tools[1].status, "cancelled"); assert.equal(h.calls[0].signal?.aborted, true);
  assert.equal(h.completed.length, 0); assert.equal(h.runner.isBusy(), false);
});
it("late events and rejection from a stopped request cannot overwrite the next answer", async () => {
  const h = harness(); h.runner.start("old"); await tick(); h.runner.stop();
  assert.equal(h.runner.start("new"), true); await tick();
  h.event({ type: "TEXT_MESSAGE_CONTENT", delta: "late old text" }, 0);
  h.pending[0].reject(new Error("late abort rejection")); await tick();
  assert.equal(h.runner.isBusy(), true); assert.equal(h.settled.length, 1);
  h.event({ type: "TEXT_MESSAGE_CONTENT", delta: "new text" }, 1);
  h.event({ type: "RUN_FINISHED", result: {} }, 1);
  h.pending[1].resolve(); await tick();
  assert.equal(h.settled.length, 2); assert.equal(h.settled[1].text, "new text");
  assert.equal(h.updates.some((run) => run.text.includes("late old")), false);
});
it("stopping a previous run ID cannot abort the current request", async () => {
  const h = harness(); h.runner.start("old"); await tick(); h.runner.stop();
  h.runner.start("new"); await tick();
  assert.equal(h.runner.stop("local-1"), false);
  assert.equal(h.calls[1].signal?.aborted, false); h.runner.stop("local-2");
});
it("a Stop before the transport starts makes no request and settles exactly once", async () => {
  const h = harness(); h.runner.start("q"); h.runner.stop(); await tick();
  assert.equal(h.calls.length, 0); assert.equal(h.settled.length, 1);
  assert.equal(h.settled[0].status, "cancelled"); assert.equal(h.completed.length, 0);
});
it("premature EOF is stored as an error and releases the send gate", async () => {
  const h = harness(); h.runner.start("q"); await tick();
  h.event(toolResult); h.pending[0].resolve(); await tick();
  assert.equal(h.settled[0].status, "error"); assert.match(h.settled[0].error!, /closed before/);
  assert.equal(h.settled[0].tools[0].label, "MEASURED");
  assert.equal(h.completed.length, 0); assert.equal(h.runner.start("retry"), true); h.runner.stop();
});
it("network failures settle history without running completion/watch callbacks", async () => {
  const h = harness(); h.runner.start("q"); await tick();
  h.pending[0].reject(new Error("offline")); await tick();
  assert.equal(h.settled[0].status, "error"); assert.match(h.settled[0].error!, /offline/);
  assert.equal(h.completed.length, 0); assert.equal(h.runner.isBusy(), false);
});
it("RUN_ERROR remains an error rather than a premature-EOF or success claim", async () => {
  const h = harness(); h.runner.start("q"); await tick();
  h.event({ type: "RUN_ERROR", message: "tool unavailable" }); h.pending[0].resolve(); await tick();
  assert.equal(h.settled[0].error, "tool unavailable"); assert.equal(h.completed.length, 0);
});
it("Confirm creates one challenge request under the original question and ignores stale clicks", async () => {
  const h = harness(); h.runner.start("commission this"); await tick();
  h.event({ type: "CUSTOM", name: "confirm_required", value: { tools: [{ tool: "commission_card", args: { subject: "test" } }] } });
  h.event({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
  h.pending[0].resolve(); await tick();
  const original = h.settled[0];
  assert.equal(h.runner.confirm(original), true); assert.equal(h.runner.confirm(original), false);
  assert.equal(h.questions(), 1); await tick();
  assert.deepEqual(h.calls[1].confirmTool, ["commission_card"]);
  assert.equal(h.calls[1].threadId, "original-thread");
  assert.equal(h.calls[1].userMessageId, "question-1"); h.runner.stop();
});
it("a busy Confirm preserves its pending confirmation instead of discarding it", async () => {
  const h = harness(); h.runner.start("paid"); await tick();
  h.event({ type: "CUSTOM", name: "confirm_required", value: { tools: [{ tool: "paid", args: {} }] } });
  h.event({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
  h.pending[0].resolve(); await tick();
  const original = h.settled[0]; h.runner.start("other"); await tick();
  assert.equal(h.runner.confirm(original), false);
  h.runner.stop(); assert.equal(h.runner.confirm(original), true); h.runner.stop();
});
it("cancelling confirmation keeps earlier results and prevents a stale Confirm", async () => {
  const h = harness(); h.runner.start("paid"); await tick(); h.event(toolResult);
  h.event({ type: "CUSTOM", name: "confirm_required", value: { tools: [{ tool: "paid", args: {} }] } });
  h.event({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
  h.pending[0].resolve(); await tick();
  const original = h.settled[0]; assert.equal(h.runner.cancel(original), true);
  assert.equal(h.runner.confirm(original), false); assert.equal(h.calls.length, 1);
  assert.equal(h.updates.at(-1)?.tools[0].citation?.record_id, "axis:safety");
});
it("standalone consumers keep the one-question API without a history origin", async () => {
  const updates: TalkRun[] = [];
  const runner = createTalkSession(() => ({
    onUpdate: (run) => updates.push(run),
    stream: async (o) => { o.onEvent({ type: "RUN_FINISHED", result: {} }); },
  }));
  assert.equal(runner.start("standalone"), true); await tick();
  assert.equal(updates.at(-1)?.status, "done"); assert.equal(updates.at(-1)?.origin, undefined);
});
it("the real stream transport sends the caller's IDs instead of inventing unrelated ones", async () => {
  let body: any;
  await streamRun({
    question: "q", threadId: "thread-real", runId: "run-real", userMessageId: "user-real",
    onEvent: () => undefined,
    fetchImpl: (async (_url, request) => {
      body = JSON.parse(String(request?.body));
      return new Response('data: {"type":"RUN_FINISHED"}\n\n', { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(body.threadId, "thread-real"); assert.equal(body.runId, "run-real");
  assert.equal(body.messages[0].id, "user-real");
});
function history(): Thread[] {
  return [
    { id: "a", title: "same", startedAt: "now", turns: [{ id: "q-a", role: "user", text: "same", at: "now" }] },
    { id: "b", title: "same", startedAt: "now", turns: [{ id: "q-b", role: "user", text: "same", at: "now" }] },
  ];
}
it("revisiting another thread never moves a returned answer away from its originating question", () => {
  const before = history();
  const run: TalkRun = { ...newRun("same", "run-a"), text: "answer a", status: "done", origin: { threadId: "a", userMessageId: "q-a" } };
  const after = upsertTalkRun(before, run);
  assert.equal(after[0].turns[1].talk, run); assert.equal(after[1], before[1]);
  assert.equal(before[0].turns.length, 1);
  assert.equal(upsertTalkRun(after, { ...run, text: "updated" })[0].turns.length, 2);
});
it("history rejects missing-origin and missing-question callbacks without an orphan answer", () => {
  const before = history();
  assert.equal(upsertTalkRun(before, newRun("q", "run")), before);
  const run = { ...newRun("q", "run"), origin: { threadId: "a", userMessageId: "missing" } };
  const after = upsertTalkRun(before, run);
  assert.equal(after[0], before[0]); assert.equal(after[1], before[1]);
});
it("confirmation results stay beside their original question, before a later follow-up", () => {
  const before = history(); before[0].turns.push({ id: "q-next", role: "user", text: "next", at: "later" });
  const origin = { threadId: "a", userMessageId: "q-a" };
  let after = upsertTalkRun(before, { ...newRun("same", "first"), origin });
  after = upsertTalkRun(after, { ...newRun("same", "confirm"), origin });
  assert.deepEqual(after[0].turns.map((turn) => turn.id), ["q-a", "first", "confirm", "q-next"]);
});

it("a local chat busy gate rejects suggestion clicks without creating a question", () => {
  let recorded = 0;
  const runner = createTalkSession(() => ({
    canStart: () => false, origin: () => { recorded++; return null; },
    onUpdate: () => assert.fail("must not publish a declined question"),
  }));
  assert.equal(runner.start("keep draft"), false); assert.equal(recorded, 0);
});
it("a consumer can Stop the first update before the transport is scheduled", async () => {
  let calls = 0; const settled: TalkRun[] = [];
  const runner = createTalkSession(() => ({
    onUpdate: (run) => { if (run.status === "streaming") runner.stop(); },
    onSettled: (run) => settled.push(run),
    stream: async () => { calls++; },
  }));
  assert.equal(runner.start("stop immediately"), true); await tick();
  assert.equal(calls, 0); assert.equal(settled.length, 1); assert.equal(settled[0].status, "cancelled");
});
it("failed streams end unfinished cards instead of leaving spinners after the run ends", async () => {
  const h = harness(); h.runner.start("q"); await tick();
  h.event({ type: "TOOL_CALL_START", toolCallId: "unanswered", toolCallName: "get_root" });
  h.pending[0].resolve(); await tick();
  assert.equal(h.settled[0].status, "error"); assert.equal(h.settled[0].tools[0].status, "cancelled");
});

it("Confirm keeps the originating page instead of rerouting a relative question after navigation", async () => {
  let page = { path: "/old", subject: "old.example" } as any;
  const calls: StreamOptions[] = [];
  const runs: TalkRun[] = [];
  const runner = createTalkSession(() => ({
    streamOptions: () => ({ page }),
    onUpdate: (run) => runs.push(run),
    stream: async (o) => {
      calls.push(o);
      o.onEvent({ type: "CUSTOM", name: "confirm_required", value: { tools: [{ tool: "paid", args: { subject: "old.example" } }] } });
      o.onEvent({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
    },
  }));
  runner.start("measure this server"); await tick();
  page = { path: "/new", subject: "new.example" };
  assert.equal(runner.confirm(runs.at(-1)!), true); await tick();
  assert.equal(calls[1].page?.subject, "old.example"); assert.equal(calls[1].page?.path, "/old");
});
it("a side-panel run observer and origin survive its Confirm and watch-consent retry", async () => {
  const seen: TalkRun[] = []; let calls = 0;
  const runner = createTalkSession(() => ({
    onUpdate: () => undefined,
    stream: async (o) => {
      calls++;
      if (calls === 1) o.onEvent({ type: "CUSTOM", name: "consent_required", value: { intent: "show it", steps: 1 } });
      o.onEvent({ type: "RUN_FINISHED", result: {} });
    },
  }));
  const origin = { threadId: "pane-thread", userMessageId: "pane-question" };
  runner.start("show this", undefined, origin, (run) => seen.push(run)); await tick();
  const run = seen.at(-1)!;
  assert.equal(runner.retryWithWatch(run), true); await tick();
  assert.equal(seen.at(-1)?.origin?.threadId, "pane-thread"); assert.equal(calls, 2);
});
it("the lazy Ask host reserves one request and declines a second without overwriting it", () => {
  const questions: AskRequest[] = []; let opened = 0;
  const inbox = createAskRequests(() => opened++, (request) => questions.push(request));
  const first: AskOpenDetail = { question: "first", origin: { threadId: "thread", userMessageId: "user" } };
  const second: AskOpenDetail = { question: "keep this draft" };
  inbox.receive(first); inbox.receive(second);
  assert.equal(first.accepted, true); assert.equal(second.accepted, false);
  assert.equal(questions.length, 1); assert.equal(questions[0].text, "first"); assert.equal(opened, 1);
  const status: AskOpenDetail = { action: "busy" }; inbox.receive(status); assert.equal(status.accepted, true);
});
it("the Ask host keeps the gate closed after take while its actual runner is busy", () => {
  let active = true; const questions: AskRequest[] = [];
  const inbox = createAskRequests(() => {}, (request) => questions.push(request));
  inbox.attach({ isBusy: () => active } as any); inbox.taken();
  const refused: AskOpenDetail = { question: "draft" }; inbox.receive(refused); assert.equal(refused.accepted, false);
  active = false; const accepted: AskOpenDetail = { question: "draft" }; inbox.receive(accepted);
  assert.equal(accepted.accepted, true); assert.equal(questions.length, 1);
});
it("a declined imperative question keeps its exact origin and observer until accepted", () => {
  const observer = () => undefined;
  const request: AskRequest = { text: "question", n: 1, origin: { threadId: "t", userMessageId: "u" }, onUpdate: observer };
  const pending = { current: request as AskRequest | null };
  assert.equal(takeAskRequest(pending, { ask: () => false } as any), false); assert.equal(pending.current, request);
  let options: any;
  assert.equal(takeAskRequest(pending, { ask: (_q: string, o: any) => { options = o; return true; } } as any), true);
  assert.equal(pending.current, null); assert.equal(options.origin, request.origin); assert.equal(options.onUpdate, observer);
  assert.equal(takeAskRequest(pending, { ask: () => assert.fail("already taken") } as any), false);
});
it("watch consent does not discard a busy follow-up and starts it exactly once on retry", () => {
  const run = newRun("show this", "watch");
  const pending = { current: run as TalkRun | null };
  assert.equal(takeWatchRequest(pending, { retryWithWatch: () => false, isBusy: () => true } as any), false); assert.equal(pending.current, run);
  assert.equal(takeWatchRequest(pending, { retryWithWatch: () => true, isBusy: () => false } as any), true); assert.equal(pending.current, null);
  assert.equal(takeWatchRequest(pending, { retryWithWatch: () => assert.fail("duplicate") } as any), false);
});

it("a failed tool cannot become a measured success because RUN_FINISHED says grounded", async () => {
  const h = harness(); h.runner.start("q"); await tick();
  h.event({ type: "TOOL_CALL_RESULT", toolCallId: "error", messageId: "tool-message", content: JSON.stringify({
    tool: "get_axis", label: "UNREACHABLE", output: { n: 99, accuracy: 1 },
  }) });
  h.event({ type: "RUN_FINISHED", result: { grounded: true } }); h.pending[0].resolve(); await tick();
  assert.equal(h.settled[0].status, "error"); assert.equal(h.completed.length, 0);
  assert.equal(h.settled[0].tools[0].label, "UNREACHABLE"); assert.equal(h.settled[0].tools[0].messageId, "tool-message");
  assert.deepEqual(h.settled[0].tools[0].output, { n: 99, accuracy: 1 });
});
it("explicit tool error metadata overrides an inconsistent success label without rewriting the returned bytes", () => {
  let run = reduceRun(newRun("q", "stable"), { type: "TOOL_CALL_RESULT", toolCallId: "error", is_error: true,
    content: JSON.stringify({ tool: "get_axis", label: "MEASURED", output: { n: 1 } }) });
  run = reduceRun(run, { type: "RUN_FINISHED", result: { grounded: true } });
  assert.equal(run.status, "error"); assert.equal(run.tools[0].label, "MEASURED"); assert.deepEqual(run.tools[0].output, { n: 1 });
});

it("mount setup/cleanup/setup replay retains the accepted first lazy-pane request, then a real unmount stops it", async () => {
  const h = harness();
  const setup = createTalkLifecycle(() => h.runner.stop());
  const request: AskRequest = { text: "first pane question", n: 1 };
  const pending = { current: null as AskRequest | null };
  let seen: number | null = null;
  const questionEffect = () => {
    if (request.n !== seen) { seen = request.n; pending.current = request; }
    takeAskRequest(pending, { ask: (q: string) => h.runner.start(q) } as any);
  };
  const cleanup = setup(); questionEffect(); cleanup();
  const actualUnmount = setup(); questionEffect();
  await tick();
  assert.equal(h.calls.length, 1); assert.equal(h.questions(), 1); assert.equal(h.runner.isBusy(), true);
  assert.equal(h.updates.some((run) => run.status === "cancelled"), false);
  actualUnmount(); await tick();
  assert.equal(h.runner.isBusy(), false); assert.equal(h.updates.at(-1)?.status, "cancelled");
});
it("explicit watch requests wake an already-enabled watcher and retain the request while its runner is busy", () => {
  let wake = 0; const queued = createWatchRequests(() => wake++);
  const run = newRun("show this", "watch");
  queued.queue(run); assert.equal(wake, 1); assert.equal(queued.hasPending(), true);
  assert.equal(queued.take({ retryWithWatch: () => false, isBusy: () => true } as any), false); assert.equal(queued.hasPending(), true);
  assert.equal(queued.take({ retryWithWatch: () => true, isBusy: () => false } as any), true); assert.equal(queued.hasPending(), false);
  assert.equal(queued.take({ retryWithWatch: () => assert.fail("already taken") } as any), false);
});
it("an accepted watch retry consumes its original consent button and rejects later stale clicks", async () => {
  const h = harness(); h.runner.start("show this"); await tick();
  h.event({ type: "CUSTOM", name: "consent_required", value: { intent: "show", steps: 1 } });
  h.event({ type: "RUN_FINISHED", result: {} }); h.pending[0].resolve(); await tick();
  const original = h.settled[0];
  assert.equal(h.runner.retryWithWatch(original), true); await tick();
  h.event({ type: "RUN_FINISHED", result: {} }, 1); h.pending[1].resolve(); await tick();
  assert.equal(h.runner.retryWithWatch(original), false); assert.equal(h.calls.length, 2);
});
it("a failed lazy import records one error under the accepted origin and releases its reservation", () => {
  const seen: TalkRun[] = []; const queued: AskRequest[] = [];
  const host = createAskRequests(() => {}, (request) => queued.push(request));
  const origin = { threadId: "original", userMessageId: "question" };
  const first: AskOpenDetail = { question: "kept question", origin, onUpdate: (run) => seen.push(run) };
  host.receive(first); assert.equal(first.accepted, true);
  assert.equal(host.failed("chunk unavailable"), true); assert.equal(host.failed("again"), false);
  assert.equal(seen.length, 1); assert.equal(seen[0].status, "error"); assert.equal(seen[0].origin, origin);
  const next: AskOpenDetail = { question: "new request" }; host.receive(next); assert.equal(next.accepted, true);
  assert.equal(queued.length, 2); assert.notEqual(queued[0].n, queued[1].n);
});
it("cancelling a lazy request records no provider result and frees the host for a new question", () => {
  const seen: TalkRun[] = [];
  const host = createAskRequests(() => {}, () => {});
  host.receive({ question: "cancel me", onUpdate: (run) => seen.push(run) });
  assert.equal(host.cancelPending(), true); assert.equal(host.cancelPending(), false);
  assert.equal(seen.length, 1); assert.equal(seen[0].status, "cancelled"); assert.deepEqual(seen[0].tools, []);
  const next: AskOpenDetail = { question: "next" }; host.receive(next); assert.equal(next.accepted, true);
});
it("send completion cannot erase a same-text draft typed after its acceptance", () => {
  let draft = "same question"; let acknowledgements = 0;
  const accepted = onceAccepted(() => { acknowledgements++; draft = ""; });
  accepted(); assert.equal(draft, "");
  draft = "same question"; accepted();
  assert.equal(draft, "same question"); assert.equal(acknowledgements, 1);
});
it("Confirm keeps the original page but does not resend a watch permission that the viewer revoked", async () => {
  let watch = true; let page = { path: "/original", subject: "original.example" } as any;
  const calls: StreamOptions[] = []; const runs: TalkRun[] = [];
  const runner = createTalkSession(() => ({
    streamOptions: () => ({ page, watch, declareUi: true }), onUpdate: (run) => runs.push(run),
    stream: async (o) => {
      calls.push(o);
      if (calls.length === 1) o.onEvent({ type: "CUSTOM", name: "confirm_required", value: { tools: [{ tool: "paid", args: {} }] } });
      o.onEvent({ type: "RUN_FINISHED", result: calls.length === 1 ? { awaiting_confirmation: true } : {} });
    },
  }));
  runner.start("this server"); await tick(); const original = runs.at(-1)!;
  page = { path: "/new", subject: "new.example" }; watch = false;
  assert.equal(runner.confirm(original), true); await tick();
  assert.equal(calls[1].page?.subject, "original.example"); assert.equal(calls[1].watch, false);
});
it("a late RUN_FINISHED cannot replace a prior RUN_ERROR with success", () => {
  let run = reduceRun(newRun("q", "stable"), { type: "RUN_ERROR", message: "source unavailable" });
  run = reduceRun(run, { type: "RUN_FINISHED", result: { grounded: true } });
  assert.equal(run.status, "error"); assert.equal(run.error, "source unavailable");
});
it("ordinary INVALID and UNCHECKABLE verification records remain returned results rather than transport failures", () => {
  for (const label of ["INVALID", "UNCHECKABLE"]) {
    let run = reduceRun(newRun("verify", label), { type: "TOOL_CALL_RESULT", toolCallId: label,
      content: JSON.stringify({ tool: "verify_card", label, output: { state: label } }) });
    run = reduceRun(run, { type: "RUN_FINISHED", result: { grounded: false } });
    assert.equal(run.status, "done"); assert.equal(run.tools[0].label, label);
  }
});

it("My results records a failed lookup as ERROR despite an inconsistent MEASURED tool label", () => {
  const row = lookupFromRun("subject", { question: "q", status: "error", tools: [
    { label: "MEASURED", isError: true, output: { n: 5 }, citation: { record_id: "unverified" } },
  ] });
  assert.equal(row.state, "ERROR"); assert.equal(row.question, "q"); assert.equal(row.ref, "unverified");
});
it("My results preserves actual UNREACHABLE and ordinary INVALID/UNCHECKABLE source states", () => {
  for (const label of ["UNREACHABLE", "INVALID", "UNCHECKABLE"])
    assert.equal(lookupFromRun("subject", { question: "q", tools: [{ label }] }).state, label);
});

it("a duplicate old watch retry leaves no stuck queue after the owning runner becomes idle", async () => {
  const h = harness(); h.runner.start("show this"); await tick();
  h.event({ type: "CUSTOM", name: "consent_required", value: { intent: "show", steps: 1 } });
  h.event({ type: "RUN_FINISHED", result: {} }); h.pending[0].resolve(); await tick();
  const original = h.settled[0]; const queued = createWatchRequests(() => {});
  queued.queue(original); assert.equal(queued.take(h.runner as any), true); await tick();
  queued.queue(original); assert.equal(queued.take(h.runner as any), false);
  assert.equal(queued.hasPending(), true);
  h.event({ type: "RUN_FINISHED", result: {} }, 1); h.pending[1].resolve(); await tick();
  assert.equal(queued.take(h.runner as any), false); assert.equal(queued.hasPending(), false);
  assert.equal(h.calls.length, 2);
});

it("ordinary verification wayfinding offers the Verify page without a provider call or invented server IDs", async () => {
  for (const question of ["where can I verify a card?", "how do I verify a signed card?"]) {
    let calls = 0; const seen: TalkRun[] = [];
    const runner = createTalkSession(() => ({
      origin: () => ({ threadId: "local-history", userMessageId: "local-question" }),
      onUpdate: (run) => seen.push(run), stream: async () => { calls++; },
    }));
    assert.equal(runner.start(question), true); await tick();
    const run = seen.at(-1)!; assert.equal(calls, 0); assert.equal(run.status, "done");
    assert.match(run.text, /\[open Verify\]\(\/dashboard\?tab=verify\)/);
    assert.equal(run.origin?.threadId, "local-history");
    assert.equal(run.runId, undefined); assert.equal(run.threadId, undefined); assert.equal(run.messageId, undefined);
    assert.deepEqual(run.tools, []); assert.equal(run.state.localNavigation, "verify");
  }
});
it("verification wayfinding does not intercept actual card data or a factual source question", () => {
  assert.equal(isVerificationNavigationQuestion('{"question":"how do I verify a card?"}'), false);
  assert.equal(isVerificationNavigationQuestion("verify this signed card"), false);
  assert.equal(isVerificationNavigationQuestion("what does this card measure?"), false);
  assert.equal(isVerificationNavigationQuestion("how many signed cards can I verify?"), false);
  assert.equal(isVerificationNavigationQuestion("where can I check the signed card count?"), false);
  assert.equal(isVerificationNavigationQuestion("how do I verify a signed card https://councilof.ai/cards/example.json?"), false);
  assert.equal(isVerificationNavigationQuestion("how do I verify card:actual-id?"), false);
  assert.equal(isVerificationNavigationQuestion("how do I verify this card record_id=actual-id?"), false);
  assert.equal(isVerificationNavigationQuestion("how do I verify card " + "a".repeat(64) + "?"), false);
});
it("a page plan uses prepared language without promoting backend text or transport finish to movement", () => {
  const reply = plannedPageReply(2);
  assert.match(reply, /2 page steps prepared/); assert.match(reply, /does not establish that the page moved/);
  assert.doesNotMatch(reply, /I moved|successfully|completed|has moved/);
});
