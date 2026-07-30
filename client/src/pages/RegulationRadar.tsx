import { useEffect } from "react";
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Radar, Clock, Globe2, Filter, ChevronRight, AlertTriangle } from 'lucide-react';
import { upcomingDeadlines, nextDeadline } from '@/data/intel/deadlines';
import { COUNTRY_NAMES } from '@/data/regulationsGeo';
import { I18nProvider, useI18n } from '@/i18n';
import type { Dict } from '@/i18n/locales/en';
import type { DeadlineEvent } from '@/data/intel/types';

type TFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

/**
 * RegulationRadar (/radar) — the global AI-regulation deadline radar. It turns the live
 * deadline engine (deadlines.ts) into a single scannable timeline of every upcoming
 * compliance deadline worldwide, soonest first. Binding-only toggle + jurisdiction picker.
 * Each row deep-links into the OpenGridWorks map for that jurisdiction. Pure read of the
 * shared intel data — no API, no key. Dark CSOAI cockpit styling (matches OpenGridWorks).
 */

// Friendly name for a jurisdiction code ('GLOBAL' is a sentinel, not an ISO3).
function jurisdictionName(code: string, t: TFn): string {
  if (code === 'GLOBAL') return t('global');
  return COUNTRY_NAMES[code] || code;
}

// Pretty ISO date → "12 Aug 2026".
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// Countdown label + urgency colour from daysOut.
function countdown(days: number, t: TFn): { label: string; tone: string } {
  if (days <= 0) return { label: t('inForce'), tone: 'text-rose-300' };
  if (days === 1) return { label: t('oneDay'), tone: 'text-rose-300' };
  if (days <= 30) return { label: t('daysCountdown', { days }), tone: 'text-rose-300' };
  if (days <= 90) return { label: t('daysCountdown', { days }), tone: 'text-amber-300' };
  if (days <= 365) return { label: t('daysCountdown', { days }), tone: 'text-emerald-300' };
  return { label: t('daysCountdown', { days }), tone: 'text-slate-400' };
}

function DeadlineRow({ d }: { d: DeadlineEvent }) {
  const { t } = useI18n();
  const days = d.daysOut ?? 0;
  const cd = countdown(days, t);
  // first listed jurisdiction drives the deep-link into the map
  const region = d.jurisdictions[0] && d.jurisdictions[0] !== 'GLOBAL' ? d.jurisdictions[0] : undefined;
  const href = region ? `/opengridworks?region=${region}` : '/opengridworks';
  return (
    <a
      href={href}
      data-testid={`deadline-${d.frameworkSlug}-${d.date}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70 px-4 py-3 transition"
    >
      <div className="w-20 shrink-0 text-right">
        <div className={`text-sm font-bold tabular-nums ${cd.tone}`}>{cd.label}</div>
        <div className="text-[10px] text-slate-500 tabular-nums">{fmtDate(d.date)}</div>
      </div>
      <div className="h-10 w-px bg-slate-800 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-100 truncate">{d.label}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              d.binding ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            {d.binding ? t('bindingBadge') : t('voluntaryBadge')}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {d.jurisdictions.slice(0, 6).map((j) => (
            <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300">
              {jurisdictionName(j, t)}
            </span>
          ))}
          {d.jurisdictions.length > 6 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-500">
              +{d.jurisdictions.length - 6}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0" />
    </a>
  );
}

export default function RegulationRadar() {
  useEffect(() => { document.title = "Regulation Radar — Global AI Compliance Deadline Tracker | CSOAI"; }, []);
  return (
    <I18nProvider>
      <RegulationRadarInner />
    </I18nProvider>
  );
}

function RegulationRadarInner() {
  const { t } = useI18n();
  const [bindingOnly, setBindingOnly] = useState(false);
  const [juris, setJuris] = useState<string>('ALL');

  // full upcoming radar, computed once (pure, deterministic for "today")
  const all = useMemo(() => upcomingDeadlines(), []);
  const headline = useMemo(() => nextDeadline(), []);

  // jurisdiction options = every code that appears across the radar (+ Global), named & sorted
  const jurisdictionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of all) for (const j of d.jurisdictions) set.add(j);
    const codes = Array.from(set);
    codes.sort((a, b) => {
      if (a === 'GLOBAL') return -1;
      if (b === 'GLOBAL') return 1;
      return jurisdictionName(a, t).localeCompare(jurisdictionName(b, t));
    });
    return codes;
  }, [all, t]);

  const rows = useMemo(
    () =>
      all.filter(
        (d) =>
          (!bindingOnly || d.binding) &&
          (juris === 'ALL' || d.jurisdictions.includes(juris)),
      ),
    [all, bindingOnly, juris],
  );

  const bindingCount = rows.filter((r) => r.binding).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Radar className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Regulation <span className="text-emerald-400">Radar</span>
          </h1>
        </div>
        <p className="text-slate-400 mb-6 max-w-2xl">{t('radarSubtitle')}</p>

        {/* Headline: the single next binding deadline anywhere */}
        {headline && (
          <a
            href={
              headline.jurisdictions[0] && headline.jurisdictions[0] !== 'GLOBAL'
                ? `/opengridworks?region=${headline.jurisdictions[0]}`
                : '/opengridworks'
            }
            data-testid="headline-deadline"
            className="block mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/40 p-5 hover:border-amber-400/60 transition"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-300/80 mb-2">
              <AlertTriangle className="w-4 h-4" /> {t('nextBindingAnywhere')}
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-lg font-bold text-slate-100">{headline.label}</div>
                <div className="text-sm text-slate-400 mt-0.5">
                  {fmtDate(headline.date)} ·{' '}
                  {headline.jurisdictions.map((j) => jurisdictionName(j, t)).join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold tabular-nums text-amber-300">
                  {Math.max(0, headline.daysOut ?? 0)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{t('daysOutShort')}</div>
              </div>
            </div>
          </a>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Filter className="w-4 h-4" /> {t('filter')}
          </div>
          <button
            onClick={() => setBindingOnly((v) => !v)}
            data-testid="toggle-binding"
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
              bindingOnly
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {bindingOnly ? t('bindingOnlyActive') : t('bindingOnly')}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <Globe2 className="w-4 h-4 shrink-0" />
            <select
              value={juris}
              onChange={(e) => setJuris(e.target.value)}
              data-testid="jurisdiction-picker"
              className="bg-slate-800/60 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/60 cursor-pointer"
            >
              <option value="ALL">{t('allJurisdictions')}</option>
              {jurisdictionOptions.map((j) => (
                <option key={j} value={j}>
                  {jurisdictionName(j, t)}
                </option>
              ))}
            </select>
          </label>
          <span className="ms-auto text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {t('radarCount', { upcoming: rows.length, binding: bindingCount })}
          </span>
        </div>

        {/* Timeline */}
        {rows.length > 0 ? (
          <div className="space-y-2" data-testid="radar-timeline">
            {rows.map((d) => (
              <DeadlineRow key={`${d.frameworkSlug}-${d.date}-${d.label}`} d={d} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-sm">
            {t('radarEmpty')}
          </div>
        )}

        <p className="mt-8 text-[11px] text-slate-600 max-w-2xl">{t('radarFootnote')}</p>
      </div>
    </div>
  );
}
