/**
 * BoardAttestation — living tables showing Ed25519 signature, SHA-256 hash,
 * XRPL ledger status, and progress visualization from the live board.
 *
 * Click-through: every row opens a deep page with interactive graphs, traces,
 * logs. RWA.xyz-class or better.
 *
 * Fetches from /api/gspc at render time. No hardcoded scores. Empty fields
 * render as UNMEASURED with an honest reason.
 *
 * ── LOCKS ────────────────────────────────────────────────────────────────────
 * - site_attestation (Ed25519, did:web:csoai.org#board-attestation-1) verifies.
 * - living_stamp is UNVERIFIABLE (explicitly stated in the payload).
 * - XRPL public-root: GET /root.json (unsigned leaves, NO_LAPTOP_SIGN).
 *   /api/xrpl is a reader of that root (writes_board false). Live locked 16.
 * - N→N+1 drift: render UNCHECKABLE when living-root-as-index-honesty says so.
 *   Link GET /root.json. Never invent drift numbers or a Merkle seal.
 * - Never certify. Verify stays free and loginless.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import AttestationDeepDive, { type DeepDiveKind } from "./AttestationDeepDive";
import { boardRunDates } from "@/lib/boardRunDates";
import { verifyBoardStamp, type StampCheck } from "@/lib/verifyBoardStamp";

interface SiteAttestation {
  attests?: string;
  signer?: string;
  alg?: string;
  sig?: string;
  public_key_x?: string;
  sig_input?: string;
  sig_input_ensure_ascii?: boolean;
  sig_input_is_digest?: boolean;
  verify?: string;
}

interface LivingStamp {
  source?: string;
  updated?: string;
  gold_run?: string;
  signed?: boolean;
  verification_state?: string;
  verifiable?: boolean;
  signer?: string;
  signature?: string;
  unverifiable_note?: string;
  tracked_as?: string;
  preimage?: unknown;
  public_key_x?: string;
  superseded?: { verifiable?: boolean; verification_state?: string; reproduction_attempts?: number };
}

interface BoardTotals {
  axes?: number;
  measured_axes?: number;
  unmeasured_axes?: number;
  public_count?: string;
  count_grammar?: string;
  comparison_axes?: number;
  separated_leads?: number;
  ties?: number;
}

interface InLaneAxis {
  axis: string;
  bench?: string;
  task?: string;
  n?: number;
  accuracy?: number;
  leader?: string;
  separation?: string;
  fleet_mean?: number;
  status?: string;
  n_note?: string;
}

interface BoardAttestationProps {
  data: {
    site_attestation?: SiteAttestation;
    measured_on?: {
      date?: string;
      model?: string;
      endpoint?: string;
      grading?: string;
      note?: string;
      living_stamp?: LivingStamp;
    };
    totals?: BoardTotals;
    measured_in_lane?: InLaneAxis[];
    axes?: unknown[];
  } | null;
  variant?: "light" | "dark";
  showProgress?: boolean;
  showInLane?: boolean;
  compact?: boolean;
}

function truncateSig(sig: string | undefined, len = 16): string {
  if (!sig) return "—";
  if (sig.length <= len * 2) return sig;
  return `${sig.slice(0, len)}…${sig.slice(-8)}`;
}

/** The usable-item floor an in-lane axis must reach before it can be signed onto the board. */
const N_FLOOR = 30;

