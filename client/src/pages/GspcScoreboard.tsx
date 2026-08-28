import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { sha256Hex, verifyEd25519Detached } from "@/lib/verify";
import { BOARD_COUNT_OBSERVED, boardCountFromPayload } from "@/lib/boardCount";
import { accuracyCell, intervalCell, separationNote } from "@/lib/axisCells";
import StatusChip, { chipFor } from "@/components/board/StatusChip";
import BoardAttestation from "@/components/board/BoardAttestation";

/**
 * /gspc-scoreboard — the live board, honestly displayed (NEXT-100 #2).
 *
 * This one component also renders every /gspc/:axis page, so every count fixed
 * here is fixed on all of them at once. NO COUNT IS TYPED (ADR-001): the board's
 * totals are derived from the /api/gspc payload this page already fetches, and
 * the ARENA panel below renders the arena's own, different count — labelled as
 * such, because the two instruments are not reconciled.
 * Every hero CTA already points here; until now it fell through to the SPA
 * catch-all. Renders LIVE from /api/gspc: per-axis n, leader accuracy with
 * Wilson CI where the n is honest, and first-class separation chips.
 * LMArena rule adopted verbatim: overlapping/failed separation renders as
 * "statistically indistinguishable" — never as a ranking.
 */

/**
 * The board row as /api/gspc actually serves it.
 *
 * accuracy / leader / separation are OPTIONAL and must stay optional — they
 * mirror `AxisScore` in functions/api/_gspc_types.ts. Declaring them required
 * here (which this file used to do) is what let `(a.accuracy * 100).toFixed(1)`
 * type-check and then print `NaN%` for the 8 financial/domain axes, which carry
 * no accuracy at all. Absence is honest absence; it is never a zero.
 */
interface Axis {
  axis: string;
  bench: string;
  n: number;
  n_unit?: string;
  family?: "gspc" | "financial";
  kind?: "model-comparison" | "deterministic-facts" | "declared-slot";
  accuracy?: number;
  accuracy_is?: string;
  leader?: string;
  separation?: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;
  interval?: [number, number];
  coverage?: string;
  coverage_note?: string;
  evidence_url?: string;
  status: string;
}

// The board Dataset + a hasPart catalog of all 13 published per-axis banks, so
// Hugging Face Dataset-Search and answer engines can index each bank (real HF
// URLs, CC-BY-4.0, the resolving concept DOI) from this one crawlable page.
// Derived from the axis registry — see client/src/lib/datasetSchema.ts.
const DATASET_LD = gspcDatasetLd();

const CHIP: Record<string, string> = {
  SEPARATED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  TIE: "bg-amber-100 text-amber-800 border-amber-300",
  UNTESTED: "bg-gray-100 text-gray-600 border-gray-300",
};

/* ArenaEloPanel — the signed per-axis Elo leaderboard (the verifiable half).
 * Fetches /arena/elo_reference.json (signed: content_id + Ed25519 over the
 * canonical body), renders the per-axis Elo, and offers an INDEPENDENT verify:
 * recompute the canonical body locally (WebCrypto sha256 -> content_id) and
 * verify the Ed25519 signature against the recorded pubkey. This is the piece
 * OpenRouter and LMArena do not have: the number can be re-verified, free.
 */
