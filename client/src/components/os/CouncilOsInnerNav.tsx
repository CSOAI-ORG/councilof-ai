import { useLocation } from "wouter";
import { openLobby, lobbyHref } from "@/lib/lobbyLink";
import { COUNCIL_OS_PRIMARY, COUNCIL_OS_MEASURE, COUNCIL_OS_TOOLING, navItemForPath } from "@/lib/councilOsNav";
import { useOsOpen } from "@/lib/osChrome";

/**
 * CouncilOsInnerNav — persistent product rail (OpenRouter / LMArena / Moody's pattern).
 * Sits under page hero; syncs highlight with route; opens Council OS pane on secondary click.
 */
export default function CouncilOsInnerNav({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const [location] = useLocation();
  const osOpen = useOsOpen();
  const active = navItemForPath(location);

  if (osOpen) return null;

  const renderItem = (item: (typeof COUNCIL_OS_PRIMARY)[0]) => {
    const on = active?.id === item.id;
    const cls =
      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
      (on
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900");

    if (item.external) {
      return (
        <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className={cls}>
          {item.label}
        </a>
      );
    }

    return (
      <a
        key={item.id}
        href={item.href}
        className={cls}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          if (item.pane) {
            e.preventDefault();
            openLobby({ pane: item.pane, task: item.task, path: item.href });
          }
        }}
        title={item.description}
      >
        {item.label}
      </a>
    );
  };

  return (
    <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-2">
            {title && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {COUNCIL_OS_PRIMARY.map(renderItem)}
          <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:inline" aria-hidden />
          {COUNCIL_OS_MEASURE.map(renderItem)}
          <a
            href={lobbyHref({ pane: "home" })}
            className="ml-auto shrink-0 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            onClick={(e) => {
              e.preventDefault();
              openLobby({ pane: "home" });
            }}
          >
            Open Council OS
          </a>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Tooling</span>
          {COUNCIL_OS_TOOLING.map(renderItem)}
        </div>
      </div>
    </div>
  );
}
