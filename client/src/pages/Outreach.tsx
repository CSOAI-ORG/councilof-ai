import { useEffect } from "react";
import { useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Send, Download, Clock, Filter, HandHeart, Globe2, Building2, Check,
} from 'lucide-react';
import { ENTITIES } from '@/data/intel/entities';
import { prioritise } from '@/data/intel/risk';
import { COUNTRY_NAMES, frameworkBySlug } from '@/data/regulationsGeo';
import type { Entity, RiskSignal } from '@/data/intel/types';

/**
 * Help-First Outreach Queue — the action layer over the risk engine.
 *
 * POSTURE (read before changing anything here): this is an INTERNAL CSOAI
 * sales/success tool. It may name entities (it is not the public B2G view), but its
 * single job is to rank "who should we reach out to HELP comply, soonest." The pressure
 * score answers "who needs help soonest", NEVER "who is breaking the law." Every string
 * the user sees — the posture line, the row rationale, the drafted outreach message — is
 * help-first: "prepare / comply / we can help", never "non-compliant / violating".
 */

const BG = '#070b14';

/** Friendly country name with ISO-3 fallback. */
function countryName(iso3: string): string {
  return COUNTRY_NAMES[iso3] ?? iso3;
}

/** Display name of the framework a signal points at (its obligationSlug is a framework slug). */
function frameworkName(slug: string): string {
  return frameworkBySlug(slug)?.name ?? slug;
}

/** The deadline's calendar date for display, or a neutral fallback. */
function deadlineDate(signal: RiskSignal): string {
  return signal.deadline?.date ?? '—';
}

/** Signed days-out from the deadline radar (negative = already in force). */
function daysOut(signal: RiskSignal): number | undefined {
  return signal.deadline?.daysOut;
}

/** Help-first phrasing of the deadline timing — never an accusation. */
function timingLabel(signal: RiskSignal): string {
  const d = daysOut(signal);
  if (d == null) return 'no dated obligation yet';
  if (d < 0) return `in force ${Math.abs(d)} days — help is timely`;
  if (d === 0) return 'in force today';
  return `${d} days to prepare`;
}

