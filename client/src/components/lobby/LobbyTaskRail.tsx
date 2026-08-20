import { useCallback, useEffect, useState } from "react";

/**
 * LobbyTaskRail — the right rail of the Council Lobby.
 *
 * Each row is a real fetch against a real public endpoint, rendered as a step
 * with a state: running -> ok | failed. HONESTY CONTRACT: a failed fetch says
 * FAILED and shows why. There is no cached fallback, no placeholder number and
 * no hardcoded axis count anywhere in this file — every figure below is read
 * out of the response body at the moment it arrives, or it is not shown at all.
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

const INITIAL: Step[] = [
  { id: "gspc", label: "Board coverage", endpoint: "/api/gspc", state: "idle" },
  { id: "arena", label: "Arena feed", endpoint: "/api/arena/rounds.jsonl", state: "idle" },
];

const DOT: Record<StepState, string> = {
  idle: "bg-white/25",
  running: "bg-amber-300 animate-pulse",
  ok: "bg-emerald-300",
  failed: "bg-rose-400",
};

const BADGE: Record<StepState, string> = {
  idle: "queued",
  running: "running",
  ok: "ok",
  failed: "failed",
};

export default function LobbyTaskRail({ panel }: { panel: React.CSSProperties }) {
  const [steps, setSteps] = useState<Step[]>(INITIAL);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const run = useCallback(async () => {
    setBusy(true);
    setSteps(INITIAL.map((s) => ({ ...s, state: "running" })));

    // --- Board coverage: live axis count + the stamp the API itself publishes.
    try {
      const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j: any = await r.json();
      const t = j?.totals ?? {};
      const bits: string[] = [];
      // Prefer the API's own published phrasing when it ships one — it is the
      // ruling, not our paraphrase of it.
      if (typeof t.public_count === "string") bits.push(t.public_count);
      else if (typeof t.axes === "number") bits.push(`${t.axes} axes`);
      if (typeof t.measured_axes === "number" && typeof t.public_count !== "string")
        bits.push(`${t.measured_axes} measured`);
      if (typeof t.items === "number") bits.push(`${t.items.toLocaleString()} items`);
      const stamp = j?.measured_on ?? j?.date ?? null;
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
    <div className="flex h-full flex-col rounded-2xl border border-emerald-300/20 p-3" style={panel}>
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[1.4px] text-emerald-100/90">Live status</h3>
        <button
          onClick={() => void run()}
          disabled={busy}
          className="ml-auto rounded-full border border-emerald-300/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-100/80 transition hover:bg-white/10 disabled:opacity-40"
        >
          {busy ? "running…" : "re-run"}
        </button>
      </div>

      <ol className="mt-3 space-y-2.5">
        {steps.map((s) => (
          <li key={s.id} className="rounded-xl border border-white/10 bg-black/15 p-2.5">
            <div className="flex items-center gap-2">
              <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + DOT[s.state]} aria-hidden="true" />
              <span className="text-[12px] font-semibold text-emerald-50">{s.label}</span>
              <span
                className={
                  "ml-auto rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide " +
                  (s.state === "ok"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : s.state === "failed"
                      ? "bg-rose-400/15 text-rose-200"
                      : "bg-white/10 text-emerald-100/70")
                }
              >
                {BADGE[s.state]}
              </span>
            </div>
            <code className="mt-1 block font-mono text-[9.5px] text-emerald-200/50">{s.endpoint}</code>
            {s.state === "ok" && s.detail && (
              <p className="mt-1.5 whitespace-pre-line text-[11px] leading-snug text-emerald-50/85">{s.detail}</p>
            )}
            {s.state === "failed" && (
              <p className="mt-1.5 text-[11px] leading-snug text-rose-200/90">
                {s.reason}
                <span className="mt-0.5 block text-rose-200/60">
                  No value is shown in its place.
                </span>
              </p>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-auto pt-3 text-[10px] leading-relaxed text-emerald-100/45">
        Every figure here is read from the response body at fetch time. Nothing on this rail is
        stored in the page. Measurement, not certification.
        {ranAt && <span className="mt-1 block font-mono text-emerald-200/40">last run {ranAt}</span>}
      </p>
    </div>
  );
}
