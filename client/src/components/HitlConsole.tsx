import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * The human-in-the-loop console.
 *
 * ONE component, mounted on /team AND in the Council OS staff pane, for the same reason
 * PalAskPanel is one component: two surfaces that each carry their own copy of "how does a
 * human decide here" is how a page and a door end up describing different behaviour.
 *
 * WHAT IT DOES, IN THE ORDER A HUMAN DOES IT
 *
 *   1. IT SHOWS THE GATE STATE HONESTLY. Whether a decision can be taken at all (an operator
 *      token is configured), whether a decision would be signed (the board key is present),
 *      and whether decisions are persisted (a store is bound). When the decision path is
 *      locked the console says so, and says that it is locked ON PURPOSE — a public endpoint
 *      that accepts an approval from anyone is not a human in the loop.
 *
 *   2. IT SHOWS THE CHALLENGE. What was proposed, by whom, about which axis, and what the
 *      published records said at the moment it was raised. A human decides on the record, not
 *      on a summary of a summary.
 *
 *   3. IT MAKES THE HUMAN READ THE RECORD. The competency module is derived from the live
 *      board, so it cannot be stale. The answer is checked against the live record — at the
 *      moment it is answered AND again at the moment the decision is signed.
 *
 *   4. IT TAKES THE DECISION. APPROVED, HOLD or REJECTED. Nothing else. The result is a signed
 *      receipt, or an honestly unsigned one, and the console says which it is and how to
 *      verify it.
 *
 * THE TOKEN IS NEVER STORED. It lives in this component's state for the length of the
 * interaction and is sent as a header, because a body gets logged and a localStorage entry
 * outlives the session by years.
 */

export type HitlChallengeView = {
  id: string;
  axis: string | null;
  subject: string;
  proposed_action: string;
  raised_by: string;
  at: string;
  source?: string | null;
  facts?: string | null;
  required_module?: string | null;
};

export type HitlModuleView = {
  id: string;
  axis: string;
  title: string;
  briefing: string;
  question: string;
  options: { id: string; text: string }[];
  completed?: boolean;
};

export type HitlSnapshot = {
  schema: string;
  policy: string;
  one_line?: string;
  statutory_basis?: string;
  decisions: string[];
  review_queue_summary?: Record<string, number>;
  store_bound?: boolean;
  decision_path?: "open" | "locked";
  decision_path_note?: string;
  signing_key_configured?: boolean;
  signature_did?: string | null;
  modules?: HitlModuleView[];
  completed_modules?: string[];
  module_count?: number;
};

const DECISIONS = ["APPROVED", "HOLD", "REJECTED"] as const;

