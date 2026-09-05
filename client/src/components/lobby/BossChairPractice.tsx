import { useReducer } from "react";
import { RotateCcw, ShieldQuestion } from "lucide-react";
import {
  BOSS_CHAIR_SCENARIOS,
  bossChairReducer,
  bossChairScore,
  createBossChairState,
  currentBossChairAnswer,
  currentBossChairScenario,
  type BossChairDecision,
  type BossChairState,
} from "./bossChairModel";

function DecisionButton({
  decision,
  selected,
  disabled,
  onChoose,
}: {
  decision: BossChairDecision;
  selected: boolean;
  disabled: boolean;
  onChoose: (decision: BossChairDecision) => void;
}) {
  const escalate = decision === "escalate";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onChoose(decision)}
      className={
        "min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-default " +
        (selected
          ? escalate
            ? "border-amber-700 bg-amber-100 text-amber-950"
            : "border-emerald-700 bg-emerald-100 text-emerald-950"
          : "border-slate-300 bg-white text-slate-900 hover:border-amber-600 disabled:opacity-55")
      }
    >
      <span className="block">
        {escalate ? "Escalate for human approval" : "Resolve within bounds"}
      </span>
      <span className="mt-1 block text-xs font-normal text-slate-600">
        {escalate
          ? "Pause the action and put the decision in front of a person."
          : "Continue autonomously inside the agreed, reversible scope."}
      </span>
    </button>
  );
}

export default function BossChairPractice({
  initialState = createBossChairState(),
}: {
  initialState?: BossChairState;
}) {
  const [state, dispatch] = useReducer(bossChairReducer, initialState);
  const scenario = currentBossChairScenario(state);
  const answer = currentBossChairAnswer(state);
  const score = bossChairScore(state);

  if (state.phase === "complete") {
    return (
      <section
        aria-labelledby="boss-chair-result-title"
        className="rounded-3xl border border-amber-700/30 bg-white p-6 shadow-sm sm:p-8"
        data-testid="boss-chair-practice"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
          Deterministic browser practice · complete
        </p>
        <h2
          id="boss-chair-result-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
        >
          You kept {score} of {BOSS_CHAIR_SCENARIOS.length} decisions inside the
          boundary.
        </h2>
        <p role="status" className="mt-3 text-sm leading-relaxed text-slate-700">
          Review the rule: escalate spend, destructive actions, production
          changes and material scope changes. Resolve routine, reversible,
          in-scope work.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "retry" })}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry all scenarios
        </button>
        <p className="mt-5 text-xs leading-relaxed text-slate-600">
          Practice result only. Your choices were not submitted or persisted by
          this practice, no model was called by it, and no GSPC measurement,
          signature, anchor or OpenTimestamps proof was created.
        </p>
      </section>
    );
  }

  if (!scenario) return null;
  const last = state.roundIndex === BOSS_CHAIR_SCENARIOS.length - 1;

  return (
    <section
      aria-labelledby="boss-chair-title"
      className="overflow-hidden rounded-3xl border border-amber-700/30 bg-white shadow-sm"
      data-testid="boss-chair-practice"
    >
      <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative min-h-56 overflow-hidden bg-slate-950">
          <img
            src="/images/coliseum_logic_duel.jpg"
            alt="A human and an AI facing each other across a chessboard in the arena"
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="relative flex min-h-56 flex-col justify-end p-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
              Deterministic browser practice
            </p>
            <h2
              id="boss-chair-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              The Boss&apos;s Chair
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-200">
              Keep routine work moving. Stop consequential decisions for a
              human.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-600">
              Scenario {state.roundIndex + 1} of {BOSS_CHAIR_SCENARIOS.length}
            </p>
            <span className="rounded-full border border-amber-700/25 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              local only
            </span>
          </div>
          <progress
            aria-label="Practice progress"
            className="mt-3 h-2 w-full accent-amber-700"
            max={BOSS_CHAIR_SCENARIOS.length}
            value={state.roundIndex + (answer ? 1 : 0)}
          />

          <div className="mt-6 flex items-start gap-3">
            <ShieldQuestion
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <div>
              <p className="text-lg font-semibold leading-snug text-slate-950">
                {scenario.request}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {scenario.detail}
              </p>
            </div>
          </div>

          <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Choose how to handle this request</legend>
            <DecisionButton
              decision="resolve"
              selected={answer?.decision === "resolve"}
              disabled={Boolean(answer)}
              onChoose={(decision) => dispatch({ type: "answer", decision })}
            />
            <DecisionButton
              decision="escalate"
              selected={answer?.decision === "escalate"}
              disabled={Boolean(answer)}
              onChoose={(decision) => dispatch({ type: "answer", decision })}
            />
          </fieldset>

          {answer ? (
            <div
              role={answer.correct ? "status" : "alert"}
              aria-live="polite"
              className={
                "mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed " +
                (answer.correct
                  ? "border-emerald-700/25 bg-emerald-50 text-emerald-950"
                  : "border-rose-700/25 bg-rose-50 text-rose-950")
              }
            >
              <strong>{answer.correct ? "Correct." : "Not quite."}</strong>{" "}
              {scenario.explanation}
            </div>
          ) : (
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Choose one response. The explanation appears before you continue.
            </p>
          )}

          <button
            type="button"
            disabled={!answer}
            onClick={() => dispatch({ type: "next" })}
            className="mt-5 min-h-11 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {last ? "See practice result" : "Next scenario"}
          </button>

          <p className="mt-5 text-xs leading-relaxed text-slate-600">
            This is a fixed decision simulation, not a live AI opponent. Your
            choices are not submitted or persisted by this practice, and the
            result is not evidence, certification or training data.
          </p>
        </div>
      </div>
    </section>
  );
}
