import type { AskOpenDetail, AskRequest } from "../components/ask/askBus";
import type { TalkPanelHandle } from "../components/talk/TalkPanel";

/** The host reserves one question while its lazy pane loads; declined requests are never queued. */
export function createAskRequests(open: () => void, question: (request: AskRequest) => void) {
  let runner: TalkPanelHandle | null = null;
  let reserved = false;
  let sequence = 0;
  let pending: AskRequest | null = null;
  const endPending = (status: "error" | "cancelled", reason?: string) => {
    const request = pending;
    if (!reserved || !request) return false;
    reserved = false;
    pending = null;
    request.onUpdate?.({
      id: `ask-load-${request.n}`, question: request.text, origin: request.origin,
      status, error: reason, tools: [], text: "", confirm: null, ui: [], state: {}, consentRequired: null,
    });
    return true;
  };
  const busy = () => reserved || Boolean(runner?.isBusy());
  return {
    attach: (handle: TalkPanelHandle | null) => { runner = handle; },
    taken: () => { reserved = false; pending = null; },
    failed: (reason: string) => endPending("error", `the Ask panel could not open (${reason})`),
    cancelPending: () => endPending("cancelled"),
    receive: (detail: AskOpenDetail) => {
      detail.accepted = false;
      if (detail.action === "busy") { detail.accepted = busy(); return; }
      if (detail.action) {
        if (!runner || !detail.run) return;
        detail.accepted = detail.action === "stop" && typeof detail.run === "string"
          ? runner.stop(detail.run)
          : typeof detail.run === "object" && detail.action !== "stop"
            ? runner[detail.action](detail.run) : false;
        if (detail.accepted) open();
        return;
      }
      if (!detail.question?.trim()) { open(); detail.accepted = true; return; }
      if (busy()) return;
      reserved = true;
      detail.accepted = true;
      open();
      pending = { text: detail.question, n: ++sequence, origin: detail.origin, onUpdate: detail.onUpdate };
      question(pending);
    },
  };
}

/** A refused imperative send stays queued until the caller retries after the runner becomes idle. */
export function takeAskRequest(pending: { current: AskRequest | null }, runner: TalkPanelHandle | null): boolean {
  const request = pending.current;
  if (!request || !runner?.ask(request.text, { origin: request.origin, onUpdate: request.onUpdate })) return false;
  pending.current = null;
  return true;
}

export function takeWatchRequest(pending: { current: import("./aguiTalk").TalkRun | null }, runner: TalkPanelHandle | null): boolean {
  if (!pending.current || !runner) return false;
  const accepted = runner.retryWithWatch(pending.current);
  // An idle rejection is stale; only a busy runner can make a retry useful later.
  if (accepted || !runner.isBusy()) pending.current = null;
  return accepted;
}

/** One accepted submission clears its draft once, even when send later acknowledges completion. */
export function onceAccepted(accept: () => void) {
  let accepted = false;
  return () => {
    if (accepted) return;
    accepted = true;
    accept();
  };
}

/** An explicit request wakes the effect even when watch consent was already switched on. */
export function createWatchRequests(onQueued: () => void) {
  const pending: { current: import("./aguiTalk").TalkRun | null } = { current: null };
  return {
    queue: (run: import("./aguiTalk").TalkRun) => { pending.current = run; onQueued(); },
    hasPending: () => pending.current !== null,
    take: (runner: TalkPanelHandle | null) => takeWatchRequest(pending, runner),
  };
}