export default function HitlConsole({
  challenge: incoming,
  onReceipt,
}: {
  challenge?: HitlChallengeView | null;
  onReceipt?: (receipt: unknown) => void;
}) {
  const [snap, setSnap] = useState<HitlSnapshot | null>(null);
  const [queued, setQueued] = useState<HitlChallengeView[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [moduleResult, setModuleResult] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [operator, setOperator] = useState("");
  const [note, setNote] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/hitl");
      if (r.ok) setSnap((await r.json()) as HitlSnapshot);
    } catch {
      /* an unreachable surface must not pretend there is nothing to decide; the gates below
         still say what this deployment can and cannot do */
    }
    try {
      const r = await fetch("/api/hitl/challenges");
      if (r.ok) {
        const j = await r.json();
        setQueued(Array.isArray(j?.challenges) ? j.challenges : []);
      }
    } catch {
      /* no queue is reachable */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = incoming ?? queued.find((c) => c.state === "PENDING") ?? null;

  // The module for the axis under review. It comes from the live board, never from a copy.
  const module: HitlModuleView | null = useMemo(() => {
    const mods = snap?.modules ?? [];
    if (!mods.length) return null;
    if (pending?.required_module) {
      const exact = mods.find((m) => m.id === pending.required_module);
      if (exact) return exact;
    }
    if (pending?.axis) {
      const byAxis = mods.find((m) => m.axis === pending.axis);
      if (byAxis) return byAxis;
    }
    return mods[0] ?? null;
  }, [snap, pending]);

  const locked = snap?.decision_path === "locked";

  async function submitModule() {
    if (!module || !picked) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/hitl/modules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ module_id: module.id, answer: picked }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(String(j?.reason ?? j?.error ?? "The module could not be checked."));
        return;
      }
      setModuleResult({ correct: Boolean(j.correct), explanation: j.explanation });
    } catch {
      setError("The competence check could not be reached, so the decision stays open.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: string) {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/hitl/decision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token.trim() ? { "x-hitl-token": token.trim() } : {}),
        },
        body: JSON.stringify({
          challenge: pending,
          decision,
          operator: operator.trim(),
          note: note.trim(),
          module_id: module?.id ?? "",
          answer: picked ?? "",
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(
          j?.reason ??
            j?.why ??
            j?.error ??
            "The decision was not recorded. Nothing was changed.",
        );
        return;
      }
      setReceipt(j?.receipt ?? null);
      onReceipt?.(j?.receipt ?? null);
      void load();
    } catch {
      setError("The decision could not be sent, so nothing was recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-testid="hitl-console" className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-amber-50">Human in the loop</h2>
        <span data-testid="hitl-policy" className="rounded-full border border-amber-400/50 px-2 py-0.5 text-[11px] text-amber-200">
          {snap?.policy ?? "Measurement and Human-in-the-Loop Oversight — Never Certification"}
        </span>
      </div>
      <p className="mb-4 text-sm text-amber-100/80">
        A measurement says what was observed. It never says what should happen. The acts — publish, release, send,
        approve — wait for a competent, named human.
      </p>

      {/* 1. THE GATE STATE, HONESTLY. */}
      <div className="mb-5 grid gap-2 text-[12px] sm:grid-cols-3">
        <div
          data-testid="hitl-gate-decision"
          className={`rounded-xl border px-3 py-2 ${
            locked ? "border-rose-400/40 bg-rose-500/10 text-rose-100" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          <span className="block font-semibold">Decision path</span>
          {locked ? "locked — no operator token" : "open — an operator token is required"}
        </div>
        <div
          data-testid="hitl-gate-signing"
          className="rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sky-100"
        >
          <span className="block font-semibold">Receipt signature</span>
          {snap?.signing_key_configured
            ? `signed under ${snap?.signature_did ?? "the board attestation key"}`
            : "unsigned — no board signing key on this deployment"}
        </div>
        <div
          data-testid="hitl-gate-store"
          className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-emerald-100"
        >
          <span className="block font-semibold">Decision ledger</span>
          {snap?.store_bound ? "persisted" : "not persisted — no store bound"}
        </div>
      </div>

      {locked ? (
        <p role="note" data-testid="hitl-locked-note" className="mb-5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-100">
          No decision can be taken on this deployment until an operator token is configured. That is deliberate: an
          approval endpoint anyone can call is not a human in the loop. Everything else here — the record, the
          curriculum, the challenge — works without it.
        </p>
      ) : null}

      {/* 2. THE CHALLENGE. */}
      <div className="mb-5 rounded-xl border border-amber-400/30 bg-black/20 p-4">
        <h3 className="mb-2 text-sm font-semibold text-amber-50">Under review</h3>
        {pending ? (
          <div data-testid="hitl-challenge">
            <p className="text-sm text-amber-50/90">
              <span className="font-semibold">{pending.subject}</span>
              {pending.axis ? <span className="ml-2 text-[12px] text-amber-100/70">axis: {pending.axis}</span> : null}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] text-amber-100/85">{pending.proposed_action}</p>
            <p className="mt-2 text-[11px] text-amber-100/60">
              raised by {pending.raised_by} · {pending.at} · challenge {pending.id}
            </p>
            {pending.facts ? (
              <p className="mt-2 rounded-lg border border-emerald-400/25 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-100/85">
                {pending.facts}
              </p>
            ) : null}
          </div>
        ) : (
          <p data-testid="hitl-no-challenge" className="text-[13px] text-amber-100/70">
            Nothing is waiting for a human. Ask a staff member to publish, release, send or approve something, and it
            raises a challenge here instead of doing it.
          </p>
        )}
      </div>

      {/* 3. THE COMPETENCY MODULE. */}
      {module ? (
        <div className="mb-5 rounded-xl border border-sky-400/30 bg-sky-500/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-sky-50">
            Competency — read the record <span className="font-normal text-sky-100/60">({module.id})</span>
          </h3>
          <p className="mb-3 whitespace-pre-wrap text-[12px] text-sky-100/80">{module.briefing}</p>
          <p data-testid="hitl-module-question" className="mb-3 text-[13px] text-sky-50">
            {module.question}
          </p>
          <div className="mb-3 space-y-1">
            {module.options.map((o) => (
              <label
                key={o.id}
                data-testid={`hitl-option-${o.id}`}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-sky-400/20 bg-black/20 px-3 py-2 text-[13px] text-sky-50/90"
              >
                <input
                  type="radio"
                  name="hitl-module-answer"
                  value={o.id}
                  checked={picked === o.id}
                  onChange={() => {
                    setPicked(o.id);
                    setModuleResult(null);
                  }}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">{o.id}.</span> {o.text}
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            data-testid="hitl-submit-module"
            disabled={busy || !picked}
            onClick={() => void submitModule()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Checking…" : "Check my answer against the record"}
          </button>
          {moduleResult ? (
            <p
              data-testid="hitl-module-result"
              className={`mt-3 text-[13px] ${moduleResult.correct ? "text-emerald-200" : "text-rose-200"}`}
            >
              {moduleResult.correct
                ? `Correct. ${moduleResult.explanation ?? ""}`
                : `Not correct. ${moduleResult.explanation ?? "The record says otherwise."}`}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* 4. THE DECISION. */}
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-emerald-50">Decision</h3>
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[12px] text-emerald-100/80">
            Operator name
            <input
              data-testid="hitl-operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="who is deciding"
              className="mt-1 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-50"
            />
          </label>
          <label className="text-[12px] text-emerald-100/80">
            Operator token
            <input
              data-testid="hitl-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="never stored"
              className="mt-1 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-50"
            />
          </label>
        </div>
        <label className="mb-3 block text-[12px] text-emerald-100/80">
          Note
          <textarea
            data-testid="hitl-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-50"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d}
              type="button"
              data-testid={`hitl-decide-${d}`}
              disabled={busy || locked || !pending}
              onClick={() => void decide(d)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                d === "APPROVED"
                  ? "bg-emerald-600"
                  : d === "HOLD"
                    ? "bg-amber-600"
                    : "bg-rose-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {!pending ? (
          <p className="mt-2 text-[12px] text-emerald-100/60">There is no challenge to decide, so there is nothing to sign.</p>
        ) : null}
        {error ? (
          <p data-testid="hitl-error" className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-100">
            {error}
          </p>
        ) : null}
        {receipt ? (
          <div data-testid="hitl-receipt" className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-50">
            <p className="font-semibold">
              {receipt.decision} · {receipt.axis} · {receipt.at}
            </p>
            <p className="mt-1 text-[12px] text-emerald-100/85">{receipt.note}</p>
            <p className="mt-1 text-[12px] text-emerald-100/70">
              {receipt.signature?.value_hex
                ? `Signed under ${receipt.signature.did}. sha256 ${receipt.signature.sha256}`
                : `UNSIGNED: ${receipt.signature?.unsigned_reason ?? "no signing key"}`}
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-[11px] text-amber-100/55">
        The receipt schema is csoai.hitl-oversight-receipt/0.1 and the decision vocabulary is APPROVED, HOLD,
        REJECTED — the same ones the MEOK H.I.M. uses. A machine signature proves the bytes came from this
        deployment; it never proves the human was right, and it never certifies anything.
      </p>
    </section>
  );
}
