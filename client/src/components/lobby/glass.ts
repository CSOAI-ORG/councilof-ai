/**
 * glass — the Council Lobby's white glass-OS design tokens.
 *
 * ONE PLACE for the ground, the spacing scale and the type ramp, so no component
 * in this folder picks a padding or a grey by hand. If a value is not in here it
 * does not belong in a lobby component.
 *
 * THE GROUND IS WHITE. Translucent white surfaces over a lightly whitened,
 * blurred page. Emerald stays the accent; gold/amber is reserved for the local
 * -play gallery so a game surface can never be mistaken for a measurement one.
 *
 * CONTRAST — MEASURED, NOT ASSUMED. Ratios below were computed against the
 * WORST CASE: the most transparent setting (alpha 0.55) composited over a pure
 * BLACK page, i.e. panel ground #e5e6e7. On that ground slate-900 title text is
 * 14.3:1, slate-700 body 8.3:1, slate-600 (section / fine / mono) 6.1:1 and the
 * emerald-800 link 6.2:1 — all clear of the WCAG AA 4.5:1 body floor. slate-500
 * and slate-400 were REMOVED from the ramp because they measured 3.8:1 and
 * 2.1:1 on that same ground: on a white glass surface they are the exact
 * light-on-light failure this redesign had to avoid.
 *
 * The alpha floor is 0.55, not 0. Light-on-light is the classic glass
 * failure, so the overlay lays a near-opaque white scrim over the page FIRST and
 * the panels sit on that: at the most transparent setting a panel still resolves
 * to ~93% white, which keeps slate-900 body text far above the WCAG AA 4.5:1
 * floor. The slider changes how much of the page shows through; it can never
 * push text into the unreadable band.
 */
import type { CSSProperties } from "react";

export const ALPHA_MIN = 0.55;
export const ALPHA_MAX = 1;
export const ALPHA_DEFAULT = 0.82;

/**
 * The spacing scale. Six steps, and every lobby surface uses one of them.
 * Nothing here is an ad-hoc pixel value.
 */
export const SP = {
  /** Overlay shell: the inset around the whole lobby and the gap between rails. */
  shell: "gap-4 p-4",
  /** A rail's inner padding. */
  rail: "p-4",
  /** A content panel's inner padding — the most generous step. */
  panel: "p-5",
  /** A card inside a panel. */
  card: "p-4",
  /** A list row / header band. */
  row: "px-5 py-3.5",
  /** A chip or pill. */
  chip: "px-3 py-1.5",
  /** Vertical rhythm inside a panel. */
  stack: "space-y-4",
  /** Vertical rhythm inside a list. */
  stackTight: "space-y-2.5",
} as const;

/** The type ramp. Comfortable line-length is enforced with `measure` below. */
export const TYPE = {
  title: "text-[15px] font-semibold leading-tight tracking-tight text-slate-900",
  section: "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600",
  body: "text-[13px] leading-relaxed text-slate-700",
  muted: "text-[12px] leading-relaxed text-slate-600",
  fine: "text-[11px] leading-relaxed text-slate-600",
  mono: "font-mono text-[11px] leading-relaxed text-slate-600",
  /** Conversation — larger than body so the ask thread is the readable surface. */
  chat: "text-[15.5px] leading-[1.65] text-slate-800",
} as const;

/** Comfortable line length for prose. */
export const MEASURE = "max-w-[62ch]";

/** Conversation measure — a little wider than body, still a single readable column. */
export const MEASURE_CHAT = "max-w-[72ch]";

/** The glass surface: hairline white edge, soft shadow, generous radius. */
export const SURFACE =
  "rounded-2xl border border-white/60 ring-1 ring-slate-900/5 " +
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-14px_rgba(15,23,42,0.28)]";

/** A raised surface — the chat bar, the docked minimised bar. */
export const SURFACE_LIFTED =
  "rounded-2xl border border-white/70 ring-1 ring-slate-900/5 " +
  "shadow-[0_2px_4px_rgba(15,23,42,0.05),0_20px_50px_-18px_rgba(15,23,42,0.38)]";

/**
 * The focus ring. Visible, on every interactive control, in one place — this is
 * the whole reason a keyboard user can find themselves on a glass surface.
 */
export const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** A quiet control (window buttons, rail toggles). */
export const CONTROL =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 " +
  "bg-white/70 text-slate-700 transition hover:bg-white hover:text-slate-900 " +
  "motion-reduce:transition-none " + FOCUS;

/** The one primary action. emerald-700 keeps white text at 4.98:1 — AA. */
export const PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-emerald-700 font-semibold text-white " +
  "transition hover:bg-emerald-800 disabled:opacity-50 motion-reduce:transition-none " + FOCUS;

/** Every panel reads its ground from the single `--lobby-alpha` custom property. */
export const panelStyle: CSSProperties = { background: "rgba(255,255,255,var(--lobby-alpha))" };

