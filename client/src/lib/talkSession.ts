import { isVerificationNavigationQuestion, verificationNavigationReply } from "./askNavigation";
import { newRun, reduceRun, streamRun, type StreamOptions, type TalkOrigin, type TalkRun } from "./aguiTalk";

/** One in-memory runner. Views may change; a second send never replaces an active request. */
export type TalkSessionOptions = {
  origin?: (question: string) => TalkOrigin | null;
  canStart?: () => boolean;
  streamOptions?: () => Pick<StreamOptions, "page" | "declareUi" | "watch">;
  onUpdate: (run: TalkRun) => void;
  onSettled?: (run: TalkRun) => void;
  onDone?: (run: TalkRun) => void;
  stream?: typeof streamRun;
  makeId?: () => string;
};

export function createTalkSession(getOptions: () => TalkSessionOptions) {
  const runs = new Map<string, TalkRun>();
  const observers = new Map<string, (run: TalkRun) => void>();
  const contexts = new Map<string, Pick<StreamOptions, "page" | "declareUi" | "watch">>();
  let active: { run: TalkRun; ctl: AbortController; settled: boolean } | null = null;
  let sequence = 0;
  const publish = (run: TalkRun) => {
    runs.set(run.id, run);
    getOptions().onUpdate(run);
    observers.get(run.id)?.(run);
  };
  const start = (question: string, confirmTool?: string[], origin?: TalkOrigin, observer?: (run: TalkRun) => void,
    context?: Pick<StreamOptions, "page" | "declareUi" | "watch">): boolean => {
    const text = question.trim();
    if (!text || active || getOptions().canStart?.() === false) return false;
    const ctl = new AbortController();
    const id = getOptions().makeId?.() ?? `web-run-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2, 10)}`;
    const task = { run: newRun(text, id), ctl, settled: false };
    // Reserve synchronously, before calling a React setter, an origin callback or any await.
    active = task;
    try {
      if (observer) observers.set(id, observer);
      const captured = context ?? getOptions().streamOptions?.() ?? {};
      contexts.set(id, { ...captured, ...(captured.page ? { page: { ...captured.page } } : {}) });
      const bound = origin ?? getOptions().origin?.(text) ?? undefined;
      task.run = {
        ...task.run, runId: id, threadId: bound?.threadId ?? `thread-${id}`,
        userMessageId: bound?.userMessageId ?? `question-${id}`, ...(bound ? { origin: bound } : {}),
      };
    } catch (error) {
      active = null;
      throw error;
    }
    const settle = (run: TalkRun, completed: boolean) => {
      if (task.settled) return;
      task.settled = true;
      if (run.status === "error" || run.status === "cancelled") run = { ...run, tools: run.tools.map((tool) =>
        tool.status === "running" ? { ...tool, status: "cancelled" } : tool) };
      task.run = run;
      if (active === task) active = null;
      publish(run);
      getOptions().onSettled?.(run);
      if (completed && (run.status === "done" || run.status === "awaiting_confirmation"))
        getOptions().onDone?.(run);
    };
    // Install Stop before publishing the first update, whose consumer may stop immediately.
    taskStop = () => {
      if (task.settled) return;
      ctl.abort();
      settle({ ...task.run, status: "cancelled", confirm: null }, false);
    };
    const localNavigation = !confirmTool && isVerificationNavigationQuestion(text);
    if (localNavigation) {
      // These are local history keys; no server run/message identity or result is invented.
      const { threadId: _thread, runId: _run, ...local } = task.run;
      task.run = { ...local, state: { localNavigation: "verify" } };
    }
    publish(task.run);
    const o = getOptions();
    void Promise.resolve().then(() => {
      if (ctl.signal.aborted) return;
      if (localNavigation) {
        task.run = { ...task.run, status: "done", text: verificationNavigationReply };
        return;
      }
      return (o.stream ?? streamRun)({
        question: text, confirmTool, ...contexts.get(id),
        threadId: task.run.threadId, runId: task.run.runId, userMessageId: task.run.userMessageId,
        signal: ctl.signal,
        onEvent: (event) => {
          if (task.settled || ctl.signal.aborted) return;
          task.run = reduceRun(task.run, event);
          publish(task.run);
        },
      });
    }).then(() => {
      if (task.settled) return;
      const run = task.run.status === "streaming"
        ? { ...task.run, status: "error" as const, error: "the stream closed before the run finished" }
        : task.run;
      settle(run, true);
    }).catch((error: unknown) => {
      if (task.settled) return;
      const run = { ...task.run, status: "error" as const, error: `the tools could not be reached (${error instanceof Error ? error.message : String(error)})` };
      settle(run, false);
    });
    return true;
  };
  let taskStop: (() => void) | null = null;
  return {
    isBusy: () => active !== null,
    start,
    stop: (id?: string) => {
      if (!active || (id && active.run.id !== id)) return false;
      taskStop?.();
      return true;
    },
    confirm: (snapshot: TalkRun) => {
      const run = runs.get(snapshot.id);
      if (!run || run.status !== "awaiting_confirmation" || !run.confirm?.tools.length || active) return false;
      const context = contexts.get(run.id);
      const watch = context?.watch === true && getOptions().streamOptions?.().watch === true;
      if (!start(run.question, run.confirm.tools.map((tool) => tool.tool), run.origin, observers.get(run.id), { ...context, watch })) return false;
      publish({ ...run, status: "done", confirm: null });
      return true;
    },
    retryWithWatch: (snapshot: TalkRun) => {
      const run = runs.get(snapshot.id);
      if (!run || !run.consentRequired || active) return false;
      if (!start(run.question, undefined, run.origin, observers.get(run.id), { ...contexts.get(run.id), watch: true, declareUi: true })) return false;
      publish({ ...run, consentRequired: null });
      return true;
    },
    cancel: (snapshot: TalkRun) => {
      const run = runs.get(snapshot.id);
      if (!run || run.status !== "awaiting_confirmation") return false;
      publish({ ...run, status: "cancelled", confirm: null });
      return true;
    },
  };
}

/** React may replay mount effects. Abort only when no replacement setup follows the cleanup. */
export function createTalkLifecycle(onUnmount: () => void) {
  let generation = 0;
  return () => {
    generation++;
    return () => {
      const leaving = ++generation;
      queueMicrotask(() => { if (generation === leaving) onUnmount(); });
    };
  };
}
