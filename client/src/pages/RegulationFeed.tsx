import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Radio, Rss, Activity, ExternalLink, Globe2, Clock, AlertTriangle } from 'lucide-react';
import { COUNTRY_NAMES } from '@/data/regulationsGeo';

/**
 * RegulationFeed — the public "what's changed" feed (/feed). This is the live
 * crawler moat made VISIBLE: the CSOAI hive crawler monitors AI-governance
 * sources worldwide and writes deltas to /data/regulation-deltas.json. We fetch
 * that file at runtime and render it newest-first, with kind/jurisdiction
 * filters, colour-coded badges, relative times, and source links — so a visitor
 * can see, at a glance, that the platform is alive and updating daily.
 */

type DeltaKind =
  | 'new-instrument'
  | 'amendment'
  | 'enforcement'
  | 'guidance'
  | 'deadline-change';

interface RegulationDelta {
  at: string; // ISO timestamp
  kind: DeltaKind;
  frameworkSlug?: string;
  jurisdictions: string[]; // ISO3 or 'GLOBAL'
  summary: string;
  source: string; // url
}

const FEED_URL = '/data/regulation-deltas.json';

// kind → label + tailwind accent classes (emerald / sky / rose / slate / amber)
const KIND_META: Record<DeltaKind, { label: string; cls: string }> = {
  'new-instrument': { label: 'New instrument', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  amendment: { label: 'Amendment', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  enforcement: { label: 'Enforcement', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  guidance: { label: 'Guidance', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/40' },
  'deadline-change': { label: 'Deadline change', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

const KIND_ORDER: DeltaKind[] = ['new-instrument', 'amendment', 'enforcement', 'guidance', 'deadline-change'];

// Friendly jurisdiction label: ISO3 via COUNTRY_NAMES, GLOBAL → "Global",
// EUR → "European Union", else the raw code (always safe, never undefined).
function jurisdictionLabel(code: string): string {
  if (code === 'GLOBAL') return 'Global';
  if (code === 'EUR') return 'European Union';
  return COUNTRY_NAMES[code] || code;
}

// relative-time from an ISO string ("3 days ago"). Defensive against bad dates.
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  const mon = Math.round(day / 30);
  if (mon < 12) return `${mon} month${mon === 1 ? '' : 's'} ago`;
  const yr = Math.round(mon / 12);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}

// Strip the "[baseline]" first-seen marker so it can be rendered de-emphasised.
function splitBaseline(summary: string): { baseline: boolean; text: string } {
  const m = /^\s*\[baseline\]\s*/i.exec(summary);
  if (m) return { baseline: true, text: summary.slice(m[0].length).trim() };
  return { baseline: false, text: summary };
}

function isDeltaKind(k: unknown): k is DeltaKind {
  return typeof k === 'string' && (KIND_ORDER as string[]).includes(k);
}

export default function RegulationFeed() {
  const [entries, setEntries] = useState<RegulationDelta[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [kindFilter, setKindFilter] = useState<DeltaKind | 'all'>('all');
  const [jurFilter, setJurFilter] = useState<string>('all');

  useEffect(() => {
    let alive = true;
    fetch(FEED_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`feed ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (!alive) return;
        // Guard hard: only keep well-formed rows, never trust the shape blindly.
        const rows = Array.isArray(data)
          ? (data as any[]).filter(
              (e) =>
                e &&
                typeof e.at === 'string' &&
                isDeltaKind(e.kind) &&
                Array.isArray(e.jurisdictions) &&
                typeof e.summary === 'string' &&
                typeof e.source === 'string',
            ).map((e) => ({
              at: e.at,
              kind: e.kind as DeltaKind,
              frameworkSlug: typeof e.frameworkSlug === 'string' ? e.frameworkSlug : undefined,
              jurisdictions: (e.jurisdictions as unknown[]).filter((j): j is string => typeof j === 'string'),
              summary: e.summary,
              source: e.source,
            }))
          : [];
        setEntries(rows);
        setStatus('ready');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  // newest-first
  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [entries],
  );

  // jurisdictions present in the feed, for the <select>
  const allJurisdictions = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) for (const j of e.jurisdictions) s.add(j);
    return Array.from(s).sort((a, b) => jurisdictionLabel(a).localeCompare(jurisdictionLabel(b)));
  }, [entries]);

  const filtered = useMemo(
    () =>
      sorted.filter(
        (e) =>
          (kindFilter === 'all' || e.kind === kindFilter) &&
          (jurFilter === 'all' || e.jurisdictions.includes(jurFilter)),
      ),
    [sorted, kindFilter, jurFilter],
  );

  const mostRecent = sorted.length ? sorted[0].at : null;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="max-w-[1100px] mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <Radio className="w-6 h-6 text-emerald-400" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Regulation Radar — What&apos;s Changed
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            The CSOAI crawler continuously monitors AI-governance sources worldwide — regulators,
            commissions, standards bodies and enforcement agencies — and surfaces every change here,
            updated daily. This is the live signal behind the platform.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1">
              <Rss className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <strong className="text-slate-100">{entries.length}</strong>
              <span className="text-slate-400">changes tracked</span>
            </span>
            {mostRecent && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1">
                <Clock className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-slate-400">last update</span>
                <strong className="text-slate-100">{relativeTime(mostRecent)}</strong>
              </span>
            )}
          </div>
        </header>

        {/* Filters */}
        {status === 'ready' && entries.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKindFilter('all')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  kindFilter === 'all'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                All kinds
              </button>
              {KIND_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    kindFilter === k ? KIND_META[k].cls : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400">
              <Globe2 className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className="sr-only">Filter by jurisdiction</span>
              <select
                value={jurFilter}
                onChange={(e) => setJurFilter(e.target.value)}
                aria-label="Filter by jurisdiction"
                className="bg-slate-900/60 border border-slate-800 rounded-md px-2 py-1 text-sm text-slate-200 outline-none focus:border-emerald-500/60 cursor-pointer"
              >
                <option value="all">All jurisdictions</option>
                {allJurisdictions.map((j) => (
                  <option key={j} value={j}>
                    {jurisdictionLabel(j)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Live count for the current filter */}
        {status === 'ready' && entries.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Showing <strong className="text-slate-300">{filtered.length}</strong> of {entries.length}
          </div>
        )}

        {/* States */}
        {status === 'loading' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500 animate-pulse">
            Loading the radar…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-300 font-medium">Feed temporarily unavailable</p>
            <p className="text-slate-500 text-sm mt-1">
              The radar couldn&apos;t load right now. Please try again shortly.
            </p>
          </div>
        )}

        {status === 'ready' && entries.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
            No changes recorded yet — the crawler is warming up.
          </div>
        )}

        {status === 'ready' && entries.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
            No changes match this filter.
          </div>
        )}

        {/* Feed */}
        {status === 'ready' && filtered.length > 0 && (
          <ul className="space-y-4">
            {filtered.map((e, i) => {
              const meta = KIND_META[e.kind];
              const { baseline, text } = splitBaseline(e.summary);
              return (
                <li
                  key={`${e.at}-${i}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 transition hover:border-slate-700 hover:bg-slate-900/50"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    {e.jurisdictions.map((j) => (
                      <span
                        key={j}
                        className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-800/40 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        {jurisdictionLabel(j)}
                      </span>
                    ))}
                    {e.frameworkSlug && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300/80">
                        {e.frameworkSlug}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {relativeTime(e.at)}
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed">
                    {baseline && (
                      <span className="text-slate-500 text-xs uppercase tracking-wide mr-2">first seen</span>
                    )}
                    {text}
                  </p>

                  <div className="mt-3">
                    <a
                      href={e.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition"
                    >
                      source
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