/** CSV-safe cell: wrap in quotes and escape embedded quotes. */
function csvCell(value: string | number): string {
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Build the help-first outreach message for one entity + its top signal. Help-first by
 * construction: it states a scope + deadline FACT and offers CSOAI's help to PREPARE —
 * it never asserts non-compliance.
 */
function draftMessage(entity: Entity, signal: RiskSignal): string {
  const fw = frameworkName(signal.obligationSlug);
  const date = deadlineDate(signal);
  const d = daysOut(signal);
  const when =
    d == null
      ? `${fw} is developing in your jurisdiction`
      : d < 0
        ? `${fw} took effect on ${date}`
        : `${fw} takes effect on ${date} (${d} days away)`;
  return [
    `Hi ${entity.name} team,`,
    '',
    `We noticed ${entity.name} operates AI systems likely in scope of ${fw}, and that ${when}. ` +
      `We're reaching out because CSOAI can help you get prepared in good time — not to flag anything, simply to support you toward readiness.`,
    '',
    `CSOAI maps your AI systems to ${fw} (and the global standards alongside it), gives you a clear readiness checklist, ` +
      `and provides the compliance tooling and crosswalks to make preparing straightforward.`,
    '',
    `Would a short, no-pressure call to walk through how we can help be useful? Happy to work to your timeline.`,
    '',
    `Warm regards,`,
    `The CSOAI team`,
  ].join('\n');
}

const SUBJECT = (entity: Entity, signal: RiskSignal) =>
  `CSOAI — happy to help ${entity.name} prepare for ${frameworkName(signal.obligationSlug)}`;

/** Colour band for the pressure bar — "needs help soonest", not severity of conduct. */
function pressureColor(p: number): string {
  if (p >= 80) return '#34d399';
  if (p >= 60) return '#10b981';
  if (p >= 40) return '#0d9488';
  if (p >= 20) return '#0e7490';
  return '#334155';
}

type Row = { entity: Entity; topSignal: RiskSignal; score: number };

export default function Outreach() {
  useEffect(() => { document.title = "Help-First Outreach Queue | CSOAI"; }, []);
  const ranked: Row[] = useMemo(() => prioritise(ENTITIES), []);

  const [jurisdiction, setJurisdiction] = useState<string>('ALL');
  const [sector, setSector] = useState<string>('ALL');
  const [copied, setCopied] = useState<string | null>(null);

  const jurisdictions = useMemo(() => {
    const set = new Set<string>();
    ranked.forEach((r) => set.add(r.entity.jurisdiction));
    return Array.from(set).sort((a, b) => countryName(a).localeCompare(countryName(b)));
  }, [ranked]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    ranked.forEach((r) => { if (r.entity.sector) set.add(r.entity.sector); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [ranked]);

  const rows = useMemo(
    () =>
      ranked.filter(
        (r) =>
          (jurisdiction === 'ALL' || r.entity.jurisdiction === jurisdiction) &&
          (sector === 'ALL' || r.entity.sector === sector),
      ),
    [ranked, jurisdiction, sector],
  );

  const copyMessage = useCallback((entity: Entity, signal: RiskSignal) => {
    const text = draftMessage(entity, signal);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => { /* clipboard may be blocked */ });
    }
    setCopied(entity.slug);
    window.setTimeout(() => setCopied((c) => (c === entity.slug ? null : c)), 2000);
  }, []);

  const exportCsv = useCallback(() => {
    const header = [
      'Name', 'Jurisdiction', 'Sector', 'Top obligation',
      'Deadline date', 'Days out', 'Pressure',
    ];
    const lines = [header.map(csvCell).join(',')];
    for (const r of rows) {
      const d = daysOut(r.topSignal);
      lines.push([
        csvCell(r.entity.name),
        csvCell(countryName(r.entity.jurisdiction)),
        csvCell(r.entity.sector ?? ''),
        csvCell(frameworkName(r.topSignal.obligationSlug)),
        csvCell(deadlineDate(r.topSignal)),
        csvCell(d == null ? '' : d),
        csvCell(r.score),
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csoai-outreach-queue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div className="min-h-screen text-slate-200" style={{ background: BG }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-2.5">
              <HandHeart className="w-6 h-6 text-emerald-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Help-First Outreach Queue
            </h1>
          </div>
          <p className="text-slate-400 max-w-3xl leading-relaxed">
            Ranked by who is in scope of the nearest binding deadline — so CSOAI can reach
            out to <span className="text-emerald-300">help</span> them prepare. Scope +
            deadline signals, never a compliance verdict.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" aria-hidden="true" /> Jurisdiction
            </span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              aria-label="Filter by jurisdiction"
              data-testid="filter-jurisdiction"
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/60 cursor-pointer min-w-[12rem]"
            >
              <option value="ALL">All jurisdictions</option>
              {jurisdictions.map((j) => (
                <option key={j} value={j}>{countryName(j)}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" /> Sector
            </span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              aria-label="Filter by sector"
              data-testid="filter-sector"
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/60 cursor-pointer min-w-[12rem]"
            >
              <option value="ALL">All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              {rows.length} organisation{rows.length === 1 ? '' : 's'} to help
            </span>
            <button
              onClick={exportCsv}
              data-testid="export-csv"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Queue */}
        <ol className="space-y-3">
          {rows.map((r, i) => {
            const sig = r.topSignal;
            const mailto =
              `mailto:?subject=${encodeURIComponent(SUBJECT(r.entity, sig))}` +
              `&body=${encodeURIComponent(draftMessage(r.entity, sig))}`;
            return (
              <li
                key={r.entity.slug}
                data-testid="outreach-row"
                className="rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Rank + identity */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="text-sm font-mono text-slate-600 w-8 shrink-0 pt-0.5">
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-white truncate">
                          {r.entity.name}
                        </span>
                        <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <Globe2 className="w-3 h-3" aria-hidden="true" />
                          {countryName(r.entity.jurisdiction)}
                        </span>
                        {r.entity.sector && (
                          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" aria-hidden="true" />
                            {r.entity.sector}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-emerald-300/90">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {frameworkName(sig.obligationSlug)} · {deadlineDate(sig)} · {timingLabel(sig)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                        {sig.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Pressure + actions */}
                  <div className="flex items-center gap-4 lg:flex-col lg:items-end shrink-0">
                    <div className="w-40">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Needs help soonest</span>
                        <span className="font-mono text-slate-300">{r.score.toFixed(0)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(2, Math.min(100, r.score))}%`,
                            background: pressureColor(r.score),
                          }}
                          aria-label={`Help-priority ${r.score} of 100`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={mailto}
                        data-testid="draft-mailto"
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 px-3 py-2 text-sm text-emerald-200 transition-colors whitespace-nowrap"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        Draft outreach
                      </a>
                      <button
                        onClick={() => copyMessage(r.entity, sig)}
                        data-testid="draft-copy"
                        aria-label={`Copy help-first outreach message for ${r.entity.name}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-emerald-500/60 px-3 py-2 text-sm text-slate-300 transition-colors whitespace-nowrap"
                      >
                        {copied === r.entity.slug ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                            Copied
                          </>
                        ) : (
                          <>Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}

          {rows.length === 0 && (
            <li className="rounded-2xl bg-slate-900/50 border border-slate-800 p-8 text-center text-slate-500">
              No organisations match these filters. Adjust the jurisdiction or sector to see
              who CSOAI can help next.
            </li>
          )}
        </ol>

        <p className="mt-8 text-xs text-slate-600 max-w-3xl leading-relaxed">
          Internal CSOAI sales &amp; success tool. Ordering reflects deadline proximity ×
          scope confidence — a help-first prioritisation of who to support next, not a
          breach score or a compliance finding. Every signal is a scope + calendar fact.
        </p>
      </div>
    </div>
  );
}
