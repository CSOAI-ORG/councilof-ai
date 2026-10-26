import type { ReactNode } from "react";
import { FOCUS, PRIMARY } from "./glass";

/**
 * HelpDoor — a pane's "go and read more" control that works with or without a host.
 *
 * The Council OS overlay passes its panes an `onOpenRoute(path, label)` opener; the Dashboard
 * renders the same panes with no props (DashboardPane.tsx `<C />`). The Evidence pack and Embed kit
 * panes called `onOpenRoute(...)` unconditionally, so in the Dashboard every help button threw a
 * TypeError on click and did nothing (re-test 7 Oct 2026). With an opener this is a button that
 * uses it; without one it is an ordinary link to the same page.
 */
export default function HelpDoor({
  path,
  label,
  children,
  primary = false,
  onOpenRoute,
  testId,
}: {
  path: string;
  label: string;
  children: ReactNode;
  primary?: boolean;
  onOpenRoute?: (path: string, label: string) => void;
  testId?: string;
}) {
  const cls = primary
    ? `${PRIMARY} min-h-11 px-3.5 py-2 text-[12.5px]`
    : `inline-flex min-h-11 items-center rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`;
  if (typeof onOpenRoute === "function") {
    return (
      <button type="button" onClick={() => onOpenRoute(path, label)} className={cls} data-testid={testId}>
        {children}
      </button>
    );
  }
  return (
    <a href={path} className={cls} data-testid={testId}>
      {children}
    </a>
  );
}
