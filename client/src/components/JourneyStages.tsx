/**
 * JourneyStages — the case model, and exactly where it stops.
 *
 * WP-3 asks that a missing backend "show the exact unavailable capability" and that nothing
 * ever fakes a completed fix. The estate has been doing the second half by omission — no
 * surface offers approve/fix/retest, so nothing lies — but it was not doing the first half.
 * A reader who reaches the end of what works had no way to learn what comes next, why it is
 * unavailable, or who owns it. "Nothing here" and "this endpoint returns 404 and TUI 1 owns
 * it" are very different answers, and only the second is useful.
 *
 * WHERE THE STATES COME FROM. `capabilities/registry.json`, block `journey_backends`, which
 * records what each endpoint actually returned when it was probed, with the date. It is a
 * dated record, not a live probe, and this component says so on screen rather than implying
 * freshness it does not have. `capabilities/journey-backends.test.mjs` re-probes and fails if
 * any recorded state stops matching runtime, so the record cannot quietly rot.
 *
 * NOTHING HERE IS A CONTROL. There is no button that would 404, no spinner that never
 * resolves, no disabled "Approve" implying it might one day enable in place. A stage that
 * cannot run is described, not offered.
 */
import registry from "../../../capabilities/registry.json";

type Availability = "VERIFIED" | "OWNER_GATED" | "UNAVAILABLE" | string;

type Backend = { availability?: Availability; reason?: string; endpoint?: string };

const BACKENDS: Record<string, Backend> =
  (registry as any)?.journey_backends?.backends ?? {};
const OBSERVED_AT: string = (registry as any)?.journey_backends?.observed_at ?? "";

/**
 * The case model in order, each stage named with the backend it needs.
 * A stage with no backend key is served by surfaces that are already live.
 */
const STAGES: { name: string; backend?: string; note: string }[] = [
  { name: "Ask", note: "The composer on /dashboard. Deterministic local commands; no model in the verdict path." },
  { name: "Scope", note: "Subject and axis, carried into the request surface." },
  { name: "Inspect", backend: "findings", note: "The published measurements for a subject." },
  { name: "Explain", note: "Cohort, sample size, ties and unavailable states, beside every figure." },
  { name: "Propose", backend: "ras", note: "Scoping a remediation against a finding." },
  { name: "Approve", backend: "ras", note: "Binding a human decision to the exact proposed change." },
  { name: "Fix", backend: "remediation", note: "Executing the approved change." },
  { name: "Retest", backend: "remediation", note: "Re-running the instrument against the changed subject." },
  { name: "Receipt", backend: "receipts", note: "A signed record that the change happened." },
  { name: "Monitor", backend: "jobs", note: "Watching the subject for drift after the fix." },
];

const TONE: Record<string, string> = {
  VERIFIED: "border-emerald-700/20 bg-emerald-50 text-emerald-900",
  OWNER_GATED: "border-amber-700/25 bg-amber-50 text-amber-950",
  UNAVAILABLE: "border-red-700/20 bg-red-50 text-red-900",
  LIVE: "border-emerald-700/20 bg-emerald-50 text-emerald-900",
};

function stateOf(stage: { backend?: string }): { label: string; tone: string; b?: Backend } {
  if (!stage.backend) return { label: "LIVE", tone: TONE.LIVE };
  const b = BACKENDS[stage.backend];
  if (!b) return { label: "UNRECORDED", tone: TONE.UNAVAILABLE };
  const a = String(b.availability ?? "UNRECORDED");
  return { label: a === "VERIFIED" ? "LIVE" : a, tone: TONE[a] ?? TONE.UNAVAILABLE, b };
}

export default function JourneyStages() {
  const reachable = STAGES.filter((s) => stateOf(s).label === "LIVE").length;

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5"
      aria-labelledby="journey-stages-title"
    >
      <h2 id="journey-stages-title" className="text-base font-semibold">
        The case model, and where it stops
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {reachable} of {STAGES.length} stages have a backend behind them today. The rest are
        described, not offered — there is no control here that would fail if you pressed it.
        {OBSERVED_AT ? ` States recorded ${OBSERVED_AT.slice(0, 10)} from a probe of each endpoint, not a live check.` : ""}
      </p>

      <ol className="mt-4 space-y-2">
        {STAGES.map((s, i) => {
          const { label, tone, b } = stateOf(s);
          return (
            <li
              key={s.name}
              className={`rounded-lg border p-3 text-sm ${tone}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-mono text-[11px] opacity-60">{i + 1}</span>
                <span className="font-semibold">{s.name}</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide">
                  {label}
                </span>
                {b?.endpoint && (
                  <code className="font-mono text-[11px] opacity-75">{b.endpoint}</code>
                )}
              </div>
              <p className="mt-1 opacity-90">{s.note}</p>
              {label !== "LIVE" && b?.reason && (
                // The exact unavailable capability, in the producer's words, not a paraphrase.
                <p className="mt-1.5 text-[13px] opacity-80">{b.reason}</p>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[13px] text-muted-foreground">
        The stages beyond Explain need the remediation runtime, which another lane owns. Until
        it answers, building an approve-and-fix flow over it would be describing an action this
        estate cannot take.
      </p>
    </section>
  );
}