/** "Aug 2026" from an ISO timestamp, or null. */
function stampMonth(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BoardAttestation({
  data,
  variant = "light",
  showProgress = true,
  showInLane = true,
  compact = false,
}: BoardAttestationProps) {
  const [deepDive, setDeepDive] = useState<{ kind: DeepDiveKind; extra?: any } | null>(null);
  const [stampCheck, setStampCheck] = useState<StampCheck | "checking" | null>(null);
  const runStampCheck = async () => {
    const st = data?.measured_on?.living_stamp;
    if (!st) return;
    setStampCheck("checking");
    try {
      const r = await fetch("/.well-known/did.json", { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`the DID document answered HTTP ${r.status}`);
      setStampCheck(await verifyBoardStamp(st, await r.json()));
    } catch (e) {
      setStampCheck({ state: "UNCHECKABLE", reason: (e as Error).message || "the DID document could not be read" });
    }
  };
  const [drift, setDrift] = useState<{ status?: string; note?: string } | null>(null);

  useEffect(() => {
    fetch("/interop/living-root-as-index-honesty.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDrift(j?.n_to_n_plus_1_drift ?? null))
      .catch(() => setDrift(null));
  }, []);

  const dark = variant === "dark";
  const att = data?.site_attestation;
  const stamp = data?.measured_on?.living_stamp;
  // measured_on.date, completed with any run it does not name (effect-binding), read from the axes.
  const measuredOnDate = boardRunDates(data);
  const goldRun = stamp?.gold_run;
  const totals = data?.totals;
  const inLane = data?.measured_in_lane;

  const axes = totals?.axes ?? 0;
  const measured = totals?.measured_axes ?? 0;
  const unmeasured = totals?.unmeasured_axes ?? (axes - measured);
  const progressPct = axes > 0 ? (measured / axes) * 100 : 0;

  const borderCls = dark ? "border-emerald-500/20" : "border-emerald-600/15";
  const bgCls = dark ? "bg-[#05140d]" : "bg-white";
  const textMuted = dark ? "text-emerald-100/70" : "text-gray-600";
  const textPrimary = dark ? "text-emerald-50" : "text-gray-900";
  const labelCls = `text-[11px] font-bold uppercase tracking-wider ${dark ? "text-emerald-300/60" : "text-emerald-700"}`;
  const hoverCls = `cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${dark ? "hover:border-emerald-400/40" : "hover:border-emerald-500/40"}`;
  const clickHintCls = `ml-auto shrink-0 ${dark ? "text-emerald-400/50" : "text-emerald-600/40"}`;

  return (
    <>
    <div className={`rounded-2xl border ${borderCls} ${bgCls} p-5 space-y-5`}>
      {/* ATTESTATION TABLE */}
      <div>
        <h3 className={`${labelCls} mb-3`}>Attestation · live from GET /api/gspc · click any row for traces</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ed25519 Signature */}
          <button
            onClick={() => setDeepDive({ kind: "ed25519" })}
            className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Ed25519 Signature</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            {att?.sig ? (
              <p className={`mt-1 font-mono text-[12px] ${textPrimary} break-all`} title={att.sig}>
                {truncateSig(att.sig, 20)}
              </p>
            ) : (
              <p className={`mt-1 text-[12px] ${textMuted}`}>
                Empty — no site_attestation.sig in payload
              </p>
            )}
            {att?.alg && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>alg: {att.alg}</p>
            )}
          </button>

          {/* SHA-256 / Content Hash */}
          <button
            onClick={() => setDeepDive({ kind: "sha256" })}
            className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Content Integrity</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            {att?.sig_input ? (
              <>
                <p className={`mt-1 text-[12px] ${textPrimary}`}>
                  SHA-256 over canonical JSON
                </p>
                <p className={`mt-1 text-[10px] ${textMuted}`}>
                  ensure_ascii={String(att.sig_input_ensure_ascii ?? "false")}, 
                  is_digest={String(att.sig_input_is_digest ?? "false")}
                </p>
              </>
            ) : (
              <p className={`mt-1 text-[12px] ${textMuted}`}>
                Empty — no sig_input rule in payload
              </p>
            )}
          </button>

        </div>

        {/* Signer / Verification Method */}
        {att?.signer && (
          <button
            onClick={() => setDeepDive({ kind: "ed25519" })}
            className={`mt-3 rounded-lg border ${borderCls} p-3 w-full text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Verification Method</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            <p className={`mt-1 font-mono text-[12px] ${textPrimary} break-all`}>
              {att.signer}
            </p>
            {att.public_key_x && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>
                public_key_x: {truncateSig(att.public_key_x, 12)}
              </p>
            )}
            <p className={`mt-2 text-[11px] ${textMuted}`}>
              Fetch /.well-known/did.json → verify sig over canonical(payload minus site_attestation).
            </p>
          </button>
        )}

        {/* Measurement freshness — Aug dates are weeks old; not a live re-measure */}
        {(measuredOnDate || goldRun) && (
          <div className={`mt-3 rounded-lg border ${dark ? "border-sky-500/30 bg-sky-950/30" : "border-sky-300 bg-sky-50"} p-3`}>
            <p className={`text-[10px] uppercase tracking-wide ${dark ? "text-sky-300/80" : "text-sky-800"}`}>
              Measurement freshness · derived from GET /api/gspc · measured_on
            </p>
            {measuredOnDate && (
              <p className={`mt-1 text-[12px] ${textPrimary}`}>
                {measuredOnDate}
              </p>
            )}
            {goldRun && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>
                living_stamp.gold_run {formatDate(goldRun)} — payload stamp, not a live re-measure. Board counts stay derived from GET /api/gspc; no new MEASURED invented here.
              </p>
            )}
            <p className={`mt-1 text-[11px] ${dark ? "text-sky-200/70" : "text-sky-900/80"}`}>
              These are the dates the runs were made, not the date you loaded this page. The board is not re-stamped from this page.
            </p>
          </div>
        )}

        {/* Board stamp. The label is read from the stamp's own published state, never assumed
            (audit 2026-09-28 #22): until then a stamp published as SIGNED and verifiable printed
            "Living Stamp — SIGNED" directly above a fallback line, written for the older v0.1
            stamp, saying "Do not treat this as a valid attestation". The current stamp
            (csoai.gspc-living/0.2) verifies — Ed25519 over canonical(preimage) under
            #board-attestation-1, checked on 2026-09-28 — and the reader can re-run that check
            here; the result is never baked into a prerendered page. The v0.1 stamp it superseded
            does not reproduce. Its ledger entry is C-2026-0826-08b; the payload's tracked_as says
            C-2026-0826-08, which is the fingerprint entry, and the payload is signed, so it is not
            edited here. */}
        {stamp && (() => {
          const declared = stamp.verifiable === true && stamp.verification_state === "SIGNED";
          const when = stampMonth(stamp.gold_run ?? stamp.updated);
          const oldFails = stamp.superseded?.verifiable === false;
          const failed = !!stampCheck && stampCheck !== "checking" && stampCheck.state === "INVALID";
          const tone = declared && !failed
            ? { box: dark ? "border-emerald-500/30 bg-emerald-900/20" : "border-emerald-300 bg-emerald-50", head: dark ? "text-emerald-300/80" : "text-emerald-800", body: dark ? "text-emerald-100/75" : "text-emerald-900" }
            : { box: dark ? "border-amber-500/30 bg-amber-900/20" : "border-amber-300 bg-amber-50", head: dark ? "text-amber-300/80" : "text-amber-700", body: dark ? "text-amber-200/70" : "text-amber-800" };
          return (
            <div className={`mt-3 rounded-lg border ${tone.box} p-3`} data-testid="board-stamp">
              <p className={`text-[11px] font-semibold ${tone.head}`}>
                {declared
                  ? `Board stamp${when ? ` (${when})` : ""}: signed, and published as verifiable`
                  : `Board stamp${when ? ` (${when})` : ""}: signed but not reproducible`}
              </p>
              <p className={`mt-1 text-[12px] ${tone.body}`}>
                {declared ? (
                  <>
                    Ed25519 under <code>{stamp.signer ?? "did:web:csoai.org#board-attestation-1"}</code> over the
                    preimage published with it; the rule is <code>sig_input</code> in the{" "}
                    <a href="/api/gspc" className="underline">board JSON</a>. It dates the
                    run{stamp.gold_run ? ` of ${formatDate(stamp.gold_run)}` : ""}; it is not a re-measurement.
                  </>
                ) : (
                  <>No published bytes reproduce this signature. Rely on the board&apos;s site_attestation instead.</>
                )}
                {(oldFails || !declared) && (
                  <>
                    {" "}
                    {declared ? "The stamp it replaced (v0.1) was signed but is not reproducible" : "See"} —{" "}
                    <a href="/corrections/#C-2026-0826-08b" className="underline">C-2026-0826-08b</a> in the corrections ledger.
                  </>
                )}
              </p>
              {declared && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runStampCheck()}
                    disabled={stampCheck === "checking"}
                    className={`min-h-[36px] rounded-md border px-3 text-[12px] font-semibold ${dark ? "border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/15" : "border-emerald-600/40 text-emerald-800 hover:bg-emerald-50"}`}
                    data-testid="board-stamp-check"
                  >
                    {stampCheck === "checking" ? "Checking…" : "Check it in this browser"}
                  </button>
                  {stampCheck && stampCheck !== "checking" && (
                    <span className={`text-[12px] ${tone.body}`} role="status" data-testid="board-stamp-result">
                      <strong>{stampCheck.state}</strong>
                      {stampCheck.state === "VALID"
                        ? ` — the signature verifies under the key read from /.well-known/did.json just now.`
                        : ` — ${stampCheck.reason}.`}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* PROGRESS VISUALIZATION */}
      {showProgress && totals && (
        <div className={`border-t ${borderCls} pt-5`}>
          <h3 className={`${labelCls} mb-3`}>Progress · {totals.public_count || `${axes} axis · ${measured} measured`}</h3>
          
          <button
            onClick={() => setDeepDive({ kind: "progress" })}
            className={`w-full rounded-lg border ${borderCls} p-4 text-left ${hoverCls}`}
          >
            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="flex-1">
                <div className={`h-3 rounded-full ${dark ? "bg-emerald-900/40" : "bg-gray-200"} overflow-hidden`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className={textMuted}>{measured} measured</span>
                  <span className={dark ? "text-amber-300/70" : "text-amber-700"}>{unmeasured} empty (visible)</span>
                  <span className={textMuted}>{axes} total</span>
                </div>
              </div>
              
              {/* Numbers */}
              <div className="text-right">
                <p className={`text-2xl font-black ${textPrimary}`}>
                  {measured}<span className={textMuted}>/</span>{axes}
                </p>
                <p className={`text-[10px] ${textMuted}`}>axis</p>
              </div>
              <ChevronRight className={`h-4 w-4 ${clickHintCls}`} />
            </div>
          </button>

          {/* N→N+1 drift — honesty-driven; fail closed to UNCHECKABLE */}
          <div
            className={`mt-3 rounded-lg border ${
              dark ? "border-amber-500/30 bg-amber-900/15" : "border-amber-300 bg-amber-50"
            } p-3`}
          >
            <p
              className={`text-[10px] uppercase tracking-wide ${
                dark ? "text-amber-300/80" : "text-amber-700"
              }`}
            >
              N→N+1 drift · {drift?.status || "UNCHECKABLE"}
            </p>
            <p className={`mt-1 text-[11px] ${dark ? "text-amber-200/70" : "text-amber-800"}`}>
              {/* UNCHECKABLE renders a plain sentence: the honesty file's note is written for agents
                  ("do not invent…") and stays in the file for them (persona sweep 6 Oct 2026). */}
              {(drift?.status || "UNCHECKABLE") === "UNCHECKABLE" || !drift?.note
                ? "No published board time series for N→N+1 drift, so no drift figure or Merkle seal is shown. Empty stays empty."
                : drift.note}{" "}
              Living snapshot only — cite{" "}
              <a
                href="/root.json"
                className={dark ? "text-emerald-300 underline" : "text-emerald-700 underline"}
              >
                GET /root.json
              </a>
              .
            </p>
          </div>

          {/* Count Grammar */}
          {!compact && totals.count_grammar && (
            <p className={`mt-3 text-[11px] ${textMuted}`}>
              {totals.count_grammar}
            </p>
          )}

          {/* Separation Summary */}
          {totals.comparison_axes !== undefined && totals.separated_leads !== undefined && (
            <button
              onClick={() => setDeepDive({ kind: "separation" })}
              className={`mt-3 w-full rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
            >
              <div className="flex items-center">
                <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Separation Summary</p>
                <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                <span className={`rounded-full border ${dark ? "border-emerald-500/30 bg-emerald-900/30" : "border-emerald-300 bg-emerald-50"} px-2.5 py-1 font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                  {totals.separated_leads} SEPARATED
                </span>
                <span className={`rounded-full border ${dark ? "border-amber-500/30 bg-amber-900/30" : "border-amber-300 bg-amber-50"} px-2.5 py-1 font-semibold ${dark ? "text-amber-300" : "text-amber-800"}`}>
                  {totals.ties ?? 0} TIE
                </span>
                <span className={textMuted}>
                  of {totals.comparison_axes} model-comparison axis (McNemar p&lt;0.05)
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* IN-LANE / UNSIGNED PATH */}
      {showInLane && inLane && inLane.length > 0 && (
        <div className={`border-t ${borderCls} pt-5`}>
          <div className="flex items-center mb-3">
            <h3 className={labelCls}>
              In-lane measurements · not board rows
            </h3>
            <button
              onClick={() => setDeepDive({ kind: "in-lane" })}
              className={`ml-2 text-[10px] ${dark ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
            >
              view all traces →
            </button>
          </div>
          <p className={`text-[11px] ${textMuted} mb-3`}>
            {inLane.length} {inLane.length === 1 ? "slot" : "slots"} measured in-lane on a smaller fleet with no separation test.
            Published as <code className="text-[10px]">measured_in_lane</code> on GET /api/gspc —
            never stamped onto the board. Board public_count stays{" "}
            {totals?.public_count || `${axes} axis · ${measured} measured`}.
          </p>
          
          <div className="grid gap-2 sm:grid-cols-2">
            {inLane.map((axis) => (
              <button
                key={axis.axis}
                onClick={() => setDeepDive({ kind: "axis", extra: { selectedAxis: axis } })}
                className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>{axis.axis}</p>
                    <p className={`text-[11px] ${textMuted}`}>{axis.bench || axis.task}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${dark ? "border-violet-500/40 bg-violet-900/30 text-violet-300" : "border-violet-300 bg-violet-50 text-violet-800"}`}>
                    IN-LANE
                  </span>
                </div>
                {axis.n !== undefined && (
                  <div className={`mt-2 flex flex-wrap gap-3 text-[11px] font-mono`}>
                    <span className={textPrimary}>n={axis.n}</span>
                    {axis.accuracy !== undefined && (
                      <span className={textMuted}>acc={(axis.accuracy * 100).toFixed(0)}%</span>
                    )}
                    {axis.fleet_mean !== undefined && (
                      <span className={textMuted}>fleet={(axis.fleet_mean * 100).toFixed(0)}%</span>
                    )}
                  </div>
                )}
                {axis.separation === "UNTESTED" && (
                  // Read from the row (audit 2026-09-28 #22): "needs n≥30" printed beside n=35. The
                  // floor is stated as met or not from n; per-model n can be lower, so n_note travels.
                  <p className={`mt-2 text-[11px] ${dark ? "text-amber-300/70" : "text-amber-700"}`}>
                    {typeof axis.n === "number" && axis.n >= N_FLOOR
                      ? `Path to signed: n=${axis.n} meets the n≥${N_FLOOR} floor; still needs a 4-way separation test + keystone`
                      : `Path to signed: needs n≥${N_FLOOR}${typeof axis.n === "number" ? ` (has ${axis.n})` : ""} + 4-way separation test + keystone`}
                  </p>
                )}
                {axis.separation === "UNTESTED" && axis.n_note && (
                  <p className={`mt-1 text-[11px] ${textMuted}`}>{axis.n_note}</p>
                )}
                <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 ${clickHintCls} opacity-0 group-hover:opacity-100`} />
              </button>
            ))}
          </div>

          {/* Unsigned-to-Signed Path */}
          <button
            onClick={() => setDeepDive({ kind: "in-lane" })}
            className={`mt-4 w-full rounded-lg border ${dark ? "border-emerald-500/20 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50/50"} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[11px] font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                Unsigned → Signed path (honest)
              </p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            <ul className={`mt-2 text-[11px] ${textMuted} space-y-1`}>
              <li>
                • n ≥ {N_FLOOR} usable items — {inLane.map((a) => `${a.axis} n=${a.n ?? "—"}${typeof a.n === "number" && a.n >= N_FLOOR ? " (met)" : " (not met)"}`).join(", ") || "—"}
              </li>
              <li>• 4-way separation test (McNemar on discordant items)</li>
              <li>• Keystone attestation (Ed25519 over canonical JSON)</li>
              <li>• Board gate reconciliation (owner-gated)</li>
            </ul>
            <p className={`mt-2 text-[10px] ${dark ? "text-amber-300/60" : "text-amber-600"}`}>
              No fake close: these axes are not marked signed, no completion date is invented,
              and no path is painted as complete.
            </p>
          </button>
        </div>
      )}

      {/* TECHNICAL NOTES — collapsed (audit 2026-09-28 #22). The XRPL reader note is true and
          stays published, but it is not part of the first check a stranger makes. */}
      <details className={`border-t ${borderCls} pt-4`} data-testid="board-technical-notes">
        <summary className={`cursor-pointer text-[12px] font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
          Technical notes
        </summary>
        <div className={`mt-3 space-y-2 text-[12px] leading-relaxed ${textMuted}`}>
          <p>
            <strong className={textPrimary}>XRPL.</strong> <code>/api/xrpl</code> is a reader of the public root at{" "}
            <a href="/root.json" className="underline">GET /root.json</a>: it reports issued-asset coverage against the
            same Merkle root and writes nothing to the board. The root&apos;s leaves are not individually signed. It is not a GSPC grade, not a MEASURED axis and not a devnet record.{" "}
            <button type="button" onClick={() => setDeepDive({ kind: "xrpl" })} className="underline">
              Open the XRPL trace
            </button>
            .
          </p>
        </div>
      </details>

      {/* LINKS */}
      {!compact && (
        <div className={`border-t ${borderCls} pt-4 flex flex-wrap gap-3 text-[12px]`}>
          <Link
            href="/gspc-verify"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Verify a signed card or root membership →
          </Link>
          <a
            href="/.well-known/did.json"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            DID document →
          </a>
          <a
            href="/api/gspc"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Raw JSON →
          </a>
          <a
            href="/root.json"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Living root-as-index · GET /root.json →
          </a>
          <Link
            href="/xrpl-attest"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            XRPL public-root catalogue →
          </Link>
        </div>
      )}
    </div>
    
    {/* Deep Dive Modal */}
    {deepDive && (
      <AttestationDeepDive
        kind={deepDive.kind}
        data={{ ...data, ...(deepDive.extra || {}) }}
        onClose={() => setDeepDive(null)}
      />
    )}
    </>
  );
}
