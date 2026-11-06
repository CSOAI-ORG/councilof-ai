/**
 * SeparationDisclosure — the family rule a "separated leader" must clear, published before one exists.
 *
 * WHY. The board runs one exact McNemar test per model-comparison axis. Judged together those are a
 * family: at 14 axes and a naive p<0.05 each, the odds that at least one published "separated
 * leader" is a false positive under a true global null are about 1−0.95¹⁴ ≈ 51%. The honest move is
 * to pre-commit to a family rule (Holm step-down) and publish it while every axis is still TIE or
 * UNTESTED — so the first separated verdict arrives already credible, not contestable after the
 * fact. lib/holm.ts is the arithmetic; this file is only its display.
 *
 * THREE VARIANTS (built side by side in the disclosure lab, one ships):
 *  - "static"   — the rule and the worked threshold table for a 14-axis family. No reads, renders
 *                 in prerendered HTML, works without JS.
 *  - "live"     — reads the family size and each TIE axis's published p off the SHARED board feed
 *                 (useGspcBoard — one request per page, already mounted on /about#numbers), and
 *                 shows where every current p sits against its own step. A field that is not
 *                 published is "not read", never guessed.
 *  - "explorer" — reader-chosen planning arithmetic (how many paired items would a separation need,
 *                 given a discordance and a skew), labelled arithmetic, never a measurement.
 *
 * ADOPTION STATE, SHOWN NOT ASSUMED. A pre-registration only binds if it exists before the data.
 * The rule was PROPOSED from 2026-11-04 03:24Z and the owner adopted it the same day; every
 * variant now says IN FORCE · adopted 2026-11-04, and the adoption date is what separates a
 * pre-registration from a post-hoc rule. It never claims the rule has produced a verdict: today
 * that would be false (0 separated) — the rule binds the FIRST separated verdict when it comes.
 *
 * NOTHING IS TYPED. Family size comes from the payload's totals (the same four separation fields
 * the home page reads). If the board is unread, the static rule text still renders and the live
 * table says so in words.
 */
import { useMemo, useState } from "react";
import { useGspcBoard, type GspcPayload, type GspcAxis } from "@/components/board/useGspcBoard";
import { separationRead } from "@/components/home/LiveBoardGlance";
import { holmThresholds, holmThresholdAt, mcnemarRequiredPairedN } from "@/lib/holm";

export type SeparationDisclosureVariant = "static" | "live" | "explorer";

const ALPHA = 0.05;

/** TIE axes with a published separation p. Axes without one are listed as not read, not dropped.
 *  cliff_delta is the generated effect size the board serves beside the MDE (GET /api/gspc →
 *  mde.effect), read with the same discipline: absent is "not read", never a zero. */
export function tieRows(axes: GspcAxis[]): {
  axis: string;
  n: number | null;
  p: number | null;
  delta: number | null;
}[] {
  return axes
    .filter((a) => a.status === "MEASURED" && a.separation === "TIE")
    .map((a) => {
      const effect = (a as { effect?: { cliff_delta?: unknown } }).effect;
      const raw = effect && typeof effect === "object" ? (effect as { cliff_delta?: unknown }).cliff_delta : undefined;
      return {
        axis: typeof a.axis === "string" ? a.axis : "",
        n: typeof a.n === "number" && Number.isFinite(a.n) ? a.n : null,
        p: typeof a.separation_p === "number" && Number.isFinite(a.separation_p) ? a.separation_p : null,
        delta: typeof raw === "number" && Number.isFinite(raw) ? raw : null,
      };
    });
}

/**
 * UNTESTED comparison axes — measured, but no separation test is published — with what the
 * board itself says they are waiting on. The reason is the payload's own method_status (or
 * status note); it is READ, never paraphrased, and a row that carries no stated reason shows
 * "not stated" — an absent reason is not invented here, because "why" is exactly the field
 * a reader is asking for.
 */
export function untestedRows(axes: GspcAxis[]): { axis: string; waitingOn: string | null }[] {
  return axes
    .filter((a) => a.status === "MEASURED" && a.separation === "UNTESTED")
    .map((a) => ({
      axis: typeof a.axis === "string" ? a.axis : "",
      waitingOn:
        typeof a.method_status === "string" && a.method_status.trim()
          ? a.method_status.trim()
          : typeof a.note === "string" && a.note.trim()
            ? a.note.trim()
            : null,
    }));
}

const fmtP = (p: number): string => (p < 0.001 ? p.toExponential(2) : p.toFixed(3));
const fmtT = (t: number): string => (t < 0.001 ? t.toExponential(2) : t.toFixed(4));

