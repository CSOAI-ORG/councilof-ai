/**
 * /motion-lab — the showroom for the scroll-world motion kit.
 *
 * Not linked from nav. It exists so the owner can scroll one page and judge every
 * component and every blend variant in situ, including the hard case: melting a
 * full-bleed photographic band into a flat colour band.
 *
 * Every section on this page is ordinary flow content. Scroll with JS disabled and
 * the page still reads top to bottom in the right order — that is the point.
 */
import { useEffect, useState } from "react";
import {
  CountUp,
  DrawOnScroll,
  GrainOverlay,
  ParallaxLayer,
  ScrollRail,
  SectionBlend,
  useReducedMotion,
} from "@/components/motion";

const WHITE = "#ffffff";
const GREY = "#f1f5f4";
const INK = "#03110b";
const EMERALD = "#10b981";
const IMAGE = "/images/coliseum_hero_arena.jpg";

const RAIL_TICKS = [
  { label: "Blends", elementId: "lab-blends" },
  { label: "Parallax", elementId: "lab-parallax" },
  { label: "Image band", elementId: "lab-image" },
  { label: "Draw", elementId: "lab-draw" },
  { label: "Numbers", elementId: "lab-numbers" },
  { label: "Gallery", elementId: "lab-gallery" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/80 font-semibold mb-2">
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-slate-600 max-w-2xl">{children}</p>;
}

/**
 * Board totals, fetched live. Nothing on this page types a figure by hand — see
 * the honesty guard in CountUp.tsx. If the endpoint is unreachable the numbers
 * stay unmeasured and say so.
 */
interface BoardTotals {
  axes: number | null;
  measured: number | null;
  items: number | null;
  stamp: string | null;
  error: string | null;
}

function useBoardTotals(): BoardTotals {
  const [state, setState] = useState<BoardTotals>({
    axes: null,
    measured: null,
    items: null,
    stamp: null,
    error: null,
  });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/gspc", { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: any = await res.json();
        const totals = json?.totals ?? {};
        if (!live) return;
        setState({
          axes:
            typeof totals.axes === "number"
              ? totals.axes
              : Array.isArray(json?.axes)
                ? json.axes.length
                : null,
          measured: typeof totals.measured_axes === "number" ? totals.measured_axes : null,
          items: typeof totals.items === "number" ? totals.items : null,
          stamp: json?.measured_on ?? json?.date ?? null,
          error: null,
        });
      } catch (e: any) {
        if (!live) return;
        setState({
          axes: null,
          measured: null,
          items: null,
          stamp: null,
          error: String(e?.message ?? e),
        });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return state;
}

export default function MotionLab() {
  const reduced = useReducedMotion();
  const board = useBoardTotals();

  return (
    <div style={{ background: WHITE }}>
      {/* Zero-space sticky rail. No layout offset, no content, aria-hidden. */}
      <ScrollRail position="left" ticks={RAIL_TICKS} color={EMERALD} />

      {/* ───────────────────────── intro (white) ───────────────────────── */}
      <section className="px-6 py-20 md:py-28" style={{ background: WHITE }}>
        <div className="mx-auto max-w-3xl">
          <Label>Motion lab</Label>
          <h1 className="text-4xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Scroll-world motion &amp; graphics kit
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">
            Six small, dependency-free components that let sections melt into one
            another instead of hard-cutting. Everything here animates{" "}
            <strong>transform and opacity only</strong>. Content never leaves normal
            document flow, nothing is <code>position: fixed</code>, nothing is
            pinned — so a slow bundle or a JS failure costs you the motion, never
            the page.
          </p>

          <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/70 p-5">
            <p className="text-sm font-semibold text-emerald-900">
              Reduced motion is {reduced ? "ON" : "OFF"} for you right now.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
              Every component reads <code>prefers-reduced-motion: reduce</code> live.
              To check the static fallback: macOS →{" "}
              <em>System Settings → Accessibility → Display → Reduce motion</em>;
              Windows → <em>Settings → Accessibility → Visual effects → Animation
              effects</em>; or in Chrome DevTools →{" "}
              <em>Rendering → Emulate CSS prefers-reduced-motion</em>. Toggle it and
              scroll again: the parallax settles at zero, the paths render fully
              drawn, the number appears at its true value. Nothing vanishes, nothing
              reflows.
            </p>
          </div>
        </div>
      </section>

      {/* white → grey */}
      <SectionBlend variant="wave" from={WHITE} to={GREY} height={110} />

      {/* ───────────────────────── blends (grey) ───────────────────────── */}
      <section id="lab-blends" className="px-6 py-16 md:py-24" style={{ background: GREY }}>
        <div className="mx-auto max-w-3xl">
          <Label>1 · SectionBlend</Label>
          <h2 className="text-3xl font-semibold text-slate-900">No more hard cuts</h2>
          <Note>
            You just crossed a <code>wave</code> blend from white into this grey.
            The blend is a plain block element between the two sections: its own
            background is the colour above, the filled shape is the colour below.
            It holds no content, it is <code>aria-hidden</code> and{" "}
            <code>pointer-events: none</code>, and it needs no JavaScript — so it
            can never overlap or hide a line of text.
          </Note>
        </div>
      </section>

      {/* grey → grey, showing a slope */}
      <SectionBlend variant="slope" from={GREY} to="#e2e8f0" height={80} />

      {/* ──────────────────────── parallax (light) ─────────────────────── */}
      <section
        id="lab-parallax"
        className="relative overflow-hidden px-6 py-24 md:py-32"
        style={{ background: "#e2e8f0" }}
      >
        <div className="mx-auto max-w-4xl">
          <Label>2 · ParallaxLayer</Label>
          <h2 className="text-3xl font-semibold text-slate-900">Depth, one loop</h2>
          <Note>
            Three layers drifting at different rates. All of them — and every other
            component on this page — share one scroll listener and one animation
            frame, with all measurements batched before any style write. Off-screen
            layers unsubscribe entirely.
          </Note>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <ParallaxLayer speed={-0.28} className="rounded-xl bg-white/80 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">speed −0.28</p>
              <p className="mt-2 text-slate-800">
                Background plate. Moves against the scroll, reads as further away.
              </p>
            </ParallaxLayer>
            <ParallaxLayer speed={0} className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">speed 0</p>
              <p className="mt-2 text-slate-800">
                The reference plane. Exactly where the CSS puts it — this is also
                what every layer looks like under reduced motion.
              </p>
            </ParallaxLayer>
            <ParallaxLayer speed={0.22} className="rounded-xl bg-white p-6 shadow-md">
              <p className="text-xs uppercase tracking-widest text-emerald-700">speed +0.22</p>
              <p className="mt-2 text-slate-800">
                Foreground card. Moves with the scroll, reads as nearer.
              </p>
            </ParallaxLayer>
          </div>
        </div>
      </section>

      {/*
        light → IMAGE BAND.
        The band below is a photograph, so the blend's lower half is transparent
        and it is placed at the TOP of the image section instead — see the flipped
        variant below. Here we simply fade the flat colour out.
      */}
      <SectionBlend variant="fade" from="#e2e8f0" to={INK} height={120} />

      {/* ─────────────────────── image band (photo) ────────────────────── */}
      <section
        id="lab-image"
        className="relative"
        style={{
          backgroundColor: INK,
          backgroundImage: `url(${IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 6 · GrainOverlay — absolute, decorative, off on mobile by default. */}
        <GrainOverlay opacity={0.05} />

        <div className="relative px-6 py-28 md:py-36">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl bg-black/55 p-8 backdrop-blur-sm">
              <Label>3 · Blending into an image</Label>
              <h2 className="text-3xl font-semibold text-white">The hard case</h2>
              <p className="mt-4 text-base leading-relaxed text-white/85">
                An SVG cannot be filled with a photograph, so the trick is to put
                the blend <em>inside</em> the image section with the side that
                touches the photo set to <code>transparent</code>. The transparent
                half lets the image show through; the filled half is the colour of
                the band that follows. Scroll on to see the arch do exactly that.
              </p>
              <div className="mt-8 text-emerald-300">
                <DrawOnScroll preset="arc" strokeWidth={2} ariaLabel="" />
              </div>
            </div>
          </div>
        </div>

        {/* image → white, as the last child of the image section. */}
        <SectionBlend variant="arch" from="transparent" to={WHITE} height={130} />
      </section>

      {/* ───────────────────────── draw (white) ────────────────────────── */}
      <section id="lab-draw" className="px-6 py-20 md:py-28" style={{ background: WHITE }}>
        <div className="mx-auto max-w-3xl">
          <Label>4 · DrawOnScroll</Label>
          <h2 className="text-3xl font-semibold text-slate-900">
            The ledger draws itself
          </h2>
          <Note>
            <code>stroke-dashoffset</code> driven by the element&rsquo;s own
            intersection progress. Three presets ship: the hash{" "}
            <code>chain</code>, the evidence <code>rail</code>, and a sweeping{" "}
            <code>arc</code>. Under reduced motion each renders fully drawn and
            static — the fallback is always &ldquo;visible and complete&rdquo;,
            never &ldquo;invisible&rdquo;.
          </Note>

          <div className="mt-14 space-y-16">
            <div className="text-emerald-600">
              <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                preset=&ldquo;chain&rdquo;
              </p>
              <DrawOnScroll preset="chain" strokeWidth={2} />
            </div>
            <div className="text-slate-800">
              <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                preset=&ldquo;rail&rdquo;
              </p>
              <DrawOnScroll preset="rail" strokeWidth={2} />
            </div>
            <div className="text-emerald-700">
              <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                preset=&ldquo;arc&rdquo;
              </p>
              <DrawOnScroll preset="arc" strokeWidth={3} />
            </div>
          </div>
        </div>
      </section>

      <SectionBlend variant="wave" from={WHITE} to={INK} height={110} flip />

      {/* ─────────────────────── numbers (ink) ─────────────────────────── */}
      <section id="lab-numbers" className="relative px-6 py-20 md:py-28" style={{ background: INK }}>
        <GrainOverlay opacity={0.045} />
        <div className="relative mx-auto max-w-3xl">
          <Label>5 · CountUp</Label>
          <h2 className="text-3xl font-semibold text-white">
            A number that cannot lie
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            These three figures are fetched from <code>/api/gspc</code> at page
            load. <strong>Nothing on this page is hardcoded.</strong> CountUp takes
            only a value handed to it, renders that true value as its text
            immediately, and merely overlays an animation on top after mount — so
            view-source, a screen reader, a copy/paste and an answer engine all read
            the measured figure, animation or not. If the endpoint is unreachable it
            shows an em dash and says the number is unmeasured. It never guesses.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { k: "Axes on the board", v: board.axes },
              { k: "Measured axis", v: board.measured },
              { k: "Items behind them", v: board.items },
            ].map((cell) => (
              <div key={cell.k} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-6">
                <p className="text-4xl font-semibold text-emerald-300 tabular-nums">
                  <CountUp value={cell.v} />
                </p>
                <p className="mt-2 text-sm text-white/70">{cell.k}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-white/55">
            Source: <code>GET /api/gspc</code>
            {board.stamp ? ` · measured ${board.stamp}` : ""}
            {board.error
              ? ` · endpoint unreachable in this environment (${board.error}) — the figures above stay unmeasured rather than inventing a value, which is the guard working.`
              : ""}
          </p>
        </div>
      </section>

      <SectionBlend variant="slope" from={INK} to={WHITE} height={90} flip />

      {/* ───────────────────── variant gallery (white) ─────────────────── */}
      <section id="lab-gallery" className="px-6 pt-20 pb-4" style={{ background: WHITE }}>
        <div className="mx-auto max-w-3xl">
          <Label>Gallery</Label>
          <h2 className="text-3xl font-semibold text-slate-900">
            Every blend variant, both flips
          </h2>
          <Note>
            Same two colours each time, so the shape is the only variable. Swap{" "}
            <code>from</code> and <code>to</code> for the opposite direction; use{" "}
            <code>flip</code> to mirror on <code>x</code>, <code>y</code>, or{" "}
            <code>xy</code>.
          </Note>
        </div>
      </section>

      {(["wave", "slope", "arch", "fade"] as const).map((variant) => (
        <div key={variant}>
          <div className="px-6 py-6" style={{ background: WHITE }}>
            <p className="mx-auto max-w-3xl text-xs uppercase tracking-widest text-slate-500">
              variant=&ldquo;{variant}&rdquo;
            </p>
          </div>
          <SectionBlend variant={variant} from={WHITE} to={GREY} height={90} />
          <div className="px-6 py-6" style={{ background: GREY }}>
            <p className="mx-auto max-w-3xl text-xs uppercase tracking-widest text-slate-500">
              variant=&ldquo;{variant}&rdquo; flip=&ldquo;y&rdquo;
            </p>
          </div>
          <SectionBlend variant={variant} from={GREY} to={WHITE} height={90} flip="y" />
        </div>
      ))}

      <section className="px-6 pt-10 pb-24" style={{ background: WHITE }}>
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-900">Integration note</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Nothing here is wired into the live homepage. The kit lives entirely in{" "}
            <code>client/src/components/motion/</code> and this page is its only
            consumer, so it can be adopted section by section once the in-flight
            homepage work lands. Import from{" "}
            <code>@/components/motion</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