function ArenaEloPanel() {
  const [elo, setElo] = useState<any>(null);
  const [elErr, setElErr] = useState<string | null>(null);
  const [axis, setAxis] = useState<string>("overall");
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "ok" | "bad">("idle");

  useEffect(() => {
    fetch("/arena/elo_reference.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => setElo(d))
      .catch((e) => setElErr(String(e)));
  }, []);

  async function verifySigned() {
    if (!elo) return;
    setVerifyState("checking");
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(elo)) {
        if (k !== "content_id" && k !== "signature") body[k] = v;
      }
      const canonSorted = JSON.stringify(sortKeysDeep(body));
      const want = await sha256Hex(canonSorted);
      const res = await verifyEd25519Detached(
        new TextEncoder().encode(canonSorted),
        elo.signature?.sig || "",
        elo.signature?.pubkey || "",
        want,
        undefined,
      );
      setVerifyState(res.ok ? "ok" : "bad");
    } catch (e) {
      setVerifyState("bad");
    }
  }

  const rows =
    axis === "overall"
      ? elo?.leaderboard || []
      : (elo?.per_axis?.[axis] || []);

  if (elErr) return null; // panel simply absent if the resource is not there yet
  if (!elo) return null;

  return (
    <div className="mt-10 rounded-2xl border border-emerald-600/15 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Arena Elo — signed</h2>
          <p className="mt-1 text-sm text-gray-600">
            Per-axis winner-specific Elo from the live arena (<code>{elo.models || "—"}</code> models,{" "}
            {elo.axes?.length || 0} <strong>arena</strong> axes — the arena&apos;s own set, not the
            board&apos;s count above). Every score carries n + 95% CI. This leaderboard is{" "}
            <strong>signed</strong> — verify it below.
          </p>
        </div>
        <button
          onClick={verifySigned}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          data-testid="verify-arena-elo"
        >
          {verifyState === "checking" ? "Verifying…" : "Verify the signature"}
        </button>
      </div>
      {verifyState === "ok" && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" data-testid="verify-arena-elo-ok">
          ✓ Signature verified — this leaderboard matches the signed body.
        </p>
      )}
      {verifyState === "bad" && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" data-testid="verify-arena-elo-bad">
          ✗ Signature does NOT verify — content may have been altered.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-emerald-600/10 pt-4">
        <a
          href="/legal/licensing"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          data-testid="researcher-access"
        >
          Researcher access — verified rankings
        </a>
        <a
          href="/legal/licensing"
          className="rounded-xl border border-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Enterprise data license
        </a>
        <span className="text-xs text-gray-600">
          Free access is permanent and unconditional (researchers, journalists, fact-checkers) —
          see the licensing tiers for the license legs. Pricing lives on the legal surface.
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/compliance/eu-ai-act" className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-600/20 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50 sm:min-h-0">EU AI Act pack</Link>
        <Link href="/compliance/nist-ai-rmf" className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-600/20 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50 sm:min-h-0">NIST RMF pack</Link>
        <Link href="/compliance/uk-ai-bill" className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-600/20 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50 sm:min-h-0">UK AI Bill pack</Link>
        <Link href="/compliance/canada-ai-act" className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-600/20 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50 sm:min-h-0">Canada AI Act pack</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={axis === "overall"} onClick={() => setAxis("overall")} className={`inline-flex min-h-[44px] items-center rounded-full px-3 py-1 text-xs font-semibold sm:min-h-0 ${axis === "overall" ? "bg-emerald-700 text-white" : "border border-emerald-600/20 text-emerald-700 hover:bg-emerald-50"}`}>
          Overall
        </button>
        {(elo?.axes || []).map((a: string) => (
          <button type="button" key={a} aria-pressed={axis === a} onClick={() => setAxis(a)} className={`inline-flex min-h-[44px] items-center rounded-full px-3 py-1 text-xs font-semibold sm:min-h-0 ${axis === a ? "bg-emerald-700 text-white" : "border border-emerald-600/20 text-emerald-700 hover:bg-emerald-50"}`}>
            {a}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        {/* min-w so the wrapper actually SCROLLS on a phone. `w-full` alone made
            the wrapper never overflow and crushed every cell to one character
            per line at 375px ("Ga\nme\ns"). */}
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3 text-left font-semibold">Model</th>
              <th className="py-2 px-3 text-right font-semibold">Elo</th>
              <th className="py-2 px-3 text-right font-semibold">Games</th>
              <th className="py-2 px-3 text-right font-semibold">Win-rate</th>
              <th className="py-2 px-3 text-right font-semibold">95% CI</th>
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).slice(0, 12).map((r: any) => (
              <tr key={r.model} className="border-b border-gray-100">
                <td className="py-2 px-3 font-medium whitespace-nowrap text-gray-800">{r.model}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums text-gray-900">{r.elo}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums text-gray-600">{r.games}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums text-gray-600">{r.winrate}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap text-gray-600">
                  {r.ci ? `${r.ci[0]}–${r.ci[1]}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sortKeysDeep(v: any): any {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeysDeep(v[k]);
    return out;
  }
  return v;
}

// Short axis ids (HF dataset slugs, spine ids) → board axis names, so /gspc/gov
// and /gspc/governance both land on the same row.
const AXIS_ALIAS: Record<string, string> = {
  gov: "governance", agi: "safety", prv: "provenance", asi: "continuity",
  mcp: "conformance", oss: "openness", mach: "machinery-conformity",
  xr: "cross-reality", det: "detector-interop", art5: "art5-safeguard",
};

// The financial/domain axis IDS (a routing set, not a count — the count is
// derived from the board and never typed).
//
// CORRECTED 2026-08-26: this comment used to say these axes are NOT on the
// /api/gspc board. That stopped being true when the ADR-001 sweep put all 8 into
// the payload, and the stale assumption is exactly why the deep-dive below
// rendered NaN% — it fetched the richer financial JSON while ALSO matching the
// axis in `data.axes` and printing an accuracy field that does not exist there.
// They are now on the board AND have their own registry entry; this set routes
// /gspc/<financial-axis> to the richer deep-dive from /interop/financial-axes.json.
const FIN_AXIS_IDS = new Set([
  "provenance-controls", "reserve-attestation", "regulatory-framework",
  "distribution-integrity", "custody-disclosure", "ai-economy-index",
  "human-labour-index", "humanoid-labour-index",
]);

const FIN_CHIP: Record<string, string> = {
  MEASURED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  UNMEASURED: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function GspcScoreboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, axisParams] = useRoute("/gspc/:axis");
  const rawAxis = axisParams?.axis?.toLowerCase() ?? null;
  const wantAxis = rawAxis ? (AXIS_ALIAS[rawAxis] ?? rawAxis) : null;
  const isFinancialAxis = !!wantAxis && FIN_AXIS_IDS.has(wantAxis);
  const focused: Axis | null =
    data && wantAxis ? ((data.axes as Axis[]).find((a) => a.axis === wantAxis) ?? null) : null;

  // The count, derived from the payload this page already holds — no second fetch
  // and no typed literal. Before the payload lands we show the dated observation
  // recorded in facts.json rather than a placeholder or a zero.
  const board = boardCountFromPayload(data) ?? BOARD_COUNT_OBSERVED;

  const [finAxis, setFinAxis] = useState<any>(null);
  const [finRun, setFinRun] = useState<any>(null);
  useEffect(() => {
    if (!isFinancialAxis) return;
    Promise.all([
      fetch("/interop/financial-axes.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/interop/financial-measure-run.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([fa, mr]) => {
      if (fa && Array.isArray(fa.axes)) setFinAxis(fa.axes.find((a: any) => a.id === wantAxis) ?? null);
      if (mr && Array.isArray(mr.measured)) setFinRun(mr);
    });
  }, [isFinancialAxis, wantAxis]);

  useEffect(() => {
    document.title = "The GSPC board — live | Council of AI";
    setMetaDescription("The live GSPC board. Every measured cell has n and a 95% CI where honest. UNMEASURED is reported, never hidden. Counts and stamps come from GET /api/gspc.");
    const ac = new AbortController();
    const read = async () => {
      const r = await fetch("/api/gspc", { signal: ac.signal, headers: { accept: "application/json" } });
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (ct.includes("text/html")) throw new Error("HTML instead of JSON");
      const d = await r.json();
      if (!d || typeof d !== "object" || !Array.isArray(d.axes)) throw new Error("not a GSPC payload");
      return d;
    };
    read()
      .catch(() => new Promise((res) => setTimeout(res, 350)).then(read))
      .then((d) => {
        setData(d);
        const count = d?.totals?.public_count;
        if (typeof count === "string" && count.trim()) {
          document.title = `The GSPC board — ${count} | Council of AI`;
        }
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setErr(String(e));
      });
    return () => ac.abort();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DATASET_LD) }} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
          Live from GET /api/gspc — recompute anything, free
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">The GSPC board</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          {board.public_count} · deterministic grading on
          frozen, published splits · a <strong>TIE</strong> means the leader&apos;s edge is{" "}
          <strong>statistically indistinguishable</strong> (McNemar p≥0.05) — ties are never counted
          as wins. Empty cells stay empty.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-gray-600" data-testid="board-count-grammar">
          {board.count_grammar}
          {!board.live && (
            <>
              {" "}
              <em>
                (Counts shown are the last recorded observation of{" "}
                <a className="underline" href="/api/gspc">GET /api/gspc</a>; the live endpoint is the
                authority.)
              </em>
            </>
          )}
        </p>

        {err && <p className="mt-8 text-red-600">Board fetch failed: {err} — the API at /api/gspc is the source of truth.</p>}
        {!data && !err && <p className="mt-8 text-gray-600">Loading the live board…</p>}

        {isFinancialAxis && (
          <div className="mt-8 rounded-xl border border-emerald-600/25 bg-emerald-50/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Financial axis · {board.public_count}
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">{finAxis?.name ?? wantAxis}</h2>
            <p className="mt-1 font-mono text-xs text-gray-600">/gspc/{wantAxis}</p>
            {finAxis ? (
              <>
                <p className="mt-3">
                  <span
                    className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${FIN_CHIP[finAxis.status] || FIN_CHIP.UNMEASURED}`}
                  >
                    {finAxis.status}
                  </span>
                  {finAxis.candidate && (
                    <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      candidate slot
                    </span>
                  )}
                </p>
                {finAxis.rubric && <p className="mt-3 text-sm text-gray-700"><strong>Rubric.</strong> {finAxis.rubric}</p>}
                {finAxis.status === "MEASURED" && typeof finAxis.measured_count === "number" && (
                  <p className="mt-2 text-sm text-emerald-800">
                    {finAxis.measured_count} instruments measured · deterministic on-chain control facts.
                  </p>
                )}
                {finAxis.data && <p className="mt-2 text-xs text-gray-600"><strong>Data.</strong> {finAxis.data}</p>}
                {finAxis.bank_status && <p className="mt-2 text-xs text-gray-600"><strong>Input bank.</strong> {finAxis.bank_status}</p>}
                {finAxis.declared_as && <p className="mt-2 text-xs text-gray-600">{finAxis.declared_as}</p>}
                {finAxis.note && <p className="mt-2 text-xs italic text-gray-600">{finAxis.note}</p>}

                {finAxis.id === "provenance-controls" && finRun && Array.isArray(finRun.measured) && (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-600/10 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      On-chain control facts — signed run
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{finRun.network}. {finRun.honesty}</p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {finRun.measured.map((m: any) => (
                        <li key={m.instrument} className="rounded-lg border border-gray-100 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-800">{m.instrument}</span>
                            <a className="font-mono text-[11px] text-emerald-700 underline" href={m.explorer} target="_blank" rel="noopener noreferrer">
                              tx {m.devnet_tx.slice(0, 8)}…
                            </a>
                          </div>
                          <p className="mt-1 font-mono text-[11px] text-gray-600">
                            allowlisting {m.control_facts.facts.allowlisting_enforced ? "enforced" : "none"} · freeze {m.control_facts.facts.issuer_can_freeze ? "yes" : "no"} · domain {m.control_facts.facts.identity_domain_declared ? "declared" : "none"}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-gray-600">
                      Facts only. Risk verdicts remain UNMEASURED pending counsel. Not ratings, advice, or endorsements.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">Loading the financial-axes registry…</p>
            )}
            <p className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link className="font-semibold text-emerald-700 underline" href="/financial-axes">
                {board.financial_family ? `All ${board.financial_family.axes} financial axis` : "All financial axis"}
              </Link>
              <a className="font-semibold text-emerald-700 underline" href="/interop/financial-axes.json">Raw JSON</a>
              <Link className="font-semibold text-emerald-700 underline" href="/gspc-scoreboard">The behavioural board</Link>
            </p>
          </div>
        )}

        {wantAxis && data && !focused && !isFinancialAxis && (
          <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            No axis named <span className="font-mono">{wantAxis}</span> on the board — the full board
            is below. Every axis we publish is in GET /api/gspc; we never invent one for a URL.
          </p>
        )}

        {focused && (
          <div className="mt-8 rounded-xl border border-emerald-600/25 bg-emerald-50/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Axis deep-dive</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">{focused.axis}</h2>
            {(() => {
              const acc = accuracyCell(focused);
              return (
                <p className="mt-2 text-sm text-gray-700">
                  Bench <strong>{focused.bench}</strong> · n=<span className="font-mono">{focused.n}</span>
                  {focused.n_unit && <span className="text-gray-600"> {focused.n_unit}</span>} ·{" "}
                  {acc.state === "figure" && (
                    <>leader accuracy <span className="font-mono">{acc.prefix}{acc.text}</span></>
                  )}
                  {acc.state === "facts" && (
                    <span title={acc.title}>
                      no leader accuracy — this axis is measured by deterministic facts, not a model
                      comparison{acc.detail ? <> · coverage <strong>{acc.detail}</strong></> : null}
                    </span>
                  )}
                  {acc.state === "unmeasured" && (
                    <span title={acc.title}>leader accuracy <strong>{acc.text}</strong></span>
                  )}
                  {focused.interval && (
                    <> · 95% CI <span className="font-mono">{(focused.interval[0] * 100).toFixed(1)}–{(focused.interval[1] * 100).toFixed(1)}%</span></>
                  )} · separation{" "}
                  {focused.separation ? (
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${CHIP[focused.separation]}`}>
                      {focused.separation}
                    </span>
                  ) : (
                    <StatusChip kind={chipFor(focused.status, focused.separation, focused.kind)} />
                  )}
                </p>
              );
            })()}
            <p className="mt-3 flex flex-wrap gap-4 text-sm">
              {/* Only an axis WITH a frozen bank gets the bank link. A financial axis has
                  no HuggingFace bank; minting the URL anyway would publish a
                  resolvable-looking link to a 404. It carries evidence_url instead. */}
              {(focused as any).dataset_url || (focused as any).dataset ? (
                <a className="font-semibold text-emerald-700 underline" href={(focused as any).dataset_url ?? `https://huggingface.co/datasets/csoai/gspc-${rawAxis && AXIS_ALIAS[rawAxis] ? rawAxis : Object.entries(AXIS_ALIAS).find(([, v]) => v === focused.axis)?.[0] ?? focused.axis}`}>
                  Frozen gold bank (Hugging Face)
                </a>
              ) : focused.evidence_url ? (
                <a className="font-semibold text-emerald-700 underline" href={focused.evidence_url}>
                  Signed run (evidence)
                </a>
              ) : (
                <span className="text-gray-600">No bank and no signed run — nothing to link.</span>
              )}
              <Link className="font-semibold text-emerald-700 underline" href="/gspc-verify">Verify the signed chain</Link>
              <a className="font-semibold text-emerald-700 underline" href="/api/gspc">Raw JSON (GET /api/gspc)</a>
              <Link className="font-semibold text-emerald-700 underline" href="/gspc-scoreboard">Full board</Link>
            </p>
          </div>
        )}

        {data && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-emerald-600/15 bg-white shadow-sm">
            {/* See note on the Elo table above: without a min-width the board
                crushed at 375px and rendered n=237 as "23 / 7" on two lines. */}
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b bg-emerald-50/60 text-left text-gray-700">
                  <th className="p-3 whitespace-nowrap">Axis</th>
                  <th className="p-3 whitespace-nowrap">Bench</th>
                  <th className="p-3 whitespace-nowrap">n</th>
                  <th className="p-3 whitespace-nowrap">Leader accuracy</th>
                  <th className="p-3 whitespace-nowrap">95% CI</th>
                  <th className="p-3 whitespace-nowrap">Separation</th>
                </tr>
              </thead>
              <tbody>
                {/* RECONCILED: the accuracy/CI/separation cells are the corrected
                    renderers (accuracyCell / intervalCell / separationNote) that
                    replaced `(a.accuracy * 100).toFixed(1)` and its NaN%. The
                    whitespace-nowrap / tabular-nums / full-cell link are the 375px
                    layout fix — they are applied to the corrected cells, not to the
                    arithmetic that was removed. nowrap is deliberately NOT on the
                    accuracy or separation cells: both can carry a prose line
                    (coverage detail, separation note) that must still wrap. */}
                {(data.axes as Axis[]).map((a) => {
                  const acc = accuracyCell(a);
                  const ci = intervalCell(a);
                  const sepNote = separationNote(a);
                  return (
                    <tr key={a.axis} className={`border-b last:border-0 ${focused?.axis === a.axis ? "bg-emerald-50" : ""}`}>
                      <td className="whitespace-nowrap p-3 font-semibold text-gray-900">
                        {/* -m-3 p-3 makes the link fill its cell, so the touch
                            target is the whole row cell rather than a 17px line. */}
                        <Link href={`/gspc/${a.axis}`} className="-m-3 block p-3 hover:underline">{a.axis}</Link>
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600">{a.bench}</td>
                      <td className="whitespace-nowrap p-3 font-mono tabular-nums">
                        {a.n}
                        {a.n_unit && <span className="ml-1 text-[10px] text-gray-600">{a.n_unit}</span>}
                      </td>
                      <td className="p-3 font-mono tabular-nums" data-testid={`accuracy-${a.axis}`}>
                        {acc.state === "figure" && (
                          <span className="whitespace-nowrap">
                            {acc.prefix}{acc.text}
                            {acc.lowerBound && (
                              <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-600" title={acc.lowerBound}>
                                lower bound
                              </span>
                            )}
                          </span>
                        )}
                        {acc.state === "facts" && (
                          <span title={acc.title} className="text-gray-600">
                            {acc.text}
                            {acc.detail && (
                              <span className="ml-1 block font-sans text-[11px] text-gray-600">{acc.detail}</span>
                            )}
                          </span>
                        )}
                        {acc.state === "unmeasured" && (
                          <span title={acc.title} className="font-sans text-gray-600">{acc.text}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 font-mono tabular-nums text-gray-600" title={ci.title}>{ci.text}</td>
                      <td className="p-3">
                        {a.separation ? (
                          <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[a.separation]}`}>
                            {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                          </span>
                        ) : (
                          <StatusChip kind={chipFor(a.status, a.separation, a.kind)} />
                        )}
                        {sepNote && <span className="ml-2 text-[11px] text-gray-600">{sepNote}</span>}
                        {a.separation_p !== undefined && (
                          <span className="ml-2 whitespace-nowrap font-mono text-[11px] text-gray-600">p={a.separation_p}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BOARD ATTESTATION CHROME — Ed25519, SHA-256, XRPL, Progress */}
        {data && (
          <div className="mt-10">
            <BoardAttestation
              data={data}
              variant="light"
              showProgress={true}
              showInLane={false}
              compact={false}
            />
          </div>
        )}

        {data && <ArenaEloPanel />}

        {data && Array.isArray(data.measured_in_lane) && data.measured_in_lane.length > 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-emerald-600/25 bg-emerald-50/40 p-6">
            <h2 className="text-lg font-bold text-gray-900">In-lane — not board rows</h2>
            <p className="mt-1 text-sm text-gray-600">
              Published as <code>measured_in_lane</code> on GET /api/gspc. Not counted in totals.public_count.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.measured_in_lane.map((r: any) => (
                <li key={r.axis} className="rounded-xl border border-emerald-600/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900">{r.axis}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-gray-600">{r.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{r.bench || r.task}</p>
                  {typeof r.n === "number" && (
                    <p className="mt-2 font-mono text-sm tabular-nums text-gray-700">
                      {typeof r.accuracy === "number" ? (r.accuracy * 100).toFixed(0) : "—"} · n={r.n}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/gspc-verify" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            Verify a card — free, in your browser →
          </Link>
          <Link href="/honesty" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The honesty gate — our own losses →
          </Link>
          <a href="/api/reported" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            REPORTED — third-party context, cited →
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Measurement, not certification. Leaders shown are point estimates (swarm quotes its 95%
          lower bound); only SEPARATED leads are statistically real — the live count is
          totals.separated_leads on GET /api/gspc. Jail is a measured floor when the stamp
          publishes one, never a hidden score. Full per-axis notes, fleet means and harm tails:{" "}
          <code>GET /api/gspc</code>. The living stamp carried there is marked UNVERIFIABLE — it
          does not reproduce under any published rule and is not a checkable attestation; the
          attestation over that payload that does verify is <code>site_attestation</code>.
        </p>
      </div>
    </div>
  );
}
