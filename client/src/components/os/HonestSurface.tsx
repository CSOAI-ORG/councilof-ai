/**
 * HonestSurface — shared chips and headers for Council OS and Council software.
 *
 * Emerald = measured surfaces (board, verify, assess, hub).
 * Gold/amber = local play (nothing deployed as a game).
 */

export type SurfaceKind = "measured" | "play";

const MEASURED_BADGE =
  "rounded-full border border-emerald-700/30 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-800";

const PLAY_BADGE =
  "rounded-full border border-amber-600/35 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800";

export function HonestSurfaceBadge({ kind }: { kind: SurfaceKind }) {
  return (
    <span className={kind === "play" ? PLAY_BADGE : MEASURED_BADGE}>
      {kind === "play" ? "not a measurement surface" : "measured surface"}
    </span>
  );
}

export function HonestStatusChip({
  live,
  liveLabel = "opens a page",
  buildLabel = "in build",
}: {
  live: boolean;
  liveLabel?: string;
  buildLabel?: string;
}) {
  return (
    <span
      className={
        "shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide " +
        (live
          ? "border-emerald-700/30 bg-emerald-50 text-emerald-800"
          : "border-amber-700/35 bg-amber-100 text-amber-900")
      }
    >
      {live ? liveLabel : buildLabel}
    </span>
  );
}

export function HonestSurfaceHeader({
  title,
  kind,
  notice,
  path,
  className = "",
}: {
  title: string;
  kind: SurfaceKind;
  notice: string;
  path?: string;
  className?: string;
}) {
  return (
    <header className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">{title}</h2>
        <HonestSurfaceBadge kind={kind} />
        {path && (
          <span className="font-mono text-[11px] text-slate-600">{path}</span>
        )}
      </div>
      <p className="max-w-[62ch] text-[13px] leading-relaxed text-slate-700">{notice}</p>
    </header>
  );
}

/** OpenRouter-style inner tabs — same spacing rhythm as Council OS glass tokens. */
export const INNER_UI = {
  page: "p-6 md:p-8 space-y-6",
  section: "space-y-5",
  cardGrid: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
  tabBar: "flex flex-wrap gap-1.5 rounded-xl border border-border bg-muted/30 p-1.5",
  tabActive: "bg-background text-foreground shadow-sm",
  tabIdle: "text-muted-foreground hover:text-foreground",
  tabBtn: "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
} as const;
