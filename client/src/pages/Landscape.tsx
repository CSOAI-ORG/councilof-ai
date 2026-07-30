import { useEffect } from "react";
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Landmark, Layers, Building2, Clock, BarChart3, ShieldCheck, Globe2 } from 'lucide-react';
import { cohortRisk, type CohortRisk } from '@/data/intel/risk';
import { ENTITIES } from '@/data/intel/entities';
import { COUNTRY_NAMES } from '@/data/regulationsGeo';
import { FRAMEWORKS } from '@/data/frameworks';
import { I18nProvider, useI18n } from '@/i18n';
import type { Dict } from '@/i18n/locales/en';
import type { DeadlineEvent } from '@/data/intel/types';

type TFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

/**
 * Landscape (/landscape) — the B2G AGGREGATE intelligence view. A regulator-facing product
 * that answers "how does this jurisdiction's AI landscape sit against the compliance clock?"
 * WITHOUT naming any company. Everything here is counts + a histogram, sourced from the
 * name-free cohortRisk() aggregate — never per-entity. Posture is HELP-FIRST: this maps who
 * is in scope and when, so they can be helped to comply — it is not an accusation engine.
 * Dark CSOAI cockpit styling (matches OpenGridWorks).
 */

const ALL = 'ALL';

function jurisdictionName(code: string, t: TFn): string {
  if (code === ALL) return t('allCoveredJurisdictions');
  return COUNTRY_NAMES[code] || code;
}

function frameworkName(slug: string): string {
  return FRAMEWORKS.find((f) => f.slug === slug)?.name || slug;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// "closer to now" — soonest upcoming beats already-in-force; among upcoming, smaller daysOut wins.
function isCloser(c: DeadlineEvent, cur: DeadlineEvent): boolean {
  const a = c.daysOut ?? Number.POSITIVE_INFINITY;
  const b = cur.daysOut ?? Number.POSITIVE_INFINITY;
  if (a >= 0 && b >= 0) return a < b;
  if (a >= 0 && b < 0) return true;
  if (a < 0 && b >= 0) return false;
  return a > b;
}

// Aggregate cohortRisk across every covered jurisdiction into one name-free "global" cohort.
function globalCohort(): CohortRisk {
  const isos = Array.from(new Set(ENTITIES.map((e) => e.jurisdiction)));
  const inScopeByFramework: Record<string, number> = {};
  const pressureHistogram: CohortRisk['pressureHistogram'] = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };
  let entityCount = 0;
  let nearestDeadline: DeadlineEvent | null = null;

  for (const iso of isos) {
    const c = cohortRisk(ENTITIES, iso);
    entityCount += c.entityCount;
    for (const [slug, n] of Object.entries(c.inScopeByFramework)) {
      inScopeByFramework[slug] = (inScopeByFramework[slug] ?? 0) + n;
    }
    for (const k of Object.keys(pressureHistogram) as Array<keyof typeof pressureHistogram>) {
      pressureHistogram[k] += c.pressureHistogram[k];
    }
    if (c.nearestDeadline && (!nearestDeadline || isCloser(c.nearestDeadline, nearestDeadline))) {
      nearestDeadline = c.nearestDeadline;
    }
  }

  return { jurisdiction: ALL, entityCount, inScopeByFramework, nearestDeadline, pressureHistogram };
}

const BUCKET_ORDER = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const;
// Bucket display labels are localized at render via BUCKET_LABEL_KEY (see below).
const BUCKET_COLOR: Record<(typeof BUCKET_ORDER)[number], string> = {
  '0-20': 'bg-slate-600',
  '21-40': 'bg-teal-600',
  '41-60': 'bg-emerald-500',
  '61-80': 'bg-amber-500',
  '81-100': 'bg-rose-500',
};

export default function Landscape() {
  useEffect(() => { document.title = "Landscape — Aggregate AI-Compliance Intelligence for Regulators | CSOAI"; }, []);
  return (
    <I18nProvider>
      <LandscapeInner />
    </I18nProvider>
  );
}

const BUCKET_LABEL_KEY: Record<(typeof BUCKET_ORDER)[number], keyof Dict> = {
  '0-20': 'bucketLow',
  '21-40': 'bucketModest',
  '41-60': 'bucketModerate',
  '61-80': 'bucketElevated',
  '81-100': 'bucketUrgent',
};

