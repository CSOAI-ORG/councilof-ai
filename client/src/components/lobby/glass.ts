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
