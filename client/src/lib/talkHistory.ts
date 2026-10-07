import type { Thread, Turn } from "../components/lobby/useLobbyChat";
import type { TalkRun } from "./aguiTalk";

/** Snapshot a streamed answer in its original in-memory thread, never the currently selected one. */
export function upsertTalkRun(threads: Thread[], run: TalkRun, receivedAt = new Date().toISOString()): Thread[] {
  const origin = run.origin;
  if (!origin) return threads;
  return threads.map((thread) => {
    if (thread.id !== origin.threadId) return thread;
    const question = thread.turns.findIndex((turn) =>
      turn.role === "user" && turn.id === origin.userMessageId);
    // A stale callback cannot create an orphan answer or move it into another thread.
    if (question < 0) return thread;
    const existing = thread.turns.findIndex((turn) => turn.talk?.id === run.id);
    const turn: Turn = {
      id: run.id, replyTo: origin.userMessageId, role: "council", text: run.text,
      at: existing >= 0 ? thread.turns[existing].at : receivedAt, talk: run,
    };
    const turns = [...thread.turns];
    if (existing >= 0) turns[existing] = turn;
    else {
      let after = question;
      while (after + 1 < turns.length && turns[after + 1].replyTo === origin.userMessageId) after++;
      turns.splice(after + 1, 0, turn);
    }
    return { ...thread, turns };
  });
}