function LandscapeInner() {
  const { t } = useI18n();
  const [juris, setJuris] = useState<string>(ALL);

  // jurisdiction options = every covered jurisdiction, named & sorted (+ the All aggregate).
  const jurisdictionOptions = useMemo(() => {
    const isos = Array.from(new Set(ENTITIES.map((e) => e.jurisdiction)));
    isos.sort((a, b) => jurisdictionName(a, t).localeCompare(jurisdictionName(b, t)));
    return isos;
  }, [t]);

  const cohort = useMemo<CohortRisk>(
    () => (juris === ALL ? globalCohort() : cohortRisk(ENTITIES, juris)),
    [juris],
  );

  // in-scope-by-framework, sorted high → low, for the bar chart
  const frameworkBars = useMemo(() => {
    const entries = Object.entries(cohort.inScopeByFramework).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 0;
    return { entries, max };
  }, [cohort]);

  const histTotal = useMemo(
    () => BUCKET_ORDER.reduce((sum, k) => sum + cohort.pressureHistogram[k], 0),
    [cohort],
  );
  const histMax = useMemo(
    () => Math.max(1, ...BUCKET_ORDER.map((k) => cohort.pressureHistogram[k])),
    [cohort],
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Landmark className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Compliance <span className="text-emerald-400">Landscape</span>
          </h1>
        </div>
        <p className="text-slate-400 mb-3 max-w-2xl">{t('landscapeSubtitle')}</p>

        {/* Help-first / name-free posture note */}
        <div className="mb-6 inline-flex items-start gap-2 text-[11px] rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-200/90 max-w-2xl">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <b>{t('landscapePostureTitle')}</b> {t('landscapePostureBody')}
          </span>
        </div>

        {/* Jurisdiction picker */}
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Globe2 className="w-4 h-4 shrink-0" />
          <span className="font-bold uppercase tracking-wider text-emerald-400">{t('jurisdiction')}</span>
          <select
            value={juris}
            onChange={(e) => setJuris(e.target.value)}
            data-testid="jurisdiction-picker"
            className="bg-slate-800/60 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/60 cursor-pointer"
          >
            <option value={ALL}>{t('allCoveredJurisdictions')}</option>
            {jurisdictionOptions.map((j) => (
              <option key={j} value={j}>
                {jurisdictionName(j, t)}
              </option>
            ))}
          </select>
        </label>

        {/* Top stat cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              <Building2 className="w-4 h-4" /> {t('entitiesTracked')}
            </div>
            <div className="text-3xl font-extrabold tabular-nums text-slate-100">{cohort.entityCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">{jurisdictionName(cohort.jurisdiction, t)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              <Layers className="w-4 h-4" /> {t('frameworksInScope')}
            </div>
            <div className="text-3xl font-extrabold tabular-nums text-slate-100">
              {frameworkBars.entries.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{t('distinctBindingFrameworks')}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              <Clock className="w-4 h-4" /> {t('nearestDeadline')}
            </div>
            {cohort.nearestDeadline ? (
              <>
                <div className="text-lg font-bold text-amber-300 tabular-nums">
                  {t('daysLabel', { days: Math.max(0, cohort.nearestDeadline.daysOut ?? 0) })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate" title={cohort.nearestDeadline.label}>
                  {cohort.nearestDeadline.label}
                </div>
                <div className="text-[10px] text-slate-500">{fmtDate(cohort.nearestDeadline.date)}</div>
              </>
            ) : (
              <div className="text-sm text-slate-500">{t('noDatedObligation')}</div>
            )}
          </div>
        </div>

        {/* In-scope-by-framework bars */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
            <Layers className="w-4 h-4" /> {t('inScopeByFramework')}
          </div>
          {frameworkBars.entries.length > 0 ? (
            <div className="space-y-2.5" data-testid="framework-bars">
              {frameworkBars.entries.map(([slug, count]) => (
                <div key={slug} className="flex items-center gap-3">
                  <span className="w-40 sm:w-56 shrink-0 text-[12px] text-slate-300 truncate" title={frameworkName(slug)}>
                    {frameworkName(slug)}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ width: `${frameworkBars.max ? (count / frameworkBars.max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('noInScopeObligation')}</p>
          )}
        </div>

        {/* Pressure histogram */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <BarChart3 className="w-4 h-4" /> {t('pressureDistribution')}
            </div>
            <span className="text-[11px] text-slate-500">{t('entitiesCount', { count: histTotal })}</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4 max-w-xl">{t('pressureNote')}</p>
          <div className="flex items-end gap-3 h-40" data-testid="pressure-histogram">
            {BUCKET_ORDER.map((k) => {
              const v = cohort.pressureHistogram[k];
              const h = (v / histMax) * 100;
              return (
                <div key={k} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[11px] tabular-nums text-slate-300">{v}</span>
                  <div
                    className={`w-full rounded-t-md ${BUCKET_COLOR[k]}`}
                    style={{ height: `${Math.max(h, v > 0 ? 4 : 0)}%`, minHeight: v > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-slate-500 text-center">{t(BUCKET_LABEL_KEY[k])}</span>
                  <span className="text-[9px] text-slate-600 tabular-nums">{k}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-slate-600 max-w-2xl">{t('landscapeFootnote')}</p>
      </div>
    </div>
  );
}
