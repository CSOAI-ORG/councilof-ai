/**
 * scrollEngine — ONE scroll listener and ONE rAF loop for the whole motion kit.
 *
 * WHY A MODULE-LEVEL REGISTRY, NOT A LISTENER PER COMPONENT
 * Every motion component on a page registers here. The engine attaches exactly one
 * passive `scroll` + `resize` listener (and only while at least one subscriber is
 * alive), then runs a single animation frame that is strictly phase-separated:
 *
 *     1. READ  phase  — every subscriber measures (getBoundingClientRect etc.)
 *     2. WRITE phase  — every subscriber mutates style (transform / opacity)
 *
 * Interleaving reads and writes is what causes layout thrash; batching all reads
 * before any write means at most one forced reflow per frame no matter how many
 * components are mounted.
 *
 * SAFETY CONTRACT (binding for every component in this directory)
 *  - The engine only ever sets `transform` and `opacity`. It never sets
 *    `position`, `display`, `visibility`, `height`, or removes nodes.
 *  - If this module never runs — JS disabled, bundle slow, an exception upstream —
 *    every component renders its correct static state and the page reads perfectly.
 *    Nothing here is load-bearing for content.
 *  - Nothing is `position: fixed` and nothing is pinned. Content stays in normal
 *    document flow, always.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ScrollFrame {
  /** window.scrollY at the top of this frame. */
  scrollY: number;
  /** Viewport height in CSS px. */
  viewportH: number;
  /** Viewport width in CSS px. */
  viewportW: number;
}

export interface ScrollSubscriber {
  /** Measure only. Must NOT write to the DOM. */
  read(frame: ScrollFrame): void;
  /** Mutate only (transform / opacity). Must NOT measure the DOM. */
  write(frame: ScrollFrame): void;
}

/** A per-frame callback used by time-based animations (CountUp). Return `false` to stop. */
export type Ticker = (nowMs: number) => boolean | void;

const canUseDOM = typeof window !== "undefined" && typeof document !== "undefined";

const subscribers = new Set<ScrollSubscriber>();
const tickers = new Set<Ticker>();

let rafId = 0;
let listening = false;

function currentFrame(): ScrollFrame {
  return {
    scrollY: window.scrollY || window.pageYOffset || 0,
    viewportH: window.innerHeight || 0,
    viewportW: window.innerWidth || 0,
  };
}

function runFrame(): void {
  rafId = 0;
  const frame = currentFrame();

  // ---- READ phase: measure everything first. ----
  for (const sub of subscribers) {
    try {
      sub.read(frame);
    } catch {
      /* a broken subscriber must never take the page down */
    }
  }

  // ---- WRITE phase: only transform/opacity mutations from here. ----
  for (const sub of subscribers) {
    try {
      sub.write(frame);
    } catch {
      /* ignore */
    }
  }

  // ---- Time-based tickers (self-scheduling until they return false). ----
  if (tickers.size) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const ticker of Array.from(tickers)) {
      let keep: boolean | void = false;
      try {
        keep = ticker(now);
      } catch {
        keep = false;
      }
      if (keep === false) tickers.delete(ticker);
    }
    if (tickers.size) schedule();
  }
}

/** Ask for one frame. Coalesces — many scroll events collapse into a single frame. */
export function schedule(): void {
  if (!canUseDOM || rafId) return;
  rafId = window.requestAnimationFrame(runFrame);
}

function onEvent(): void {
  schedule();
}

function syncListeners(): void {
  if (!canUseDOM) return;
  const needed = subscribers.size > 0 || tickers.size > 0;
  if (needed && !listening) {
    window.addEventListener("scroll", onEvent, { passive: true });
    window.addEventListener("resize", onEvent, { passive: true });
    window.addEventListener("orientationchange", onEvent, { passive: true });
    listening = true;
  } else if (!needed && listening) {
    window.removeEventListener("scroll", onEvent);
    window.removeEventListener("resize", onEvent);
    window.removeEventListener("orientationchange", onEvent);
    listening = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
}

/** Register a read/write pair. Returns an unsubscribe function. */
export function subscribe(sub: ScrollSubscriber): () => void {
  if (!canUseDOM) return () => {};
  subscribers.add(sub);
  syncListeners();
  schedule();
  return () => {
    subscribers.delete(sub);
    syncListeners();
  };
}

/** Register a per-frame ticker (used for time-based, non-scroll animation). */
export function addTicker(ticker: Ticker): () => void {
  if (!canUseDOM) return () => {};
  tickers.add(ticker);
  syncListeners();
  schedule();
  return () => {
    tickers.delete(ticker);
    syncListeners();
  };
}

/** `useLayoutEffect` on the client, `useEffect` during SSR/prerender (no warning). */
export const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;

/**
 * Subscribe a component to the shared loop.
 *
 * `read` and `write` are held in refs, so passing fresh closures every render does
 * NOT churn the subscription. Set `enabled` to false (reduced motion, off-screen,
 * no ref yet) to leave the loop entirely.
 */
export function useScrollEffect(
  read: (frame: ScrollFrame) => void,
  write: (frame: ScrollFrame) => void,
  enabled = true
): void {
  const readRef = useRef(read);
  const writeRef = useRef(write);
  readRef.current = read;
  writeRef.current = write;

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    return subscribe({
      read: (f) => readRef.current(f),
      write: (f) => writeRef.current(f),
    });
  }, [enabled]);
}

function readsReducedMotion(): boolean {
  // Default to REDUCED during SSR/prerender: the safe direction is "no animation,
  // correct static content", never "animate something we could not ask about".
  if (!canUseDOM || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Live `prefers-reduced-motion: reduce`. Every component in this kit must honour it. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readsReducedMotion);

  useEffect(() => {
    if (!canUseDOM || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // Safari < 14
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}

/** Matches a media query reactively. Starts `false` so the quiet state renders first. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!canUseDOM || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);

  return matches;
}

/**
 * True once the element has been near the viewport. Used to gate work: an
 * off-screen ParallaxLayer costs nothing because it is not in the read set.
 */
export function useNearViewport<T extends Element>(
  ref: React.RefObject<T | null>,
  rootMargin = "20% 0px 20% 0px"
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!canUseDOM || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true); // no IO → just participate; correctness over micro-perf
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setNear(entry.isIntersecting);
        schedule();
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return near;
}

export const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;
