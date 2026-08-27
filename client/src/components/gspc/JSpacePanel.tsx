/**
 * JSpacePanel — replay mode. The moat made visible.
 * Renders seven lines minimum per record (when expanded):
 *   1. anchored   (provision + corpus_hash)
 *   2. probe sent (subject family)
 *   3. response   (reason, in plain language)
 *   4. predicate  (deterministic name + resolvable pointer — subdued mono)
 *   5. verdict    (passed: true|false|null, with INCOMPLETE own-state)
 *   6. budget     (step_cap / steps_used)
 *   7. signed     (chain_hash, sig_alg — honest label only)
 *
 * Collapsed by default (except first). Expands on click.
 * Auto-expands when its jurisdiction is lit via the globe.
 *
 * Every figure carries its n. n<20 → "lower bound" badge on the same line.
 * INCOMPLETE renders visibly. Failure is as legible as success.
 */

import { useState, useEffect } from "react";
import type { JRecord, PredicateVerdict } from "@/data/arena";
import { useJurisdiction, LIT_RING_CLASS } from "./jurisdiction-link";

function verdictLabel(v: PredicateVerdict): { text: string; tone: "pass" | "fail" | "incomplete" } {
  if (v.passed === true) return { text: "PASS", tone: "pass" };
  if (v.passed === false) return { text: "FAIL", tone: "fail" };
  return { text: "INCOMPLETE", tone: "incomplete" };
}

const TONE_BADGE: Record<string, string> = {
  pass: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  fail: "border-red-400/40 bg-red-500/10 text-red-200",
  incomplete: "border-amber-400/40 bg-amber-500/10 text-amber-200",
};

const TONE_BAR: Record<string, string> = {
  pass: "bg-emerald-500/60",
  fail: "bg-red-500/60",
  incomplete: "bg-amber-500/60",
};

export function JSpacePanel({ record, defaultExpanded = false }: { record: JRecord; defaultExpanded?: boolean }) {
  const v = verdictLabel(record.verdict);
  const { active, select } = useJurisdiction();
  const jurisdiction = record.provision.jurisdiction;
  const isLit = active === jurisdiction;
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Auto-expand when jurisdiction is lit
  useEffect(() => {
    if (isLit) setExpanded(true);
  }, [isLit]);

  const nBadge =
    typeof record.n === "number" && record.n < 20 ? (
      <span
        className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200"
        title="Sample size below 20; report as lower bound"
      >
        n={record.n} · lower bound
      </span>
    ) : typeof record.n === "number" ? (
      <span className="ml-2 font-mono text-[11px] text-emerald-100/50">n={record.n}</span>
    ) : null;

  return (
    <article
      data-verdict={v.tone}
      className={`rounded-xl border bg-[#05140d] overflow-hidden transition-all ${
        isLit ? LIT_RING_CLASS : "border-emerald-500/20"
      }`}
    >
      {/* Collapsed header — always visible, click to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-emerald-500/[0.03] transition-colors"
      >
        {/* Verdict color bar */}
        <div className={`w-1 h-8 rounded-full shrink-0 ${TONE_BAR[v.tone]}`} />

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-emerald-100/40 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>

        {/* Record ID */}
        <span className="font-mono text-[12px] text-emerald-100/50 shrink-0">
          {record.record_id}
        </span>

        {/* Provision (abbreviated) */}
        <span className="hidden sm:inline text-[11px] text-emerald-100/40 truncate">
          {record.provision.section}
        </span>

        <span className="flex-1" />

        {/* Verdict badge */}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0 ${TONE_BADGE[v.tone]}`}
        >
          {v.text}
        </span>

        {/* Jurisdiction chip. NOT a <button>: this row's header is already a
            button, and button-in-button is invalid HTML — it shipped a React
            hydration error on /gspc-arena?view=arena (caught 2026-08-27 by
            driving the page). A span with role=button keeps the keyboard path. */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            select(jurisdiction, record.record_id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              select(jurisdiction, record.record_id);
            }
          }}
          title={`Light ${jurisdiction} on the globe, the C-space branches, and every J-record anchored there`}
          className={`rounded border px-1.5 py-0 font-mono text-[10px] transition-colors cursor-pointer shrink-0 ${
            isLit
              ? "border-amber-400/50 bg-[#03110b] text-amber-300"
              : "border-emerald-500/25 text-emerald-100/60 hover:border-emerald-400/50 hover:text-emerald-200"
          }`}
        >
          {jurisdiction} {isLit ? "◉" : "◌"}
        </span>
      </button>

      {/* Expanded detail table */}
      {expanded && (
        <div className="border-t border-emerald-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <table className="w-full text-[13px]">
            <tbody className="[&_th]:w-28 [&_th]:align-top [&_th]:pr-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-mono [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-emerald-100/35 [&_td]:py-1.5 [&_td]:align-top [&_tr]:border-b [&_tr]:border-emerald-500/[0.07] [&_tr:last-child]:border-0">
              <tr>
                <th>anchored</th>
                <td>
                  <strong className="text-emerald-50 text-[13px]">{record.provision.section}</strong>
                  <br />
                  <span className="font-mono text-[10px] text-emerald-100/35">
                    {record.provision.instrument} · {jurisdiction} · corpus_hash{" "}
                    {record.provision.corpus_hash.slice(0, 16)}… · as_of {record.provision.as_of}
                  </span>
                </td>
              </tr>
              <tr>
                <th>probe sent</th>
                <td>
                  <span className="font-mono text-emerald-100/80">{record.subject.id}</span>
                  <span className="text-emerald-100/50"> · {record.subject.family}</span>
                  {nBadge}
                </td>
              </tr>
              <tr>
                <th>response</th>
                <td className="text-emerald-100/70 leading-relaxed">{record.verdict.reason}</td>
              </tr>
              <tr>
                <th>predicate</th>
                <td>
                  <span className="font-mono text-[11px] text-emerald-100/35">
                    {record.verdict.predicate} · pointer: {record.verdict.pointer}
                  </span>
                </td>
              </tr>
              <tr>
                <th>verdict</th>
                <td>
                  <code className="font-mono text-[11px] text-emerald-100/60">
                    passed: {record.verdict.passed === null ? "null (INCOMPLETE)" : String(record.verdict.passed)}
                  </code>
                  {record.evidence_tag && (
                    <span
                      className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                        record.evidence_tag === "[MEASURED]"
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {record.evidence_tag}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <th>budget</th>
                <td className="font-mono text-[11px] text-emerald-100/50">
                  {`{ step_cap: ${record.budget.step_cap}, steps_used: ${record.budget.steps_used} }`}
                </td>
              </tr>
              <tr>
                <th>signed</th>
                <td>
                  <span className="font-mono text-[11px] text-emerald-100/40">
                    chain_hash {record.sigil.chain_hash.slice(0, 16)}… · sig_alg {record.sigil.sig_alg}
                  </span>
                  <br />
                  <span className="text-[10px] text-emerald-100/35">
                    Chain intact — tamper-evidence.
                    {record.sigil.sig_alg === "sha256"
                      ? " Ed25519 / ML-DSA ships with the label upgrade."
                      : ""}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