function RuleChips({ familySize }: { familySize: number | null }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
      <span className="rounded-full border border-emerald-600/60 bg-emerald-100 px-2 py-0.5 font-bold text-emerald-950 dark:border-emerald-400/60 dark:bg-emerald-900/50 dark:text-emerald-100" data-testid="sep-disclosure-adoption">
        IN FORCE · adopted 2026-11-04
      </span>
      <span className="font-mono text-muted-foreground">
        family rule: Holm step-down, α {ALPHA} · family size {familySize === null ? <span>not read</span> : <span className="font-bold text-foreground">{familySize}</span>}
      </span>
    </p>
  );
}

function StaticTable({ familySize }: { familySize: number }) {
  const steps = holmThresholds(familySize, ALPHA);
  return (
    <table className="mt-3 w-full max-w-md border-collapse font-mono text-[12px]" data-testid="sep-disclosure-table">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="border-b border-border py-1 pr-3 font-semibold">rank of p (smallest first)</th>
          <th className="border-b border-border py-1 pr-3 font-semibold">that p must clear</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((t, i) => (
          <tr key={i}>
            <td className="border-b border-border/60 py-1 pr-3">{i + 1} of {familySize}</td>
            <td className="border-b border-border/60 py-1 pr-3">{fmtT(t)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StaticVariant() {
  return (
    <div data-testid="sep-disclosure-static">
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        One name has to be given before any verdict it touches: <strong className="text-foreground">Holm step-down</strong> across
        all model-comparison axes as one family. Judged separately, fourteen tests at p&lt;0.05 carry roughly a{" "}
        {Math.round((1 - Math.pow(1 - ALPHA, 14)) * 100)}% chance of at least one false “separated leader” under a true
        global null — which is exactly the failure mode a measurement board exists to refuse. Under the family rule, the
        smallest p clears α/{14}, the next α/{13}, and so on; the walk stops at the first miss. The worked table for a
        14-axis family:
      </p>
      <StaticTable familySize={14} />
      <RuleChips familySize={null} />
    </div>
  );
}

function LiveVariant({ injected }: { injected?: GspcPayload | null }) {
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? null : live.error;
  const sep = separationRead(data);
  const rows = useMemo(() => (Array.isArray(data?.axes) ? tieRows(data!.axes as GspcAxis[]) : []), [data]);
  const familySize = sep?.comparison ?? null;
  const ranked = useMemo(
    () =>
      rows
        .filter((r) => r.p !== null)
        .sort((a, b) => (a.p as number) - (b.p as number))
        .map((r, i) => ({ ...r, rank: i + 1, threshold: holmThresholdAt(rows.length || familySize || 1, i + 1, ALPHA) })),
    [rows, familySize],
  );
  const unread = rows.filter((r) => r.p === null);
  const untested = useMemo(
    () => (Array.isArray(data?.axes) ? untestedRows(data!.axes as GspcAxis[]) : []),
    [data],
  );
  return (
    <div data-testid="sep-disclosure-live">
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Under the family rule (adopted 2026-11-04), each published TIE p-value is shown against the Holm step it
        must clear for its rank in the family (smallest p first). Nothing here upgrades a TIE: a step cleared is
        the necessary condition for a SEPARATED verdict, not the verdict itself — and a separated verdict has
        never been published on this board.
      </p>
      {error && !data ? (
        <p className="mt-2 text-[13px] text-muted-foreground" role="status">
          The board is unread right now ({error}), so no p-values are shown. Nothing is shown in their place.
        </p>
      ) : null}
      {ranked.length > 0 ? (
        <table className="mt-3 w-full max-w-2xl border-collapse font-mono text-[12px]" data-testid="sep-disclosure-live-rows">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="border-b border-border py-1 pr-3 font-semibold">axis</th>
              <th className="border-b border-border py-1 pr-3 font-semibold">n</th>
              <th className="border-b border-border py-1 pr-3 font-semibold">published p</th>
              <th className="border-b border-border py-1 pr-3 font-semibold" title="Cliff's delta, paired binary: (leader-only − comparator-only) / paired items; positive favours the leader. Generated from the published per-item rows.">
                Cliff's δ
              </th>
              <th className="border-b border-border py-1 pr-3 font-semibold">must clear (Holm)</th>
              <th className="border-b border-border py-1 font-semibold">under the family rule</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => {
              const clears = (r.p as number) <= r.threshold;
              return (
                <tr key={r.axis} data-testid={`sep-disclosure-live-${r.axis}`}>
                  <td className="border-b border-border/60 py-1 pr-3 font-bold text-foreground">
                    <a href={`/gspc/${encodeURIComponent(r.axis)}/`} className="underline-offset-2 hover:underline">{r.axis}</a>
                  </td>
                  <td className="border-b border-border/60 py-1 pr-3">{r.n ?? <span>not read</span>}</td>
                  <td className="border-b border-border/60 py-1 pr-3">{fmtP(r.p as number)}</td>
                  <td className="border-b border-border/60 py-1 pr-3">{r.delta === null ? <span>not read</span> : (r.delta > 0 ? "+" : "") + r.delta.toFixed(3)}</td>
                  <td className="border-b border-border/60 py-1 pr-3">{fmtT(r.threshold)}</td>
                  <td className="border-b border-border/60 py-1">
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900 dark:bg-sky-900/60 dark:text-sky-100">
                      {clears ? "clears its step under the family rule" : "does not clear its step"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : error || !data ? null : (
        <p className="mt-2 text-[13px] text-muted-foreground" role="status">
          No separation p-value is published on any model-comparison axis yet, so the family walk has nothing to
          judge. That is the state this pre-registration is for.
        </p>
      )}
      {unread.length > 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground" data-testid="sep-disclosure-live-unread">
          TIE axes with no published p (listed, never dropped): {unread.map((r) => r.axis).join(", ")}.
        </p>
      ) : null}
      {untested.length > 0 && !error ? (
        <div className="mt-3" data-testid="sep-disclosure-live-untested">
          <p className="text-[12px] font-bold text-foreground">
            Untested axes — measured, but no separation test is published. What the board says each is waiting on:
          </p>
          <ul className="mt-1 space-y-0.5 font-mono text-[12px] text-muted-foreground">
            {untested.map((r) => (
              <li key={r.axis} data-testid={`sep-disclosure-untested-${r.axis}`}>
                <span className="font-bold text-foreground">{r.axis}</span> — waiting on:{" "}
                {r.waitingOn ?? <span>not stated</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <RuleChips familySize={familySize} />
    </div>
  );
}

function ExplorerVariant() {
  const [discordancePct, setDiscordancePct] = useState(10);
  const [skewPct, setSkewPct] = useState(80);
  const discordance = discordancePct / 100;
  const skew = skewPct / 100;
  const required = mcnemarRequiredPairedN(discordance, skew, ALPHA, 0.8);
  return (
    <div data-testid="sep-disclosure-explorer">
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Why a TIE can be permanent: a separation test can only see the bank items the two models{" "}
        <em>disagree</em> on. This box is planning arithmetic — you choose the discordance and the skew, it
        computes the paired-item count an 80%-power McNemar would need. Per-axis figures that ARE measured live
        beside each TIE as a generated minimum detectable effect, from the hash-bound per-item rows
        (GET /api/gspc → <code>mde</code>). This box measures nothing.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[13px]">
        <label className="flex items-center gap-2">
          discordance <input type="number" min={1} max={100} value={discordancePct} onChange={(e) => setDiscordancePct(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-20 rounded-md border border-border bg-background px-2 py-1" data-testid="sep-disclosure-explorer-discordance" /> %
        </label>
        <label className="flex items-center gap-2">
          skew <input type="number" min={51} max={99} value={skewPct} onChange={(e) => setSkewPct(Math.max(51, Math.min(99, Number(e.target.value) || 51)))} className="w-20 rounded-md border border-border bg-background px-2 py-1" data-testid="sep-disclosure-explorer-skew" /> %
        </label>
        <span data-testid="sep-disclosure-explorer-result">
          required paired items:{" "}
          {required === null ? (
            <span>outside the arithmetic's range</span>
          ) : (
            <strong className="text-foreground">{required.toLocaleString("en-GB")}</strong>
          )}
        </span>
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">
        n<sub>discordant</sub> = (z<sub>α/2</sub>·0.5 + z<sub>power</sub>·√(s(1−s)))² / (s−0.5)², then ÷ discordance. At the
        current banks' scale (about 36 paired items), only a highly discriminative item bank can separate two
        ~94%-accurate models — the arithmetic behind “separation research is bank design, not more runs”.
      </p>
      <RuleChips familySize={null} />
    </div>
  );
}

export default function SeparationDisclosure({
  variant = "live",
  className = "",
  data: injected,
  defaultOpen = false,
}: {
  variant?: SeparationDisclosureVariant;
  className?: string;
  /** The shared board read, injected by a parent that already subscribes (prerender + one-request rule). */
  data?: GspcPayload | null;
  /** Only for the disclosure lab and prerendered snapshots; ships closed. */
  defaultOpen?: boolean;
}) {
  const [show, setShow] = useState(defaultOpen);
  return (
    <div className={`mt-4 rounded-xl border border-border bg-card px-4 py-3 ${className}`} data-testid={`sep-disclosure-${variant}`}>
      <button
        type="button"
        className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between text-left text-sm font-bold text-foreground hover:underline"
        aria-expanded={show}
        onClick={() => setShow((v) => !v)}
        data-testid="sep-disclosure-toggle"
      >
        The family rule a separated leader must clear
        <span aria-hidden="true" className="text-muted-foreground">{show ? "▲" : "▼"}</span>
      </button>
      {show ? (
        variant === "static" ? <StaticVariant /> : variant === "explorer" ? <ExplorerVariant /> : <LiveVariant injected={injected} />
      ) : null}
    </div>
  );
}
