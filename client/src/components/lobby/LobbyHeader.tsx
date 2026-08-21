import { ALPHA_MAX, ALPHA_MIN, CONTROL, FOCUS, SURFACE, SP, TYPE, panelStyle } from "./glass";

/**
 * LobbyHeader — the site header, at the TOP of the overlay, spanning full width.
 *
 * It is not inside the centre pane and it never was meant to be: the mark, the
 * lobby's name, the transparency control and the window controls belong to the
 * WINDOW, not to whatever pane happens to be open. The three rails start below it.
 *
 * WINDOW CONTROLS. Minimise, expand/restore and close, each an icon plus a
 * visible text label at ≥sm, each with an aria-label, each in the focus-ring
 * system. The shortcuts are printed in the bar, not left for the reader to
 * discover: Esc closes, Cmd/Ctrl + . minimises.
 */

export function ColiseumGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9a9 5 0 0 1 18 0" />
      <path d="M3 9v9" /><path d="M21 9v9" />
      <path d="M7.5 9.6v8.4" /><path d="M12 9.9v8.1" /><path d="M16.5 9.6v8.4" />
      <path d="M2.5 18h19" />
      <path d="M9.6 18v-3.2a2.4 2.4 0 0 1 4.8 0V18" />
    </svg>
  );
}

const ICON = "h-4 w-4 shrink-0";

function IconMinimise() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" aria-hidden="true"><path d="M3.5 11.5h9" /></svg>
  );
}
function IconExpand() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.5H2.5V6" /><path d="M10 13.5h3.5V10" />
      <path d="M13.5 6V2.5H10" /><path d="M2.5 10v3.5H6" />
    </svg>
  );
}
function IconRestore() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 6H6V2.5" /><path d="M13.5 10H10v3.5" />
      <path d="M10 2.5V6h3.5" /><path d="M6 13.5V10H2.5" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
  );
}

export default function LobbyHeader({
  titleId,
  alpha,
  onAlpha,
  size,
  onToggleSize,
  onMinimise,
  onClose,
  railOpen,
  onToggleRail,
}: {
  titleId: string;
  alpha: number;
  onAlpha: (v: number) => void;
  size: "comfortable" | "full";
  onToggleSize: () => void;
  onMinimise: () => void;
  onClose: () => void;
  railOpen: boolean;
  onToggleRail: () => void;
}) {
  const pct = Math.round(alpha * 100);

  return (
    <header
      className={`${SURFACE} ${SP.row} flex w-full flex-wrap items-center gap-x-5 gap-y-2.5`}
      style={panelStyle}
    >
      <span className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white"
          aria-hidden="true"
        >
          <ColiseumGlyph className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span id={titleId} className={`block ${TYPE.title}`}>Council OS</span>
          <span className={`block ${TYPE.fine}`}>
            One workspace · measurement, not certification
          </span>
        </span>
      </span>

      {/* Transparency — a real labelled range, arrow-key operable, with a
          spoken value. It drives --lobby-alpha for every surface below. */}
      <label className="ml-auto flex items-center gap-2.5">
        <span className={`hidden sm:inline ${TYPE.section}`}>Transparency</span>
        <input
          type="range"
          min={ALPHA_MIN}
          max={ALPHA_MAX}
          step={0.01}
          value={alpha}
          onChange={(e) => onAlpha(Number(e.target.value))}
          aria-label="Panel transparency"
          aria-valuetext={`${pct}% opaque`}
          className={`h-1.5 w-28 cursor-pointer accent-emerald-700 sm:w-40 ${FOCUS}`}
        />
        <span className="w-11 text-right font-mono text-[11px] tabular-nums text-slate-600">
          {pct}%
        </span>
      </label>

      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleRail}
          aria-expanded={railOpen}
          aria-label={railOpen ? "Hide the right rail" : "Show the right rail"}
          className={`${CONTROL} ${SP.chip} hidden text-[12px] font-semibold lg:inline-flex`}
        >
          {railOpen ? "Hide rail" : "Show rail"}
        </button>

        <button
          type="button"
          onClick={onToggleSize}
          aria-label={size === "full" ? "Restore Council OS to a windowed size" : "Expand Council OS to fill the screen"}
          title={size === "full" ? "Restore" : "Expand"}
          className={`${CONTROL} ${SP.chip} text-[12px] font-semibold`}
        >
          {size === "full" ? <IconRestore /> : <IconExpand />}
          <span className="hidden sm:inline">{size === "full" ? "Restore" : "Expand"}</span>
        </button>

        <button
          type="button"
          onClick={onMinimise}
          aria-label="Minimise Council OS, keeping this session"
          title="Minimise (Cmd/Ctrl + .)"
          className={`${CONTROL} ${SP.chip} text-[12px] font-semibold`}
        >
          <IconMinimise />
          <span className="hidden sm:inline">Minimise</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Council OS"
          title="Close (Esc)"
          className={`${SP.chip} inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-slate-900 text-[12px] font-semibold text-white transition hover:bg-slate-800 motion-reduce:transition-none ${FOCUS}`}
        >
          <IconClose />
          <span className="hidden sm:inline">Close</span>
        </button>
      </span>

      {/* Keyboard shortcuts are a pointer/keyboard affordance — on a touch
          viewport they are noise, and at 375px they cost a third of the pane. */}
      <p className={`hidden w-full sm:block ${TYPE.fine}`}>
        <kbd className="rounded border border-slate-900/15 bg-white px-1 font-mono text-[10px]">Esc</kbd> close ·{" "}
        <kbd className="rounded border border-slate-900/15 bg-white px-1 font-mono text-[10px]">⌘/Ctrl .</kbd> minimise ·{" "}
        <kbd className="rounded border border-slate-900/15 bg-white px-1 font-mono text-[10px]">↑ ↓</kbd> panes
      </p>
    </header>
  );
}