/**
 * ─── THE HEADER'S TOKENS — the one lobby surface correct in BOTH themes ───────
 *
 * Everything above this line is white-on-white by design, and the contrast note
 * at the top of this file is the measurement that justifies it. The HEADER is
 * different: it is the chrome a reader arrives on, it is the surface most likely
 * to be lifted into another shell, and `.dark` is a real class on this app
 * (client/src/contexts/ThemeContext.tsx puts it on <html>). So the header carries
 * its own ground and its own ink, each with a dark counterpart, and it stays
 * legible whichever theme is on.
 *
 * The ground is ONE variable — `--lobby-ground`, an RGB triple defined for both
 * themes in client/src/styles/index.css — composited with `--lobby-alpha`, so the
 * transparency slider keeps working in dark exactly as it does in light.
 *
 * These tokens are deliberately NOT retrofitted onto the panes: a dark pane with
 * light-theme slate-700 body copy would be the light-on-light failure this file
 * exists to prevent, in reverse. Widening them is a separate, measured pass.
 */
export const headerGroundStyle: CSSProperties = {
  background: "rgb(var(--lobby-ground) / var(--lobby-alpha))",
};

/** The header type ramp. Same sizes as TYPE, with an ink for each theme. */
export const HEAD = {
  /** The wordmark. */
  mark: "text-[15px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-50",
  /** A navigation noun or a control label. */
  nav: "text-[12.5px] font-semibold leading-none text-slate-700 dark:text-slate-300",
  /** The label on a state readout. */
  key: "text-[10.5px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400",
  /** A quoted figure. Tabular so the bar does not reflow as numbers change. */
  val: "font-mono text-[11.5px] tabular-nums leading-none text-slate-900 dark:text-slate-100",
  /** Fine print: shortcuts, provenance, the endpoint link. */
  fine: "text-[11px] leading-relaxed text-slate-600 dark:text-slate-400",
} as const;

/** The header's hairline, in both themes. */
export const HEAD_EDGE = "border-slate-900/10 dark:border-white/12";

/**
 * A quiet header control — window buttons, rail toggles.
 *
 * NO DISPLAY UTILITY HERE, deliberately. The old CONTROL token opened with
 * `inline-flex`, so a caller that wanted the control hidden on small screens
 * wrote `${CONTROL} hidden sm:inline-flex` and got two unprefixed display
 * utilities of equal specificity fighting in the stylesheet — `inline-flex` won,
 * and "Hide panes" / "Show rail" shipped VISIBLE on mobile, where both rails are
 * already hidden and neither button does anything. The display class now belongs
 * to the caller, which is the only place that knows when the control should show.
 */
export const HEAD_CONTROL =
  "items-center justify-center gap-1.5 rounded-lg border border-slate-900/10 " +
  "bg-white/60 text-slate-700 transition hover:bg-white hover:text-slate-900 " +
  "dark:border-white/12 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white " +
  "motion-reduce:transition-none " + FOCUS + " dark:focus-visible:ring-offset-slate-950";

/** The header's one dark control — Close. */
export const HEAD_CLOSE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-900/10 " +
  "bg-slate-900 text-white transition hover:bg-slate-800 " +
  "dark:border-white/15 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white " +
  "motion-reduce:transition-none " + FOCUS + " dark:focus-visible:ring-offset-slate-950";

/** The search field and the listbox that drops from it. */
export const HEAD_FIELD =
  "w-full rounded-lg border border-slate-900/12 bg-white/80 text-slate-900 placeholder:text-slate-500 " +
  "dark:border-white/12 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-400 " +
  FOCUS + " dark:focus-visible:ring-offset-slate-950";

export const HEAD_MENU =
  "rounded-xl border border-slate-900/10 bg-white shadow-[0_20px_50px_-18px_rgba(15,23,42,0.45)] " +
  "dark:border-white/12 dark:bg-slate-900 dark:shadow-[0_20px_50px_-18px_rgba(0,0,0,0.8)]";

/** A slightly cooler inset (a card inside a panel) so nesting stays legible. */
export const insetStyle: CSSProperties = { background: "rgba(248,250,252,0.72)" };

/** The page scrim behind everything. High floor: the page never bleeds into text. */
export function scrimStyle(alpha: number): CSSProperties {
  const s = Math.min(0.94, 0.62 + alpha * 0.32);
  return { background: `rgba(248,250,252,${s.toFixed(3)})` };
}

/** Honest state tones, used identically by every rail. Never colour alone — the
 *  label text always says the state too. */
export const TONE = {
  ok: "border-emerald-600/30 bg-emerald-50 text-emerald-800",
  failed: "border-rose-600/30 bg-rose-50 text-rose-800",
  running: "border-amber-600/30 bg-amber-50 text-amber-800",
  idle: "border-slate-900/10 bg-slate-100 text-slate-600",
  gold: "border-amber-600/35 bg-amber-50 text-amber-800",
} as const;

export const DOT = {
  ok: "bg-emerald-700",
  failed: "bg-rose-600",
  running: "bg-amber-700 motion-safe:animate-pulse",
  idle: "bg-slate-500",
} as const;
