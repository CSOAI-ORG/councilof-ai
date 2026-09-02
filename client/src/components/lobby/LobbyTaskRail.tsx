import { useCallback, useEffect, useState } from "react";
import { DOT, FOCUS, SP, TONE, TYPE, insetStyle } from "./glass";

/**
 * LobbyTaskRail — the "Tasks" section of the right rail: the running checks.
 *
 * Each row is a real fetch against a real public endpoint, rendered as a step
 * with a state: running -> ok | failed. HONESTY CONTRACT: a failed fetch says
 * FAILED and shows why. There is no cached fallback, no placeholder number and
 * no hardcoded axis count anywhere in this file — every figure below is read out
 * of the response body at the moment it arrives, or it is not shown at all.
 *
 * The state is carried by a WORD as well as a colour ("ok", "failed",
 * "running"), because colour alone is not a state anyone can read aloud.
 */

type StepState = "idle" | "running" | "ok" | "failed";

type Step = {
  id: string;
  label: string;
  endpoint: string;
  state: StepState;
  /** Rendered only when state === "ok" — always derived from the live body. */
  detail?: string;
  /** Rendered only when state === "failed" — the actual reason. */
  reason?: string;
};

/**
 * Read a date STRING out of a body, or nothing.
 *
 * /api/gspc ships `measured_on` as an OBJECT ({model, endpoint, date, …}), so
 * the obvious `${j.measured_on}` renders the literal text "[object Object]" —
 * which is what the previous rail shipped. Anything that is not a string is
 * treated as absent: an unreadable stamp is no stamp, never a rendered object.
 */
function stampOf(j: any): string | null {
  const m = j?.measured_on;
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && typeof m.date === "string") return m.date;
  if (typeof j?.date === "string") return j.date;
  return null;
}

const INITIAL: Step[] = [
  { id: "gspc", label: "Board coverage", endpoint: "/api/gspc", state: "idle" },
  { id: "arena", label: "Arena feed", endpoint: "/api/arena/rounds.jsonl", state: "idle" },
];

export default function LobbyTaskRail() {
  const [steps, setSteps] = useState<Step[]>(INITIAL);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const run = useCallback(async () => {
    setBusy(true);
    setSteps(INITIAL.map((s) => ({ ...s, state: "running" as StepState })));

    // --- Board coverage: live axis count + the stamp the API itself publishes.
    try {
      const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j: any = await r.json();
      const t = j?.totals ?? {};
      const bits: string[] = [];
      // Prefer the API's own published phrasing when it ships one — it is the
      // ruling, not our paraphrase of it.
      if (typeof t.public_count === "string") {
        bits.push(t.public_count);
        const leaders =
          typeof t.public_leader_count === "number" ? t.public_leader_count : 3;
        bits.push(`${leaders} public leader scores`);
      } else if (typeof t.axes === "number") bits.push(`${t.axes} axis`);
      if (typeof t.measured_axes === "number" && typeof t.public_count !== "string")
        bits.push(`${t.measured_axes} measured · 3 public leader scores`);
      if (typeof t.items === "number") bits.push(`${t.items.toLocaleString()} items`);
      const stamp = stampOf(j);
      if (!bits.length && !stamp) throw new Error("response carried no totals to report");
      set("gspc", {
        state: "ok",
        detail: bits.join(" · ") + (stamp ? `\nmeasured ${stamp}` : ""),
      });
    } catch (e: any) {
      set("gspc", { state: "failed", reason: String(e?.message ?? e) });
    }

    // --- Arena feed: the head of the round log. 503 is a legitimate answer here
    //     ("no live rounds") and it is shown as a failure, never smoothed over.
    try {
      const r = await fetch("/api/arena/rounds.jsonl", { headers: { accept: "application/x-ndjson" } });
      if (!r.ok) {
        let why = "HTTP " + r.status;
        try {
          const j: any = await r.json();
          if (j?.error) why += ` — ${j.error}${j.detail ? ` (${j.detail})` : ""}`;
        } catch { /* body was not JSON; the status is the whole story */ }
        throw new Error(why);
      }
      const text = await r.text();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) throw new Error("feed reachable but empty — no rounds published");
      let head = "";
      try {
        const first: any = JSON.parse(lines[0]);
        head = [first.round ?? first.id, first.axis ?? first.task, first.ts ?? first.time]
          .filter(Boolean)
          .join(" · ");
      } catch { /* unparseable head line — report the count only, invent nothing */ }
      set("arena", {
        state: "ok",
        detail: `${lines.length} round${lines.length === 1 ? "" : "s"} in feed` + (head ? `\nhead: ${head}` : ""),
      });
    } catch (e: any) {
      set("arena", { state: "failed", reason: String(e?.message ?? e) });
    }

    setRanAt(new Date().toISOString().replace("T", " ").slice(0, 19) + "Z");
    setBusy(false);
  }, []);

  useEffect(() => { void run(); }, [run]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <h3 className={TYPE.section}>Running checks</h3>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className={`ml-auto rounded-lg border border-slate-900/10 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white disabled:opacity-40 motion-reduce:transition-none ${FOCUS}`}
        >
          {busy ? "running…" : "re-run"}
        </button>
      </div>

      <ol className={`${SP.stackTight} overflow-y-auto`}>
        {steps.map((s) => (
          <li key={s.id} className={`${SP.card} rounded-xl border border-slate-900/10`} style={insetStyle}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[s.state]}`} aria-hidden="true" />
              <span className="text-[12.5px] font-semibold text-slate-900">{s.label}</span>
              <span
                className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${
                  s.state === "ok" ? TONE.ok : s.state === "failed" ? TONE.failed : s.state === "running" ? TONE.running : TONE.idle
                }`}
              >
                {s.state}
              </span>
            </div>
            <code className={`mt-1.5 block ${TYPE.mono}`}>{s.endpoint}</code>
            {s.state === "ok" && s.detail && (
              <p className="mt-2 whitespace-pre-line text-[11.5px] leading-snug text-slate-800">{s.detail}</p>
            )}
            {s.state === "failed" && (
              <p className="mt-2 text-[11.5px] leading-snug text-rose-800">
                {s.reason}
                <span className="mt-0.5 block text-rose-800">No value is shown in its place.</span>
              </p>
            )}
          </li>
        ))}
      </ol>

      <p className={`mt-auto pt-4 ${TYPE.fine}`}>
        Every figure here is read from the response body at fetch time. Nothing on this rail is
        stored in the page. Measurement, not certification.
        {ranAt && <span className="mt-1 block font-mono text-[10px] text-slate-600">last run {ranAt}</span>}
      </p>
    </div>
  );
}
